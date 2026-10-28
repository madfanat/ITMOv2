# Logic specification · после согласования

Нормативный [контракт](contracts/api.md), решения [clarify](clarifications.md).
Это финальная редакция `drafts/logic.before.md`, до генерации кода.

FastAPI endpoint вызывает ReviewService с внедряемым async LLM Protocol.
Service проверяет длину исходного diff, маскирует поддерживаемые секреты,
строит prompt с diff как недоверенными данными, ожидает generate через
asyncio.wait_for(timeout=10.0), валидирует ответ Pydantic-моделью OUT-1.
Невалидная схема и evidence вне masked diff → 502 invalid_llm_response;
ошибка generate → 502 llm_unavailable; timeout → 504 llm_timeout.
CancelledError не превращается в 502. Plain dict/JSON провайдера
проверяется строго: без coercion типов, ≤3 risks, положительная line.

Given slow, When дедлайн истёк, Then coroutine отменена и возвращён 504.
Given concurrent /health, Then быстрый 200 во время slow. Given normal
после таймаута, Then 200: никакого общего mutable состояния сценариев.
Given невалидный ввод, Then 422/413 до generate. Given ошибка, Then
request_id совпадает с X-Request-ID; нет содержимого diff в ответе ошибки.

DemoProvider normal отвечает структурированным фиксированным результатом,
slow ожидает отмены, error вызывает исключение, invalid возвращает
сломанный объект. Заголовок X-Demo-Scenario ограничен enum и обрабатывается
per request. Не пытаться запускать настоящий SDK в потоке ради timeout.

SEC-1: PEM private key включая diff-префиксы; Bearer; известные префиксы
sk-/ghp_/github_pat_/AKIA; присваивания password/token/secret/api_key
в кавычках или без. Это эвристика с известными границами, не DLP-система.
Не логировать prompt, ответ LLM, исключения или validation input.

Сохранены 9 критериев L-01…L-09 из исходного черновика. Уточнения:
request_id в header на успехе, фиксированный envelope ошибок, браузерный
дедлайн 15 секунд и Unicode code points, GET /api/config для UI.
Приёмка человеком не заявлена.
