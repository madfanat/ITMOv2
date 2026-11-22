# Защита лабораторной 7.1

Workflow опубликован на учебном n8n. 23 ноября 2026 года GitHub доставил напрямую три подписанных webhook для PR №10. Основная модель GPT‑4.1 mini и вторая модель Gemini 2.5 Flash опубликовали по три комментария. Повторная команда основного ревью была пропущена. [Workflow](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj) · [Тестовый PR](https://github.com/madfanat/ITMOv2/pull/10) · [Files changed](https://github.com/madfanat/ITMOv2/pull/10/files).

## Критерии и подтверждения

| Критерий | Результат на учебном n8n | Материалы |
| --- | --- | --- |
| 1. Вторая модель (2 балла) | Команда `/make_other_ai_review` запустила `google/gemini-2.5-flash` в execution №7589. GitHub принял ревью `6014809315` с тремя комментариями. | [Команда](https://github.com/madfanat/ITMOv2/pull/10#issuecomment-7086668259) · [Execution №7589](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/7589) · [Снимок Executions](evidence/course-execution-7589.png) · [Ревью Gemini](https://github.com/madfanat/ITMOv2/pull/10#pullrequestreview-6014809315) |
| 2. Запись ID PR (2 балла) | После автоматического ревью при открытии PR в execution №7588 появилась строка с `pr_id = 5443962681`, номером PR `10` и `review_id = 6014807246`. Gemini обновила ту же строку своим ID ревью. | [Execution №7588](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/7588) · [Снимок Executions](evidence/course-execution-7588.png) · [Data Table](https://n8n-itmo.cyrweb.ru/projects/qCEYnOmqtgpgej4S/datatables/BnklmwRpBIzvNb8p) · [Снимок таблицы](evidence/course-data-table.png) |
| 3. Дедупликация (3 балла) | `/make_ai_review` завершилась в `Skip review` со статусом `already_reviewed` в execution №7591. Модель не вызывалась. В PR осталось два ревью и шесть точечных комментариев. | [Команда](https://github.com/madfanat/ITMOv2/pull/10#issuecomment-7086681549) · [Execution №7591](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/7591) · [Снимок Executions](evidence/course-execution-7591.png) |
| 4. Точечные комментарии (5 баллов) | Из одного hunk выделены три группы изменений. GitHub принял якоря `RIGHT:2`, `LEFT:7` и `RIGHT:10` в обоих ревью. | [Снимок Files changed](evidence/course-github-inline-review.png) · [Ревью GPT‑4.1 mini](https://github.com/madfanat/ITMOv2/pull/10#pullrequestreview-6014807246) · [Ревью Gemini](https://github.com/madfanat/ITMOv2/pull/10#pullrequestreview-6014809315) |

[Журнал сквозной проверки](evidence/course-verification.json) связывает ID прямых HTTPS-доставок GitHub с запусками n8n, строкой Data Table и комментариями. [Экспорт учебного workflow](../workflow.course.json) · [План работы](plan.md) · [Текст PR](pr.md).

## Порядок живой демонстрации

Описание экзамена отводит 12 баллов практике 7.1 и требует показать критерии по порядку на одном PR. На защите можно использовать уже настроенный PR №10. Держите открытыми GitHub, Executions и Data Tables.

1. Отправьте команду второй модели. Дождитесь нового execution и откройте опубликованное ревью. В заголовке будет `google/gemini-2.5-flash`.

   ```sh
   make -C practices/practice_07.1/defence review-other PR=10
   ```

2. Сверьте `pr_id` в Data Table с глобальным ID GitHub и покажите `review_id` нового ревью. Поле `last_model` показывает модель, опубликовавшую последнее ревью.

   ```sh
   make -C practices/practice_07.1/defence inspect-pr PR=10
   ```

3. Прочитайте список ревью. Отправьте основную команду в том же PR, дождитесь execution и покажите `Skip review`. Снова прочитайте список ревью и подтвердите, что количество сохранилось.

   ```sh
   make -C practices/practice_07.1/defence inspect-reviews PR=10
   make -C practices/practice_07.1/defence review-repeat PR=10
   make -C practices/practice_07.1/defence inspect-reviews PR=10
   ```

4. Откройте **Files changed** и покажите три точки привязки. Средний блок содержит только удаления, поэтому комментарий стоит на старой строке 7.

   ```sh
   make -C practices/practice_07.1/defence inspect-inline PR=10
   ```

[Команды демонстрации](Makefile). Проверки маршрутизации, дедупликации, разбора diff и проверки SHA прошли на обоих экспортах, по 18 сценариев на каждый.

```sh
make -C practices/practice_07.1/defence test
```

## Как объяснить решение

- `Route GitHub event` различает открытие PR и два точных комментария-команды. Открытие и `/make_ai_review` выбирают основную модель. `/make_other_ai_review` позволяет сравнить ответ второй модели на уже проверенном PR.
- `Find reviewed PR` ищет глобальный ID PR. Для основной команды существующая запись останавливает выполнение до загрузки diff и вызова модели. `Save reviewed PR` записывает ID после ответа GitHub об успешной публикации.
- `Build block prompts` ведёт два счётчика строк заголовка `@@`. Контекст двигает оба счётчика, удаление сдвигает старый, добавление сдвигает новый. Workflow определяет путь, сторону и строку из diff. Модель возвращает текст для одного блока. Перед публикацией workflow проверяет полноту ответов и SHA.
- Обе модели правильно заметили возврат одной суммы налога, деление на ноль на пустом списке и изменение поведения при равенстве порогу. Gemini предложила явно сигнализировать об ошибке на пустом списке или сохранить возврат `0`. GPT‑4.1 mini предложила вернуть `0` или другое допустимое значение. Сохранение прежнего контракта на этом примере означает вернуть `0`. [Список, GPT‑4.1 mini](https://github.com/madfanat/ITMOv2/pull/10#discussion_r4660280534) · [Список, Gemini](https://github.com/madfanat/ITMOv2/pull/10#discussion_r4660282592).

## Предыдущие проверки

Локальный вариант с Ollama проверен на PR №9. Подлинные события GitHub с исходными подписями переданы в триггер по loopback. Сохранились сравнение Qwen 9B и 4B, данные таблицы, причина пропуска и снимок diff. [PR №9](https://github.com/madfanat/ITMOv2/pull/9/files) · [Локальный журнал](evidence/verification.json) · [Запуск 9B](evidence/execution-2.png) · [Запуск 4B](evidence/execution-3.png) · [Ответы Ollama](evidence/execution-3-detail.png) · [Запуск с пропуском](evidence/execution-4.png) · [Причина пропуска](evidence/execution-4-detail.png) · [Таблица после основной модели](evidence/data-table-primary.png) · [Таблица после повтора](evidence/data-table-after-duplicate.png) · [Точечные комментарии](evidence/github-inline-review.png).

До развёртывания ассистента временный GitHub ping отдельно подтвердил доступность HTTPS-входа учебного n8n. Временный приёмник и его webhook удалены. [Журнал проверки канала](evidence/course-transport.json).
