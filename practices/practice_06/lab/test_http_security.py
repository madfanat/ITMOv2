"""HTTP parsing, browser protections and bounded worker checks on loopback."""

import http.client
import json
import socket
import threading
import unittest
from unittest.mock import patch

from service import LocalServer, Shop, make_handler


class HttpSecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.shop = Shop()
        cls.server = LocalServer(("127.0.0.1", 0), make_handler(cls.shop))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_port

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join(timeout=5)
        cls.server.server_close()
        cls.shop.close()

    def call(self, body, headers=None, path="/login", method="POST"):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            connection.request(method, path, body, {"Content-Type": "application/json", **(headers or {})})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read().decode()
        finally:
            connection.close()

    def test_malformed_json_and_non_object(self):
        for raw in (b"{", b"[]", b"null", b'"text"', b'\xff', b'{"x":NaN}',
                    b'{"x":Infinity}', b'{"x":1,"x":2}', b'[' * 1100 + b']' * 1100):
            with self.subTest(raw=raw[:30]):
                status, _, body = self.call(raw)
                self.assertEqual(status, 400)
                self.assertNotIn("Traceback", body)
                self.assertNotIn("JSONDecodeError", body)

    def test_wrong_content_type(self):
        self.assertEqual(self.call(b"{}", {"Content-Type": "text/plain"})[0], 415)

    def test_oversized_body(self):
        self.assertEqual(self.call(b"x" * 65537)[0], 413)

    def test_invalid_content_length(self):
        for length in ("-1", "wat", "99999999999999999"):
            with self.subTest(length=length):
                self.assertEqual(self.call(b"", {"Content-Length": length})[0], 400)

    def test_transfer_encoding_denied(self):
        self.assertEqual(self.call(b"{}", {"Transfer-Encoding": "chunked"})[0], 400)

    def test_cross_origin_and_dns_rebinding(self):
        self.assertEqual(self.call(b"{}", {"Origin": "https://example.invalid"})[0], 403)
        self.assertEqual(self.call(b"{}", {"Host": f"attacker.invalid:{self.port}"})[0], 400)

    def test_get_body_denied(self):
        self.assertEqual(self.call(b"{}", path="/health", method="GET")[0], 400)

    def test_security_headers(self):
        status, headers, _ = self.call(None, path="/reviews/view", method="GET")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("default-src 'none'", headers["Content-Security-Policy"])
        self.assertNotIn("Python", headers["Server"])

    def test_http_owner_enforcement(self):
        _, _, body = self.call(json.dumps({"username": "alice", "password": "learn-alice"}).encode())
        token = json.loads(body)["token"]
        self.assertEqual(self.call(None, {"X-Token": token}, "/profile?id=2", "GET")[0], 403)
        self.assertEqual(self.call(None, {"X-Token": token}, "/profile?id=1", "GET")[0], 200)
        self.assertEqual(self.call(b'{"decision":{"tool":"delete_tree","arguments":{"path":"."}}}',
                                   {"X-Token": token}, "/assistant/execute")[0], 403)
        self.assertTrue(self.shop.sandbox.root.exists())

    def test_duplicate_headers_rejected(self):
        for duplicate in ("Content-Length: 0\r\nContent-Length: 0", "Host: localhost", "Content-Type: text/plain"):
            with self.subTest(duplicate=duplicate):
                request = (f"POST /login HTTP/1.1\r\nHost: 127.0.0.1:{self.port}\r\n"
                           f"Content-Type: application/json\r\n{duplicate}\r\n\r\n").encode()
                with socket.create_connection(("127.0.0.1", self.port), timeout=5) as client:
                    client.sendall(request)
                    reply = client.recv(1024)
                    self.assertTrue(b" 400 " in reply or b" 415 " in reply, reply)

    def test_unexpected_exception_does_not_leak(self):
        with patch.object(self.shop, "_dispatch", side_effect=RuntimeError("TEST_SECRET_SQL_PATH")):
            status, _, body = self.call(None, path="/health", method="GET")
        self.assertEqual((status, json.loads(body)), (500, {"error": "internal error"}))
        self.assertNotIn("TEST_SECRET_SQL_PATH", body)

    def test_worker_limit_closes_excess_connection(self):
        acquired = [self.server.workers.acquire(blocking=False) for _ in range(16)]
        self.assertTrue(all(acquired))
        try:
            with socket.create_connection(("127.0.0.1", self.port), timeout=5) as client:
                # Server rejects the socket before constructing a handler.
                self.assertEqual(client.recv(1), b"")
        finally:
            for _ in acquired:
                self.server.workers.release()

    def test_loopback_required(self):
        with self.assertRaises(ValueError):
            LocalServer(("0.0.0.0", 0), make_handler(self.shop))


if __name__ == "__main__":
    unittest.main()
