# Независимое review реализации US-03

Проверяющий: отдельный агент команды логики (`logic_spec`).
Дата: 2026-10-28; начало проверки 13:58 UTC.
Это независимая проверка исходников и выполненных команд, не человеческая приёмка.
Проверяющий не менял приложение и тесты; изменён только этот отчёт.

## Область проверки и команды

Прочитаны общий контракт `specs/003-llm-timeout/contracts/api.md`, все Python
модули `app/`, `app/logging.json`, `app/static/app.js`, `tests/test_review.py`
и Makefile. Команда из каталога practice_05:

```sh
.venv/bin/python -m pytest -q
```

Фактический результат: **37 passed in 0.30s**, exit code 0. Проверяющий
сам запустил runner, а не положился на отчёт автора.

Дополнительно отдельным inline Python-процессом выполнен HTTP-прогон через
`httpx.ASGITransport` с собственным отменяемым ProbeProvider и стандартным
10-секундным дедлайном. Этот прогон проверяет полный ASGI маршрут, но не
сетевой TCP транспорт и не браузер.

## Ожидание → факт → доказательство

| Сценарий | Ожидание | Факт и доказательство |
|---|---|---|
| Основной / старый успешный | 200; OUT-1; health продолжает работать | `test_success_preserves_contract_and_health` прошёл; ответ содержит ровно summary/risks/checks, ≤3 риска, X-Request-ID |
| Ошибка LLM / сломанная схема | Безопасный 502 с устойчивым code | `test_demo_failures_are_controlled`, `test_invalid_output_is_controlled` прошли; невалидные данные не отражаются в ответе |
| Timeout и отмена | 504 за реальные 10 секунд, coroutine отменена | Независимый прогон: **10.012 с**, HTTP **504**, `provider_cancelled=true`, code llm_timeout |
| Сервис отвечает во время LLM | Concurrent health быстро возвращает 200 | Тот же независимый прогон: health за **0.000566 с**; assert <0.1 с прошёл |
| Восстановление после timeout | Новый обычный запрос даёт 200 | Тот же независимый прогон: `retry_status=200`; request_id ошибки совпал с X-Request-ID и прошёл UUID validation |
| Отмена входного async запроса | CancelledError не превращается в 502 | `test_request_cancellation_propagates` прошёл; исходник app/review_service.py обрабатывает Exception, не BaseException |
| Валидация и старая граница | 20000 Unicode символов → 200; 20001 → 413; неверный ввод → 422 до generate | `test_unicode_boundary` для ASCII/кириллицы/emoji и `test_invalid_body_never_calls_provider` прошли |
| Секреты до провайдера | Поддерживаемые формы не попадают в prompt | 9 существующих spy-кейсов прошли, но независимый probe выявил дефект экранированных кавычек, см. ниже |
| Логирование | Только request_id/duration/status, без diff/ответа | `test_logs_only_metadata_on_success_and_failures` прошёл для success/timeout/provider error/schema error/422. Makefile отключает access log, logging.json использует plain JSON message |
| QA-1 | Неподтверждённые evidence не возвращаются | `test_invalid_output_is_controlled` отклоняет evidence вне masked diff; положительный `test_evidence_in_diff_is_accepted` прошёл |

## Найденный дефект R-01: секрет с escaped quote маскируется частично

Серьёзность: P1 для обещанной SEC-1 формы quoted assignment; исправить до сдачи.
Место: `app/review_service.py:18`, regex `_ASSIGNMENT`.

Ожидание: всё значение password/token в кавычках, включая escaped quote,
заменяется на `[REDACTED]` до сборки prompt.

Факт при независимом вызове `mask_secrets`:

```text
+password="safe\"still-secret" -> +password=[REDACTED]still-secret"
+token='safe\'still-secret'   -> +token=[REDACTED]still-secret'
```

В обоих случаях строка `still-secret` остаётся в masked diff и затем будет
передана провайдеру. Проверка `"still-secret" in result` дала True.
Это соответствует заявленному виду секретов (присваивание в кавычках),
а не неизвестному формату, исключённому оговоркой об эвристике.

Причина: ветви `"[^"\r\n]*"` и `'[^'\r\n]*'` завершаются на любой кавычке,
даже если она экранирована. Нужен разбор escaped characters внутри обеих
ветвей quoted string и два регрессионных spy-кейса с передачей в provider.
Проверяющий сообщил дефект основному агенту и сам код не менял.

## Ограничения вывода

Независимый прогон подтвердил серверный реальный deadline; браузерное демо,
внешний провайдер и production network transport в этой сессии не проверялись.
Отмена гарантируется для cooperative async provider; неотменяемый SDK в потоке
вне согласованной архитектуры. Эвристическая маскировка не заменяет DLP.
На момент первого review R-01 оставался открытым, поэтому проход существующих
37 тестов сам по себе ещё не означал готовность SEC-1 к сдаче.

## Повторная независимая проверка R-01 после исправления

Время: **2026-10-28 14:00:06 UTC**.
Прочитаны исправленный `_ASSIGNMENT`, уточнение
`specs/003-llm-timeout/review-amendment.md` и фактический red-отчёт
`evidence/security-red.txt`. Red-отчёт содержит два ожидаемых падения
новых проверок на исходной реализации: `2 failed, 9 passed, 28 deselected`.

Проверяющий повторно самостоятельно запустил `.venv/bin/python -m pytest -q`.
Результат: **39 passed in 0.28s**, exit code 0.
Дополнительно повторены оба первоначальных probe и отдельно выполнена
передача этих строк через ReviewService собственному spy-провайдеру:

```text
+password="safe\"still-secret" -> +password=[REDACTED]
+token='safe\'still-secret'   -> +token=[REDACTED]
```

В обоих masked diff отсутствуют `safe` и `still-secret`; spy подтвердил,
что suffix `still-secret` отсутствует и в фактическом prompt. Исправление
учитывает backslash-escaped символы в обеих разновидностях кавычек.
**R-01 закрыт по результатам независимого retest.**

Итог этой проверки: существенных открытых дефектов в проверенной области
не осталось; основной, ошибочный, граничный и старый сценарии подтверждены.
Указанные выше ограничения (demo, cooperative cancellation, эвристическая
маскировка, отдельная браузерная проверка) сохраняются. Это вывод проверяющего
агента для сдачи, не человеческая приёмка.
