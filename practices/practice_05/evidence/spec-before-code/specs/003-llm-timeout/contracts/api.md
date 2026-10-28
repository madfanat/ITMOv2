# Общий контракт v1

Зафиксирован до реализации 2026-10-28. Одинаков для UI и логики.

## Запрос

`POST /api/reviews`, Content-Type: application/json, тело ровно
`{"diff":"непустая строка"}`. Только строка, без приведения типов;
whitespace-only запрещён; максимум 20000 Unicode code points.
`X-Demo-Scenario: normal|slow|error|invalid`, default normal — управляет
локальным DemoProvider. В теле запроса управляющих полей нет.

## Ответы

| HTTP | Тело / error.code | UI state | Повтор |
|---|---|---|---|
| 200 | summary: string, risks: array≤3, checks: string[] | success | Новый запрос |
| 413 | diff_too_large | error | После исправления |
| 422 | invalid_request | error | После исправления |
| 502 | llm_unavailable или invalid_llm_response | error | Вручную |
| 504 | llm_timeout | timeout | Вручную |

Risk: `{"file":"app.py","line":1,"evidence":"строка из masked diff","risk":"описание"}`.
Line — положительное целое; evidence — непустая подстрока masked diff.
Demo возвращает пустой risks, не выдумывая доказательств.

Любая ошибка имеет ровно такую внешнюю форму:

```json
{"error":{"code":"llm_timeout","message":"LLM не ответила за 10 секунд. Повторите запрос."},"request_id":"UUID"}
```

Во всех ответах есть `X-Request-ID: UUID`; в успехе request_id не добавляется
в тело. 422 не отражает исходный diff и внутренние детали валидатора.
Чужие исключения и невалидный ответ LLM не попадают в сообщения.

`GET /health` → `{"status":"ok"}`. `GET /` → UI, `GET /api/config` →
`{"demo":true,"timeout_seconds":10.0,"max_diff_chars":20000}` для отображения
реальной конфигурации UI. JS/CSS обслуживаются с того же origin.

## Время, состояние и безопасность

Сервер ожидает только generate максимум 10.0 секунд, отменяет coroutine
и не проглатывает CancelledError запроса. Provider поддерживает cooperative
cancellation; блокирующие SDK и CPU-bound работа в event loop запрещены.
Браузер использует 15 секунд для сетевого fallback; это состояние error,
а не подтверждённый серверный timeout. Автоповторов нет.

В loading очищается результат, блокируется submit, сохраняется diff.
На timeout показываются сообщение и «Повторить». Ничего не хранится в
localStorage; ответ рендерится через textContent. Серверный журнал:
только request_id, duration (миллисекунды), status (HTTP). Uvicorn access
log выключен в команде запуска.
