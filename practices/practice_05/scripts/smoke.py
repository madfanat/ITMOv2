"""Acceptance against an already running service (takes about ten seconds)."""
import argparse
import json
import time

import httpx


parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:8005")
args = parser.parse_args()
results = []
with httpx.Client(base_url=args.url, timeout=15) as client:
    health = client.get("/health")
    assert health.json() == {"status": "ok"}
    for scenario, status in [("normal", 200), ("slow", 504), ("normal", 200)]:
        start = time.monotonic()
        response = client.post("/api/reviews", json={"diff": "+print('hello')"}, headers={"X-Demo-Scenario": scenario})
        assert response.status_code == status
        if status == 504:
            assert response.json()["error"]["code"] == "llm_timeout"
            assert 9.5 <= time.monotonic() - start <= 12
        results.append({"scenario": scenario, "status": status, "seconds": round(time.monotonic() - start, 3), "body": response.json()})
    assert client.post("/api/reviews", json={"diff": "x" * 20001}).status_code == 413
    assert client.post("/api/reviews", json={}).status_code == 422
print(json.dumps({"url": args.url, "health": "ok", "checks": results, "boundary": 413, "missing_diff": 422}, ensure_ascii=False, indent=2))
