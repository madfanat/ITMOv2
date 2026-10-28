import asyncio
import json
import logging

import httpx
import pytest

from app.api import create_app
from app.review_service import ReviewError, ReviewService


GOOD = {"summary": "Demo review", "risks": [], "checks": ["Run tests"]}
DIFF = "--- a/app.py\n+++ b/app.py\n@@ -1 +1 @@\n-old\n+new\n"


class SpyProvider:
    def __init__(self, result=None):
        self.result = GOOD if result is None else result
        self.prompts = []

    async def generate(self, prompt):
        self.prompts.append(prompt)
        return self.result


class PendingProvider:
    def __init__(self):
        self.started = asyncio.Event()
        self.cancelled = False

    async def generate(self, prompt):
        self.started.set()
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            self.cancelled = True
            raise


def client_for(app):
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


async def test_success_preserves_contract_and_health():
    async with client_for(create_app()) as client:
        response = await client.post("/api/reviews", json={"diff": DIFF})
        assert response.status_code == 200
        assert set(response.json()) == {"summary", "risks", "checks"}
        assert len(response.json()["risks"]) <= 3
        assert response.headers["x-request-id"]
        assert (await client.get("/health")).json() == {"status": "ok"}


async def test_timeout_cancels_provider():
    provider = PendingProvider()
    start = asyncio.get_running_loop().time()
    with pytest.raises(ReviewError) as error:
        await ReviewService(provider, timeout_seconds=0.03).review(DIFF)
    assert error.value.status == 504
    assert error.value.code == "llm_timeout"
    assert provider.cancelled
    assert asyncio.get_running_loop().time() - start < 0.5


async def test_request_cancellation_propagates():
    provider = PendingProvider()
    task = asyncio.create_task(ReviewService(provider).review(DIFF))
    await provider.started.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert provider.cancelled


async def test_health_during_timeout_and_successful_retry():
    provider = PendingProvider()
    app = create_app(provider_factory=lambda scenario: provider if scenario == "slow" else SpyProvider(), timeout_seconds=0.08)
    async with client_for(app) as client:
        task = asyncio.create_task(client.post("/api/reviews", json={"diff": DIFF}, headers={"X-Demo-Scenario": "slow"}))
        await provider.started.wait()
        health = await asyncio.wait_for(client.get("/health"), timeout=0.05)
        assert health.status_code == 200
        response = await task
        assert response.status_code == 504
        assert response.json()["error"]["code"] == "llm_timeout"
        assert response.json()["request_id"] == response.headers["x-request-id"]
        assert provider.cancelled
        assert (await client.post("/api/reviews", json={"diff": DIFF})).status_code == 200


@pytest.mark.parametrize("payload", [{}, {"diff": None}, {"diff": 5}, {"diff": True}, {"diff": []}, {"diff": ""}, {"diff": " \n\t"}, {"diff": "valid", "extra": 1}])
async def test_invalid_body_never_calls_provider(payload):
    provider = SpyProvider()
    async with client_for(create_app(provider_factory=lambda scenario: provider)) as client:
        response = await client.post("/api/reviews", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
    assert provider.prompts == []


async def test_malformed_json_has_safe_error():
    async with client_for(create_app()) as client:
        response = await client.post("/api/reviews", content='{"diff":"super-secret",', headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert "super-secret" not in response.text


@pytest.mark.parametrize("character", ["a", "я", "😀"])
async def test_unicode_boundary(character):
    provider = SpyProvider()
    async with client_for(create_app(provider_factory=lambda scenario: provider)) as client:
        accepted = await client.post("/api/reviews", json={"diff": character * 20000})
        rejected = await client.post("/api/reviews", json={"diff": character * 20001})
    assert accepted.status_code == 200
    assert rejected.status_code == 413
    assert rejected.json()["error"]["code"] == "diff_too_large"
    assert len(provider.prompts) == 1


@pytest.mark.parametrize("text,secret", [
    ('+password="hunter2"', "hunter2"),
    ("+API_KEY = 'fake-api-key-123'", "fake-api-key-123"),
    ('+"token": "fake-json-token"', "fake-json-token"),
    (r'+password="safe\"still-secret"', "still-secret"),
    (r"+token='safe\'still-secret'", "still-secret"),
    ("Authorization: Bearer abc.def.ghi", "abc.def.ghi"),
    ("+ghp_1234567890abcdefghijklmnop", "ghp_1234567890abcdefghijklmnop"),
    ("+sk-abcdefghijklmnopqrstuv", "sk-abcdefghijklmnopqrstuv"),
    ("+github_pat_1234567890abcdefghijklmnop", "github_pat_1234567890abcdefghijklmnop"),
    ("+AKIA1234567890ABCDEF", "AKIA1234567890ABCDEF"),
    ("+-----BEGIN RSA PRIVATE KEY-----\n+veryPrivateKeyMaterial\n+-----END RSA PRIVATE KEY-----", "veryPrivateKeyMaterial"),
])
async def test_secrets_are_masked_before_provider(text, secret):
    provider = SpyProvider()
    await ReviewService(provider).review(text)
    assert secret not in provider.prompts[0]
    assert "[REDACTED]" in provider.prompts[0]


@pytest.mark.parametrize("result", [
    {"comment": "unstructured"},
    {"summary": 5, "risks": [], "checks": []},
    {**GOOD, "extra": "invalid"},
    {**GOOD, "checks": "run tests"},
    {**GOOD, "risks": [{"file": "a.py", "line": 1, "evidence": "+new", "risk": "risk"}] * 4},
    {**GOOD, "risks": [{"file": "a.py", "line": 0, "evidence": "+new", "risk": "risk"}]},
    {**GOOD, "risks": [{"file": "a.py", "line": 1, "evidence": "invented evidence", "risk": "risk"}]},
])
async def test_invalid_output_is_controlled(result):
    app = create_app(provider_factory=lambda scenario: SpyProvider(result))
    async with client_for(app) as client:
        response = await client.post("/api/reviews", json={"diff": DIFF})
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "invalid_llm_response"
    assert "invented evidence" not in response.text


async def test_evidence_in_diff_is_accepted():
    result = {**GOOD, "risks": [{"file": "app.py", "line": 1, "evidence": "+new", "risk": "Check behavior"}]}
    review = await ReviewService(SpyProvider(result)).review(DIFF)
    assert review.risks[0].evidence == "+new"


@pytest.mark.parametrize("scenario,code", [("error", "llm_unavailable"), ("invalid", "invalid_llm_response")])
async def test_demo_failures_are_controlled(scenario, code):
    async with client_for(create_app()) as client:
        response = await client.post("/api/reviews", json={"diff": DIFF}, headers={"X-Demo-Scenario": scenario})
    assert response.status_code == 502
    assert response.json()["error"]["code"] == code


async def test_unknown_demo_scenario_rejected():
    async with client_for(create_app()) as client:
        response = await client.post("/api/reviews", json={"diff": DIFF}, headers={"X-Demo-Scenario": "unknown"})
    assert response.status_code == 422


async def test_logs_only_metadata_on_success_and_failures(caplog):
    caplog.set_level(logging.INFO, logger="ai_review.requests")
    async with client_for(create_app(timeout_seconds=0.01)) as client:
        for scenario in ("normal", "slow", "error", "invalid"):
            await client.post("/api/reviews", json={"diff": "password=super-secret"}, headers={"X-Demo-Scenario": scenario})
        await client.post("/api/reviews", json={"diff": 123})
    records = [r for r in caplog.records if r.name == "ai_review.requests"]
    assert len(records) == 5
    for record in records:
        entry = json.loads(record.getMessage())
        assert set(entry) == {"request_id", "duration", "status"}
        assert entry["duration"] >= 0
    assert "super-secret" not in caplog.text
    assert "Demo review" not in caplog.text
