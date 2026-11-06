# Отчёт о выполнении · 2026-10-28

## Применённый процесс

1. **Explore.** Прочитаны все 16 слайдов PDF и P1-артефакты. Выбрана
   US-03 — третий сценарий бэклога; отсутствие runnable backend отмечено.
2. **Constitution / Specify.** Установлен specify-cli 0.12.11, выполнен
   init. Два отдельных агента создали UI/logic drafts и журналы сессий.
3. **Clarify / Plan / Tasks.** Разобраны расхождения и записан общий
   контракт. Оба агента проверили финальные документы до реализации.
   Снимок SHA-256 с `application_exists=false` сохранён до app/.
4. **Tests first / Implement.** До реализации написаны API/unit tests;
   исходный red — ожидаемая ошибка collection из-за отсутствующего app.
   Отдельный baseline из учебного патча воспроизводит 4 нарушения правил.
   После реализации — 37 успешных проверок.
5. **Independent review.** Другой агент самостоятельно прочитал код,
   запустил тесты и probe. Найден escaped-quote leak при маскировке.
   Уточнение → два реально падающих теста → исправление → 39 passed.
6. **Analyze / Acceptance evidence.** Браузерный E2E через реальный HTTP,
   smoke и скриншоты. Проверено соответствие пяти AC и конституции.
   Финальная приёмка человеком остаётся за рамками работы агента.

## Baseline → результат

| Проверка | Исходный патч | После рефакторинга |
|---|---|---|
| POST {} | 500 | 422 invalid_request |
| 20001 символ | 200 | 413 diff_too_large |
| Успешный ответ | comment | summary, risks≤3, checks |
| Пароль в prompt | Открытый текст | Поддерживаемые формы замаскированы |
| Таймаут | Отсутствует (проверка исходного кода) | 504 после 10 с, coroutine отменена |
| Повтор после таймаута | Не задан | Тот же diff, normal → 200 |

## Трассируемость

| AC / правило | Реализация | Доказательство |
|---|---|---|
| AC-01 / OUT-1 | models.Review + API response_model | test_success_preserves_contract_and_health, test_invalid_output_is_controlled, E2E success |
| AC-02 / REL-1 | ReviewService, asyncio.wait_for | test_timeout_cancels_provider, test_request_cancellation_propagates, E2E real_deadline |
| AC-03 / retry | app.js states, submitReview | E2E retry_after_timeout, ui-timeout.png |
| AC-04 / API-1 | strict request + len / Array.from | invalid body/JSON, Unicode boundary unit/API + E2E |
| AC-05 / SEC-1 | mask_secrets + spy | test_secrets_are_masked_before_provider, security-red.txt → tdd-green.txt |
| AC-05 / QA-1 | evidence containment, Demo risks=[] | test_evidence_in_diff_is_accepted, invalid output cases |
| AC-05 / OBS-1 | metadata middleware + logging config | test_logs_only_metadata_on_success_and_failures; e2e-server.log |
| SCOPE-1 | Только advisory response | Нет GitHub client, shell execution или auto-fix |
| Доступность сервиса | Async I/O | health во время pending provider, E2E concurrent health |

## Фактические артефакты

- `evidence/specify-init.txt`, `specify-version.txt`, `specify-prerequisites.json` — реальные операции Spec Kit.
- `evidence/ui-spec-session.md`, `logic-spec-session.md` — независимые спецификации и повторная проверка.
- `evidence/spec-before-code.json`, `spec-before-code/` — время и неизменяемый snapshot до кода.
- `evidence/spec-alignment.diff` — обе пары before/after.
- `evidence/baseline.json`, `baseline-red.txt`, `tdd-red.txt` — исходные проблемы и test-first.
- `evidence/security-red.txt`, `tdd-green.txt` — регрессия по результату ревью и исправление.
- `evidence/independent-review.md` — самостоятельные проверки другого агента.
- `evidence/e2e.json`, `e2e-server.log` — HTTP/browser результаты и только разрешённые metadata.
- `evidence/ui-success.png`, `ui-timeout.png`, `ui-mobile.png` — фактический UI.
- `evidence/smoke.json` — проверка уже запущенного локального сервиса.

Количество, длительности и статусы брать из файлов evidence; они не
подменены обещаниями тестового плана. В браузерном замере время включает
действие Playwright и ожидание UI; точная серверная duration в JSON log.

## Ограничения

DemoProvider не выполняет реальное AI-ревью. Маскировка — эвристика для
заданных форм секретов. Отмена корректна для cooperative async provider;
блокирующий SDK нельзя подставлять без отдельного архитектурного решения.
Нет авторизации, БД и production deployment — они не требуются US-03.
