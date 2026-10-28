# Plan / design

## Исследование

В practice_05 исходно только PDF. Проект AI-ревью задан артефактами P1
и `TRAINING_PR.diff`; demo из P3 — другой продукт (подписки), использовать
его вместо US-03 нельзя. Baseline восстанавливается из учебного патча,
его дефекты фиксируются до реализации. Существующие P1–P4 не редактируются.

## Решение

Минимальные слои: Pydantic models → ReviewService → cancellable async
Provider; FastAPI выполняет HTTP mapping; статический UI того же origin.
Нет БД, React, очереди, платных API или внешней инфраструктуры.

```mermaid
sequenceDiagram
    actor User as Разработчик
    participant UI as Браузер
    participant API as FastAPI
    participant S as ReviewService
    participant LLM as Async DemoProvider
    User->>UI: Diff + сценарий
    UI->>API: POST /api/reviews + X-Demo-Scenario
    API->>S: Валидный diff
    S->>S: Лимит + маскировка секретов
    S->>LLM: generate(masked prompt), deadline 10 s
    alt Ответ вовремя
        LLM-->>S: JSON
        S->>S: Проверка OUT-1 / evidence
        S-->>API: Review
        API-->>UI: 200 summary/risks/checks
    else Deadline
        S->>LLM: Cancel
        S-->>API: llm_timeout
        API-->>UI: 504 error + request_id
        UI-->>User: Таймаут; diff сохранён; Повторить
    end
```

Конституция проверяется по архитектуре: library-first (FastAPI/Pydantic),
TDD (red до app), integration (ASGI + реальный HTTP), CLI (Makefile),
Mermaid и Given/When/Then. Исключений нет.

## Проверки и риски

Unit: deadline/cancel, CancelledError, masking/spy, schema/evidence.
Integration: HTTP 200/413/422/502/504, Unicode 20000/20001, safe logs,
health concurrency. Browser E2E: loading → timeout за реальные 10 секунд
→ manual retry → success; HTML-as-text, граница, provider error.

Cooperative cancellation не ограничивает блокирующий вызов: поэтому
Protocol только async, DemoProvider использует await. Маскировка regex
не распознаёт произвольные секреты; конкретные формы покрываются тестами.
Demo проверяет управление запросами, не качество AI-ревью. Браузерный
fallback может не отменить внешнюю работу при обрыве соединения;
серверный 10-секундный лимит всё равно действует.
