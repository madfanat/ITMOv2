"""Real HTTP + browser acceptance, including the actual 10-second deadline."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time

import httpx
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence"
DIFF = "--- a/app.py\n+++ b/app.py\n@@ -1 +1 @@\n-print('old')\n+print('new')\n"


def main():
    EVIDENCE.mkdir(exist_ok=True)
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    url = f"http://127.0.0.1:{port}"
    checks = []
    errors = []
    with (EVIDENCE / "e2e-server.log").open("w") as log:
        server = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "app.api:app", "--host", "127.0.0.1",
            "--port", str(port), "--no-access-log", "--log-config", "app/logging.json",
        ], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        try:
            with httpx.Client(base_url=url, timeout=1) as client:
                for _ in range(100):
                    if server.poll() is not None:
                        raise RuntimeError("server exited; see evidence/e2e-server.log")
                    try:
                        if client.get("/health").status_code == 200:
                            break
                    except httpx.TransportError:
                        pass
                    time.sleep(0.05)
                else:
                    raise RuntimeError("server did not start")
            chrome = os.environ.get("CHROME_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
            mac_chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
            if not chrome and mac_chrome.exists():
                chrome = str(mac_chrome)
            with sync_playwright() as p:
                launch = {"headless": True}
                if chrome:
                    launch["executable_path"] = chrome
                browser = p.chromium.launch(**launch)
                page = browser.new_page(viewport={"width": 1280, "height": 1080}, device_scale_factor=1)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(url)
                state = page.locator("#review-state")
                page.locator("#diff").fill(DIFF)
                page.locator("#scenario").select_option("normal")
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "success")
                expect(page.locator("#result")).to_be_visible()
                page.screenshot(path=str(EVIDENCE / "ui-success.png"), full_page=True)
                checks.append({"name": "success", "result": "200 and structured review visible"})

                page.locator("#scenario").select_option("slow")
                started = time.monotonic()
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "loading")
                expect(page.locator("#submit")).to_be_disabled()
                expect(page.locator("#result")).to_be_hidden()
                with httpx.Client(base_url=url, timeout=1) as client:
                    health_started = time.monotonic()
                    assert client.get("/health").status_code == 200
                    health_seconds = time.monotonic() - health_started
                    assert health_seconds < 0.5
                with page.expect_response(lambda response: response.url.endswith("/api/reviews"), timeout=13000) as timed:
                    expect(state).to_have_attribute("data-state", "timeout", timeout=13000)
                response = timed.value
                elapsed = time.monotonic() - started
                assert response.status == 504
                assert response.json()["error"]["code"] == "llm_timeout"
                assert 9.5 <= elapsed <= 12.0, elapsed
                expect(page.locator("#diff")).to_have_value(DIFF)
                expect(page.locator("#retry")).to_be_visible()
                page.screenshot(path=str(EVIDENCE / "ui-timeout.png"), full_page=True)
                checks.append({"name": "real_deadline", "status": 504, "seconds": round(elapsed, 3), "health_seconds": round(health_seconds, 4), "diff_preserved": True})

                page.locator("#scenario").select_option("normal")
                page.locator("#retry").click()
                expect(state).to_have_attribute("data-state", "success")
                expect(page.locator("#diff")).to_have_value(DIFF)
                checks.append({"name": "retry_after_timeout", "result": "same diff, 200, success"})

                for scenario, code in [("error", "llm_unavailable"), ("invalid", "invalid_llm_response")]:
                    page.locator("#scenario").select_option(scenario)
                    with page.expect_response(lambda response: response.url.endswith("/api/reviews")) as failed:
                        page.locator("#submit").click()
                    assert failed.value.status == 502
                    assert failed.value.json()["error"]["code"] == code
                    expect(state).to_have_attribute("data-state", "error")
                    expect(page.locator("#result")).to_be_hidden()
                    checks.append({"name": scenario, "status": 502, "code": code})

                page.locator("#scenario").select_option("normal")
                page.locator("#diff").fill("😀" * 20000)
                with page.expect_response(lambda response: response.url.endswith("/api/reviews")) as boundary:
                    page.locator("#submit").click()
                assert boundary.value.status == 200
                expect(state).to_have_attribute("data-state", "success")
                page.locator("#diff").fill("😀" * 20001)
                calls = []
                page.on("request", lambda request: calls.append(request.url) if request.url.endswith("/api/reviews") else None)
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "error")
                expect(page.locator("#error")).to_contain_text("20 000")
                assert not calls
                checks.append({"name": "unicode_boundary", "at_limit_status": 200, "over_limit": "rejected in UI before fetch"})

                payload = '<img src=x onerror="window.injected=true">'
                page.route("**/api/reviews", lambda route: route.fulfill(status=200, content_type="application/json", body=json.dumps({"summary": payload, "risks": [], "checks": [payload]})))
                page.locator("#diff").fill(DIFF)
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "success")
                expect(page.locator("#summary")).to_have_text(payload)
                assert page.locator("#result img").count() == 0
                assert page.evaluate("window.injected === undefined")
                checks.append({"name": "untrusted_output", "result": "HTML displayed as literal text"})
                page.unroute("**/api/reviews")

                page.route("**/api/reviews", lambda route: route.abort())
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "error")
                expect(page.locator("#error")).to_contain_text("соединение")
                checks.append({"name": "network_error", "result": "error state; not server timeout"})
                page.unroute("**/api/reviews")

                page.set_viewport_size({"width": 390, "height": 844})
                page.locator("#scenario").select_option("normal")
                page.locator("#submit").click()
                expect(state).to_have_attribute("data-state", "success")
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(EVIDENCE / "ui-mobile.png"), full_page=True)
                checks.append({"name": "mobile", "result": "390px, no horizontal overflow"})
                assert errors == [], errors
                browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)
    report = {"passed": len(checks), "checks": checks, "browser_errors": errors, "deadline_seconds": 10.0}
    (EVIDENCE / "e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
