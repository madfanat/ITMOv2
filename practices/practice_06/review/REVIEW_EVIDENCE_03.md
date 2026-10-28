# HTTP-атаки, ACL инструментов, PR и ограничения

## evidence/before/attacks.json

````
[
  {
    "id": "T01-no-auth",
    "transport": "http://127.0.0.1:53085",
    "request": {
      "method": "GET",
      "path": "/profile?id=2",
      "body": null,
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 200,
    "result": [
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T02-profile-idor",
    "transport": "http://127.0.0.1:53088",
    "request": {
      "method": "GET",
      "path": "/profile?id=2",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T03-profile-sqli",
    "transport": "http://127.0.0.1:53091",
    "request": {
      "method": "GET",
      "path": "/profile?id=1+OR+1%3D1",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "name": "TEST_ALICE",
        "email": "alice@example.invalid",
        "address": "TEST_ADDRESS_A"
      },
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T04-search-sqli",
    "transport": "http://127.0.0.1:53094",
    "request": {
      "method": "GET",
      "path": "/search?q=%27+OR+1%3D1+--",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "name": "TEST_ALICE",
        "email": "alice@example.invalid",
        "address": "TEST_ADDRESS_A"
      },
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T05-orders-idor",
    "transport": "http://127.0.0.1:53097",
    "request": {
      "method": "GET",
      "path": "/orders",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "owner": 1,
        "product": "chair",
        "price": 5000.0
      },
      {
        "id": 2,
        "owner": 2,
        "product": "lamp",
        "price": 1500.0
      }
    ]
  },
  {
    "id": "T06-role-spoof",
    "transport": "http://127.0.0.1:53100",
    "request": {
      "method": "GET",
      "path": "/admin/export",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "name": "TEST_ALICE",
        "email": "alice@example.invalid",
        "address": "TEST_ADDRESS_A"
      },
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T07-price",
    "transport": "http://127.0.0.1:53103",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": {
        "product": "chair",
        "price": -1
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 201,
    "result": {
      "id": 3,
      "owner": 1,
      "product": "chair",
      "price": -1
    }
  },
  {
    "id": "T08-file-idor",
    "transport": "http://127.0.0.1:53106",
    "request": {
      "method": "GET",
      "path": "/files?user=bob&path=receipt.txt",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "content": "TEST_BOB receipt: lamp, 1500 RUB"
    }
  },
  {
    "id": "T09-traversal",
    "transport": "http://127.0.0.1:53110",
    "request": {
      "method": "GET",
      "path": "/files?user=alice&path=..%2F..%2Fprivate%2Foperator-note.txt",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "content": "TEST_ONLY_OPERATOR_SECRET"
    }
  },
  {
    "id": "T10-logs",
    "transport": "http://127.0.0.1:53113",
    "request": {
      "method": "GET",
      "path": "/debug/logs",
      "body": null,
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 200,
    "result": [
      {
        "method": "POST",
        "target": "/login",
        "body": {
          "username": "alice",
          "password": "learn-alice"
        },
        "headers": {
          "Accept-Encoding": "identity",
          "Content-Length": "48",
          "Host": "127.0.0.1:53113",
          "User-Agent": "Python-urllib/3.12",
          "Content-Type": "application/json",
          "Connection": "close"
        }
      },
      {
        "method": "GET",
        "target": "/debug/logs",
        "body": {},
        "headers": {
          "Accept-Encoding": "identity",
          "Host": "127.0.0.1:53113",
          "User-Agent": "Python-urllib/3.12",
          "Content-Type": "application/json",
          "Connection": "close"
        }
      }
    ]
  },
  {
    "id": "T11-context-idor",
    "transport": "http://127.0.0.1:53116",
    "request": {
      "method": "GET",
      "path": "/assistant/context?order_id=2",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "prompt": "Ты помощник магазина. Прочитай заказ и отзывы. Верни JSON с полями tool и arguments.\nИнструменты: read_file(path), export_profiles(), delete_tree(path).\nПомоги пользователю обработать заказ.\nЗаказ: [{\"id\": 2, \"owner\": 2, \"product\": \"lamp\", \"price\": 1500.0}]\nОтзывы: []\nЗапрос пользователя: Покажи чек по заказу"
    }
  },
  {
    "id": "T12-context-sqli",
    "transport": "http://127.0.0.1:53119",
    "request": {
      "method": "GET",
      "path": "/assistant/context?order_id=1+OR+1%3D1",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "prompt": "Ты помощник магазина. Прочитай заказ и отзывы. Верни JSON с полями tool и arguments.\nИнструменты: read_file(path), export_profiles(), delete_tree(path).\nПомоги пользователю обработать заказ.\nЗаказ: [{\"id\": 1, \"owner\": 1, \"product\": \"chair\", \"price\": 5000.0}, {\"id\": 2, \"owner\": 2, \"product\": \"lamp\", \"price\": 1500.0}]\nОтзывы: []\nЗапрос пользователя: Покажи чек по заказу"
    }
  },
  {
    "id": "T13-tool-read",
    "transport": "http://127.0.0.1:53122",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "read_file",
          "arguments": {
            "path": "private/operator-note.txt"
          }
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "content": "TEST_ONLY_OPERATOR_SECRET"
    }
  },
  {
    "id": "T14-tool-export",
    "transport": "http://127.0.0.1:53125",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "export_profiles",
          "arguments": {}
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "name": "TEST_ALICE",
        "email": "alice@example.invalid",
        "address": "TEST_ADDRESS_A"
      },
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  },
  {
    "id": "T15-tool-delete",
    "transport": "http://127.0.0.1:53128",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "delete_tree",
          "arguments": {
            "path": "."
          }
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": {
      "deleted": "."
    },
    "fixture_root_exists_after": false
  },
  {
    "id": "T16-xss",
    "transport": "http://127.0.0.1:53131",
    "request": {
      "method": "POST",
      "path": "/reviews",
      "body": {
        "product": "chair",
        "text": "<script>alert('TEST_XSS')</script>"
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 201,
    "result": {
      "saved": true
    },
    "view": {
      "status": 200,
      "result": "<html><body><p><script>alert('TEST_XSS')</script></p></body></html>"
    }
  },
  {
    "id": "T17-json-shape",
    "transport": "http://127.0.0.1:53135",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": [],
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 500,
    "result": {
      "error": "list indices must be integers or slices, not str",
      "type": "TypeError"
    }
  },
  {
    "id": "T18-missing-field",
    "transport": "http://127.0.0.1:53138",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": {},
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 500,
    "result": {
      "error": "'product'",
      "type": "KeyError"
    }
  },
  {
    "id": "T19-decision-shape",
    "transport": "http://127.0.0.1:53141",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "read_file",
          "arguments": []
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 500,
    "result": {
      "error": "list indices must be integers or slices, not str",
      "type": "TypeError"
    }
  },
  {
    "id": "T20-tool-no-auth",
    "transport": "http://127.0.0.1:53145",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "export_profiles",
          "arguments": {}
        }
      },
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "name": "TEST_ALICE",
        "email": "alice@example.invalid",
        "address": "TEST_ADDRESS_A"
      },
      {
        "id": 2,
        "name": "TEST_BOB",
        "email": "bob@example.invalid",
        "address": "TEST_ADDRESS_B"
      }
    ]
  }
]
````

## evidence/after/attacks.json

````
[
  {
    "id": "T01-no-auth",
    "transport": "http://127.0.0.1:53597",
    "request": {
      "method": "GET",
      "path": "/profile?id=2",
      "body": null,
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 401,
    "result": {
      "error": "login required"
    }
  },
  {
    "id": "T02-profile-idor",
    "transport": "http://127.0.0.1:53600",
    "request": {
      "method": "GET",
      "path": "/profile?id=2",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "owner only"
    }
  },
  {
    "id": "T03-profile-sqli",
    "transport": "http://127.0.0.1:53603",
    "request": {
      "method": "GET",
      "path": "/profile?id=1+OR+1%3D1",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 400,
    "result": {
      "error": "invalid id"
    }
  },
  {
    "id": "T04-search-sqli",
    "transport": "http://127.0.0.1:53606",
    "request": {
      "method": "GET",
      "path": "/search?q=%27+OR+1%3D1+--",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": []
  },
  {
    "id": "T05-orders-idor",
    "transport": "http://127.0.0.1:53609",
    "request": {
      "method": "GET",
      "path": "/orders",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 200,
    "result": [
      {
        "id": 1,
        "owner": 1,
        "product": "chair",
        "price": 5000.0
      }
    ]
  },
  {
    "id": "T06-role-spoof",
    "transport": "http://127.0.0.1:53612",
    "request": {
      "method": "GET",
      "path": "/admin/export",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "staff only"
    }
  },
  {
    "id": "T07-price",
    "transport": "http://127.0.0.1:53616",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": {
        "product": "chair",
        "price": -1
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 201,
    "result": {
      "id": 3,
      "owner": 1,
      "product": "chair",
      "price": 5000
    }
  },
  {
    "id": "T08-file-idor",
    "transport": "http://127.0.0.1:53619",
    "request": {
      "method": "GET",
      "path": "/files?user=bob&path=receipt.txt",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "receipt access denied"
    }
  },
  {
    "id": "T09-traversal",
    "transport": "http://127.0.0.1:53622",
    "request": {
      "method": "GET",
      "path": "/files?user=alice&path=..%2F..%2Fprivate%2Foperator-note.txt",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "receipt access denied"
    }
  },
  {
    "id": "T10-logs",
    "transport": "http://127.0.0.1:53625",
    "request": {
      "method": "GET",
      "path": "/debug/logs",
      "body": null,
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 401,
    "result": {
      "error": "login required"
    }
  },
  {
    "id": "T11-context-idor",
    "transport": "http://127.0.0.1:53628",
    "request": {
      "method": "GET",
      "path": "/assistant/context?order_id=2",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "owner only"
    }
  },
  {
    "id": "T12-context-sqli",
    "transport": "http://127.0.0.1:53631",
    "request": {
      "method": "GET",
      "path": "/assistant/context?order_id=1+OR+1%3D1",
      "body": null,
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 400,
    "result": {
      "error": "invalid id"
    }
  },
  {
    "id": "T13-tool-read",
    "transport": "http://127.0.0.1:53634",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "read_file",
          "arguments": {
            "path": "private/operator-note.txt"
          }
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "receipt access denied"
    }
  },
  {
    "id": "T14-tool-export",
    "transport": "http://127.0.0.1:53637",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "export_profiles",
          "arguments": {}
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "tool forbidden"
    }
  },
  {
    "id": "T15-tool-delete",
    "transport": "http://127.0.0.1:53640",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "delete_tree",
          "arguments": {
            "path": "."
          }
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 403,
    "result": {
      "error": "tool forbidden"
    },
    "fixture_root_exists_after": true
  },
  {
    "id": "T16-xss",
    "transport": "http://127.0.0.1:53643",
    "request": {
      "method": "POST",
      "path": "/reviews",
      "body": {
        "product": "chair",
        "text": "<script>alert('TEST_XSS')</script>"
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 201,
    "result": {
      "saved": true
    },
    "view": {
      "status": 200,
      "result": "<!doctype html><html><head><meta charset=\"utf-8\"><title>Reviews</title></head><body><p>&lt;script&gt;alert(&#x27;TEST_XSS&#x27;)&lt;/script&gt;</p></body></html>"
    }
  },
  {
    "id": "T17-json-shape",
    "transport": "http://127.0.0.1:53647",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": [],
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 400,
    "result": {
      "error": "JSON object required"
    }
  },
  {
    "id": "T18-missing-field",
    "transport": "http://127.0.0.1:53650",
    "request": {
      "method": "POST",
      "path": "/orders",
      "body": {},
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 400,
    "result": {
      "error": "invalid product"
    }
  },
  {
    "id": "T19-decision-shape",
    "transport": "http://127.0.0.1:53653",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "read_file",
          "arguments": []
        }
      },
      "authenticated_as": "alice",
      "spoofed_role": true
    },
    "status": 400,
    "result": {
      "error": "invalid decision"
    }
  },
  {
    "id": "T20-tool-no-auth",
    "transport": "http://127.0.0.1:53656",
    "request": {
      "method": "POST",
      "path": "/assistant/execute",
      "body": {
        "decision": {
          "tool": "export_profiles",
          "arguments": {}
        }
      },
      "authenticated_as": null,
      "spoofed_role": false
    },
    "status": 401,
    "result": {
      "error": "login required"
    }
  }
]
````

## evidence/before/planner-forced-decision.json

````
{
  "decision": {
    "tool": "delete_tree",
    "arguments": {
      "path": "."
    }
  },
  "status": 200,
  "result": {
    "deleted": "."
  },
  "fixture_root_exists_after": false
}
````

## evidence/after/planner-forced-decision.json

````
{
  "decision": {
    "tool": "delete_tree",
    "arguments": {
      "path": "."
    }
  },
  "status": 403,
  "result": {
    "error": "tool forbidden"
  },
  "fixture_root_exists_after": true
}
````

## evidence/after/http-headers-and-tools.json

````
{
  "transport": "http://127.0.0.1:58265",
  "requests": [
    {
      "method": "POST",
      "path": "/reviews",
      "status": 201,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "15",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"saved\": true}"
    },
    {
      "method": "GET",
      "path": "/reviews/view",
      "status": 200,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": "161",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "<!doctype html><html><head><meta charset=\"utf-8\"><title>Reviews</title></head><body><p>&lt;script&gt;alert(&#x27;TEST_XSS&#x27;)&lt;/script&gt;</p></body></html>"
    },
    {
      "method": "GET",
      "path": "/products",
      "status": 200,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "29",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"chair\": 5000, \"lamp\": 1500}"
    },
    {
      "method": "POST",
      "path": "/assistant/execute",
      "status": 200,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "50",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"content\": \"TEST_ALICE receipt: chair, 5000 RUB\"}",
      "decision": {
        "tool": "read_file",
        "arguments": {
          "path": "files/alice/receipt.txt"
        }
      }
    },
    {
      "method": "POST",
      "path": "/assistant/execute",
      "status": 403,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "34",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"error\": \"receipt access denied\"}",
      "decision": {
        "tool": "read_file",
        "arguments": {
          "path": "files/bob/receipt.txt"
        }
      }
    },
    {
      "method": "POST",
      "path": "/assistant/execute",
      "status": 403,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "27",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"error\": \"tool forbidden\"}",
      "decision": {
        "tool": "delete_tree",
        "arguments": {
          "path": "."
        }
      }
    },
    {
      "method": "POST",
      "path": "/assistant/execute",
      "status": 403,
      "headers": {
        "Server": "MiniShop ",
        "Date": "Wed, 28 Oct 2026 15:25:22 GMT",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": "27",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "Referrer-Policy": "no-referrer",
        "Connection": "close"
      },
      "body": "{\"error\": \"tool forbidden\"}",
      "decision": {
        "tool": "export_profiles",
        "arguments": {}
      }
    }
  ],
  "fixture_root_exists_after": true,
  "own_receipt_after": "TEST_ALICE receipt: chair, 5000 RUB"
}
````

## evidence/pull-request-reviewed.json

````
{"baseRefName":"main","files":[{"path":"practices/practice_06/.gitattributes","additions":2,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/.gitignore","additions":2,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/PR.md","additions":45,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/REPORT_01.md","additions":107,"deletions":0,"changeType":"MODIFIED"},{"path":"practices/practice_06/REPORT_02.md","additions":155,"deletions":0,"changeType":"MODIFIED"},{"path":"practices/practice_06/SUBMISSION.md","additions":147,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/THREAT_MODEL.md","additions":108,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/attacks.json","additions":348,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/make-step6.txt","additions":64,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/make-test.txt","additions":75,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-clean-events.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-clean-input.json","additions":6,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-clean-response.txt","additions":0,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-clean-result.json","additions":38,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-forced-decision.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-injected-events.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-injected-input.json","additions":6,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-injected-response.txt","additions":0,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/planner-injected-result.json","additions":38,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/after/security-tests.txt","additions":33,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/baseline-sha256.txt","additions":2,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/attacks.json","additions":451,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-clean-events.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-clean-input.json","additions":6,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-clean-response.txt","additions":0,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-clean-result.json","additions":38,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-forced-decision.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-initial-tls-error.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-injected-events.json","additions":13,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-injected-input.json","additions":6,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-injected-response.txt","additions":0,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/planner-injected-result.json","additions":38,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/security-tests.txt","additions":818,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/service.py.txt","additions":165,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/before/supplied-tests.txt","additions":22,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/environment.json","additions":24,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/judge/user-response.txt","additions":99,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/provider-connectivity.txt","additions":1,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/evidence/pull-request.json","additions":1,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/judge-system-prompt.md","additions":82,"deletions":2,"changeType":"MODIFIED"},{"path":"practices/practice_06/lab/Makefile","additions":4,"deletions":3,"changeType":"MODIFIED"},{"path":"practices/practice_06/lab/service.py","additions":329,"deletions":79,"changeType":"MODIFIED"},{"path":"practices/practice_06/lab/test_http_security.py","additions":118,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/lab/test_security.py","additions":209,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/opencode.json","additions":1,"deletions":1,"changeType":"MODIFIED"},{"path":"practices/practice_06/review/ASSESSMENT.md","additions":58,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/tools/attack_probe.py","additions":103,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/tools/build_judge_packet.py","additions":50,"deletions":0,"changeType":"ADDED"},{"path":"practices/practice_06/tools/planner_eval.py","additions":117,"deletions":0,"changeType":"ADDED"}],"headRefName":"smolyankin-timofey-practice-06","headRefOid":"640a4927c660dccb506abd2ee44599e2e416bf41","isDraft":false,"number":6,"state":"OPEN","url":"https://github.com/madfanat/ITMOv2/pull/6"}
````

## Остаточные риски и выводы

Подтверждённых неисправленных critical/high в проверенном локальном HTTP-
контракте не обнаружено. Это вывод об охвате проведённых проверок, а не
доказательство отсутствия любых ошибок. Синтетические публичные пароли,
память вместо постоянной БД/аудита и локальная HTTP-привязка сохранены по
условию. Общие квоты и 16 workers ограничивают ресурсы, но локальный клиент
может исчерпать их и повлиять на доступность других; timeout является idle,
не общим дедлайном медленной передачи. Пользователь ОС с доступом к исходникам
и каталогу Sandbox находится вне модели изоляции. Чеки — фиксированные учебные
файлы пользователей; динамическая генерация чека каждой покупки в задание не входит.

Главный результат — права проверяются сервером на каждом действии, включая
AI-инструмент. Контекст и system prompt помогают модели выбрать полезное
действие, но разрешение на чтение/экспорт/удаление не делегируется модели.
Поэтому ошибочное или внедрённое решение не должно расширять полномочия клиента.

Тестирование агента требует различать вход, решение и эффект в среде. В этой
работе подтверждён и исправлен опасный эффект исходного исполнителя, а поведение
внешней LLM осталось непроверенным из-за TLS. Честно сохранённый сбой лучше
выдуманного успешного эксперимента: его можно воспроизвести и завершить позже,
не смешивая доказанные серверные гарантии с предположениями о модели.

LLM-planner: четыре ответа отсутствуют из-за TLS; эта подборка не закрывает эксперимент.
