"""Local HTTP evidence, using only a fresh synthetic Shop per case.

Run from lab/: python3 ../tools/attack_probe.py ../evidence/before
Never accepts a remote URL. Tokens/passwords in this trace are lab fixtures.
"""

import json
import importlib.machinery
import importlib.util
import sys
import threading
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "lab"))
from service import Shop, make_handler
from http.server import ThreadingHTTPServer


def call(base, method, path, body=None, headers=None):
    request = Request(base + path, method=method,
                      data=json.dumps(body).encode() if body is not None else None,
                      headers={"Content-Type": "application/json", **(headers or {})})
    try:
        response = urlopen(request, timeout=5)
    except HTTPError as exc:
        response = exc
    with response:
        raw = response.read().decode()
        try:
            result = json.loads(raw)
        except ValueError:
            result = raw
        return {"status": response.status, "result": result}


CASES = [
    ("T01-no-auth", "GET", "/profile?id=2", None, False),
    ("T02-profile-idor", "GET", "/profile?id=2", None, True),
    ("T03-profile-sqli", "GET", "/profile?" + urlencode({"id": "1 OR 1=1"}), None, True),
    ("T04-search-sqli", "GET", "/search?" + urlencode({"q": "' OR 1=1 --"}), None, True),
    ("T05-orders-idor", "GET", "/orders", None, True),
    ("T06-role-spoof", "GET", "/admin/export", None, True),
    ("T07-price", "POST", "/orders", {"product": "chair", "price": -1}, True),
    ("T08-file-idor", "GET", "/files?user=bob&path=receipt.txt", None, True),
    ("T09-traversal", "GET", "/files?" + urlencode({"user": "alice", "path": "../../private/operator-note.txt"}), None, True),
    ("T10-logs", "GET", "/debug/logs", None, False),
    ("T11-context-idor", "GET", "/assistant/context?order_id=2", None, True),
    ("T12-context-sqli", "GET", "/assistant/context?" + urlencode({"order_id": "1 OR 1=1"}), None, True),
    ("T13-tool-read", "POST", "/assistant/execute", {"decision": {"tool": "read_file", "arguments": {"path": "private/operator-note.txt"}}}, True),
    ("T14-tool-export", "POST", "/assistant/execute", {"decision": {"tool": "export_profiles", "arguments": {}}}, True),
    ("T15-tool-delete", "POST", "/assistant/execute", {"decision": {"tool": "delete_tree", "arguments": {"path": "."}}}, True),
    ("T16-xss", "POST", "/reviews", {"product": "chair", "text": "<script>alert('TEST_XSS')</script>"}, True),
    ("T17-json-shape", "POST", "/orders", [], True),
    ("T18-missing-field", "POST", "/orders", {}, True),
    ("T19-decision-shape", "POST", "/assistant/execute", {"decision": {"tool": "read_file", "arguments": []}}, True),
    ("T20-tool-no-auth", "POST", "/assistant/execute", {"decision": {"tool": "export_profiles", "arguments": {}}}, False),
]


def main():
    output = Path(sys.argv[1]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    shop_class, handler_factory = Shop, make_handler
    if "--baseline" in sys.argv[2:]:
        source = Path(__file__).resolve().parents[1] / "evidence/before/service.py.txt"
        loader = importlib.machinery.SourceFileLoader("baseline_probe", str(source))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        baseline = importlib.util.module_from_spec(spec)
        loader.exec_module(baseline)
        shop_class, handler_factory = baseline.Shop, baseline.make_handler
    results = []
    for name, method, path, body, authenticated in CASES:
        shop = shop_class()
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler_factory(shop))
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            login = call(base, "POST", "/login", {"username": "alice", "password": "learn-alice"})
            auth = {"X-Token": login["result"]["token"], "X-Role": "staff"} if authenticated else {}
            response = call(base, method, path, body, auth)
            entry = {"id": name, "transport": base, "request": {"method": method, "path": path, "body": body,
                     "authenticated_as": "alice" if authenticated else None, "spoofed_role": authenticated}, **response}
            if name == "T15-tool-delete":
                entry["fixture_root_exists_after"] = shop.sandbox.root.exists()
            if name == "T16-xss":
                entry["view"] = call(base, "GET", "/reviews/view", headers=auth)
            results.append(entry)
        finally:
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()
            shop.close()
    (output / "attacks.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({r["id"]: r["status"] for r in results}, indent=2))


if __name__ == "__main__":
    main()
