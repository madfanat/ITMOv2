"""Reproduce the actual added code from P1's patch, without changing P1."""
import json
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
patch = (ROOT.parent / "practice_01/TRAINING_PR.diff").read_text()
sections = patch.split("diff --git ")[1:]
sources = {}
for section in sections:
    name = section.splitlines()[0].split()[1][2:]
    sources[name] = "\n".join(
        line[1:] for line in section.splitlines()
        if line.startswith(("+", " ")) and not line.startswith("+++")
    )

class Stub:
    def __init__(self):
        self.prompt = None

    def generate(self, prompt):
        self.prompt = prompt
        return "unstructured review"

scope = {}
exec(sources["app/review_service.py"], scope)
stub = Stub()
service = scope["ReviewService"](stub)
api = FastAPI()
api_scope = {"review_service": service}
exec(sources["app/api.py"].replace("from app.dependencies import review_service", ""), api_scope)
api = api_scope["app"]
client = TestClient(api, raise_server_exceptions=False)
success = client.post("/api/reviews", json={"diff": "password=baseline-secret"})
observations = {
    "source": "P1 TRAINING_PR.diff: context + added lines; only dependency import replaced by local stub",
    "missing_diff_status": client.post("/api/reviews", json={}).status_code,
    "long_diff_status": client.post("/api/reviews", json={"diff": "x" * 20001}).status_code,
    "success_fields": list(success.json()),
    "secret_sent_unmasked": "baseline-secret" in stub.prompt if stub.prompt else False,
    "timeout": "no timeout/cancellation in original synchronous review method (source inspection)",
}
# Capture masking observation using a dedicated call, since long_diff changed the prompt.
service.review("password=baseline-secret")
observations["secret_sent_unmasked"] = "baseline-secret" in stub.prompt
print(json.dumps(observations, ensure_ascii=False, indent=2))
if "--verify" in sys.argv:
    requirements = {
        "API validation": observations["missing_diff_status"] == 422,
        "API size limit": observations["long_diff_status"] == 413,
        "OUT-1": set(observations["success_fields"]) == {"summary", "risks", "checks"},
        "SEC-1": not observations["secret_sent_unmasked"],
    }
    for name, passed in requirements.items():
        print(f"{'PASS' if passed else 'FAIL'}: {name}")
    raise SystemExit(0 if all(requirements.values()) else 1)
