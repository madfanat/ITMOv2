"""Capture fixed requests against a disposable loopback Shop, including headers."""

import json
import sys
import threading
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "lab"))
from service import LocalServer, Shop, make_handler


def main():
    shop = Shop()
    server = LocalServer(("127.0.0.1", 0), make_handler(shop))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    records = []

    def call(method, path, body=None, auth=None):
        request = Request(base + path, method=method, headers={"Content-Type": "application/json", **(auth or {})},
                          data=json.dumps(body).encode() if body is not None else None)
        try:
            response = urlopen(request, timeout=5)
        except HTTPError as exc:
            response = exc
        with response:
            text = response.read().decode()
            result = {"method": method, "path": path, "status": response.status,
                      "headers": dict(response.headers), "body": text}
        # Login response contains an ephemeral token, excluded from evidence.
        if path != "/login":
            records.append(result)
        return result

    try:
        token = json.loads(call("POST", "/login", {"username": "alice", "password": "learn-alice"})["body"])["token"]
        auth = {"X-Token": token}
        call("POST", "/reviews", {"product": "chair", "text": "<script>alert('TEST_XSS')</script>"}, auth)
        for path in ("/reviews/view", "/products"):
            call("GET", path)
        for decision in ({"tool": "read_file", "arguments": {"path": "files/alice/receipt.txt"}},
                         {"tool": "read_file", "arguments": {"path": "files/bob/receipt.txt"}},
                         {"tool": "delete_tree", "arguments": {"path": "."}},
                         {"tool": "export_profiles", "arguments": {}}):
            record = call("POST", "/assistant/execute", {"decision": decision}, auth)
            record["decision"] = decision
        receipt = shop.sandbox.read("files/alice/receipt.txt")
        evidence = {"transport": base, "requests": records, "fixture_root_exists_after": shop.sandbox.root.exists(),
                    "own_receipt_after": receipt}
        (ROOT / "evidence/after/http-headers-and-tools.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n")
        print("HTTP headers and tool ACL evidence captured; fixture remains intact")
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()
        shop.close()


if __name__ == "__main__":
    main()
