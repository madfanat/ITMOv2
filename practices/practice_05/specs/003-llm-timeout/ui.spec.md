# UI specification · после согласования

Нормативный [контракт](contracts/api.md), решения [clarify](clarifications.md).
Это финальная редакция черновика `drafts/ui.before.md`, до генерации кода.

Один экран GET /: label «Diff», textarea, счётчик Unicode code points,
селектор явно локальных demo-сценариев normal/slow/error/invalid, submit,
статус, summary/risks/checks и кнопка повтора. GET /api/config сообщает
серверный deadline и лимит. UI не обещает настоящее AI-ревью в demo.

| State | Поведение |
|---|---|
| idle | Ввод diff; пустой результат |
| loading | aria-busy=true, «Выполняется ревью…», submit/retry disabled, старый результат скрыт |
| success | Результат 200 как текст; при risks=[] сообщение об отсутствии подтверждённых рисков |
| timeout | Только HTTP 504 + error.code=llm_timeout; сообщение и ручной повтор; diff сохранён |
| error | 413/422/502, невалидный ответ сервера, сеть или клиентский deadline; безопасное сообщение |

Given валидный ввод, When submit, Then POST с JSON diff и header
X-Demo-Scenario. Given 504, When ответ получен, Then timeout и кнопка
«Повторить». Given timeout и normal, When retry, Then тот же diff, 200,
success. Given emoji, When подсчёт, Then Array.from(value).length
соответствует серверному len. Given HTML в ответе, Then textContent
предотвращает выполнение разметки. Given ошибка локальной валидации,
Then fetch не вызывается; сервер независимо валидирует те же границы.

Label связан с textarea, status имеет aria-live, ошибка role=alert,
управление доступно клавиатурой, состояние передаётся текстом. Ввод
не сохраняется вне памяти страницы. Нативный maxlength не использовать:
он считает UTF-16 code units и нарушил бы лимит для emoji.

Изменения от черновика: единая вложенная ошибка; X-Request-ID;
X-Demo-Scenario; явный fallback 15 секунд; уточнение Unicode; нет
плоской error-строки. Приёмка человеком не заявлена.
