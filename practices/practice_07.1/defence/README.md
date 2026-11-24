# Защита лабораторной 7.1

Workflow опубликован на учебном n8n. 25 ноября 2026 года GitHub напрямую доставил три подписанных webhook для PR №9. GPT‑4.1 mini и Gemini 2.5 Flash вызваны через обновлённый VseLLM credential. Каждая модель оставила три точечных комментария. Повторный запуск основной модели остановился в `Skip review`. [Workflow](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj) · [Тестовый PR](https://github.com/madfanat/ITMOv2/pull/9) · [Files changed](https://github.com/madfanat/ITMOv2/pull/9/files).

## Критерии и подтверждения

| Критерий | Результат на учебном n8n | Материалы |
| --- | --- | --- |
| 1. Вторая модель (2 балла) | `/make_other_ai_review` запустила `google/gemini-2.5-flash` в execution №8957. GitHub принял ревью `6048349580` с тремя комментариями. | [Команда](https://github.com/madfanat/ITMOv2/pull/9#issuecomment-7146165158) · [Execution №8957](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/8957) · [Снимок Executions](evidence/vsellm-execution-8957.png) · [Ревью Gemini](https://github.com/madfanat/ITMOv2/pull/9#pullrequestreview-6048349580) |
| 2. Запись ID PR (2 балла) | Основное ревью в execution №8956 сохранило `pr_id = 5443775274`, номер PR `9` и `review_id = 6048347651`. Вторая модель обновила ту же строку. Три ранее созданные строки сохранились. | [Первая команда](https://github.com/madfanat/ITMOv2/pull/9#issuecomment-7146161691) · [Execution №8956](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/8956) · [Снимок Executions](evidence/vsellm-execution-8956.png) · [Data Table](https://n8n-itmo.cyrweb.ru/projects/qCEYnOmqtgpgej4S/datatables/BnklmwRpBIzvNb8p) · [Снимок таблицы](evidence/vsellm-data-table.png) |
| 3. Дедупликация (3 балла) | Повторный `/make_ai_review` завершился в `Skip review` со статусом `already_reviewed` в execution №8958. VseLLM не вызывался. Строка таблицы и число опубликованных ревью сохранились. | [Повторная команда](https://github.com/madfanat/ITMOv2/pull/9#issuecomment-7146169305) · [Execution №8958](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj/executions/8958) · [Снимок Executions](evidence/vsellm-execution-8958.png) · [Причина пропуска](evidence/vsellm-skip-detail.png) |
| 4. Точечные комментарии (5 баллов) | Из одного hunk выделены три группы изменений. GitHub принял якоря `RIGHT:2`, `LEFT:7` и `RIGHT:10` в каждом из двух новых ревью. | [Снимок Files changed](evidence/vsellm-github-inline-review.png) · [Ревью GPT‑4.1 mini](https://github.com/madfanat/ITMOv2/pull/9#pullrequestreview-6048347651) · [Ревью Gemini](https://github.com/madfanat/ITMOv2/pull/9#pullrequestreview-6048349580) |

[Журнал сквозной проверки VseLLM](evidence/vsellm-verification.json) связывает ID прямых HTTPS-доставок GitHub с запусками n8n, строкой Data Table и комментариями. [Экспорт учебного workflow](../workflow.course.json) · [План работы](plan.md) · [Текст PR](pr.md).

## Порядок живой демонстрации

На защите можно использовать уже настроенный PR №9. Держите открытыми GitHub, Executions и Data Tables.

1. Отправьте команду второй модели. Дождитесь нового execution и откройте опубликованное ревью. В заголовке будет `google/gemini-2.5-flash`.

   ```sh
   make -C practices/practice_07.1/defence review-other PR=9
   ```

2. Сверьте `pr_id` в Data Table с глобальным ID GitHub и покажите `review_id` нового ревью. Поле `last_model` показывает модель, опубликовавшую последнее ревью.

   ```sh
   make -C practices/practice_07.1/defence inspect-pr PR=9
   ```

3. Прочитайте список ревью. Отправьте основную команду в том же PR, дождитесь execution и покажите `Skip review`. Снова прочитайте список ревью и подтвердите, что количество сохранилось.

   ```sh
   make -C practices/practice_07.1/defence inspect-reviews PR=9
   make -C practices/practice_07.1/defence review-repeat PR=9
   make -C practices/practice_07.1/defence inspect-reviews PR=9
   ```

4. Откройте **Files changed**, выберите три комментария из нового ревью и покажите точки привязки. Средний блок содержит только удаления, поэтому комментарий стоит на старой строке 7.

   ```sh
   make -C practices/practice_07.1/defence inspect-inline PR=9
   ```

[Команды демонстрации](Makefile). Проверки маршрутизации, дедупликации, разбора diff и проверки SHA прошли на обоих экспортах. Всего выполнено 37 проверок, в том числе проверка привязки VseLLM в учебном экспорте.

```sh
make -C practices/practice_07.1/defence test
```

## Как объяснить решение

- `Route GitHub event` различает событие `pull_request.opened` и два точных комментария-команды. Открытие и `/make_ai_review` выбирают основную модель. `/make_other_ai_review` позволяет сравнить ответ второй модели на уже проверенном PR.
- `Find reviewed PR` ищет глобальный ID PR. Для основной команды существующая запись останавливает выполнение до загрузки diff и вызова модели. `Save reviewed PR` записывает ID после подтверждения публикации от GitHub.
- `Build block prompts` ведёт два счётчика строк из заголовка `@@`. Контекст двигает оба счётчика, удаление сдвигает старый, добавление сдвигает новый. Workflow определяет путь, сторону и строку из diff. Модель возвращает текст для одного блока. Перед публикацией workflow проверяет полноту ответов и SHA.
- Обе модели нашли возврат одной суммы налога, деление на ноль на пустом списке и регрессию при равенстве порогу. Gemini явно предложила два варианта для пустого ввода, вернуть `0` или сообщить об ошибке. По исходному контракту функция возвращала `0`. [GPT‑4.1 mini](https://github.com/madfanat/ITMOv2/pull/9#discussion_r4687354695) · [Gemini](https://github.com/madfanat/ITMOv2/pull/9#discussion_r4687356423).

## Предыдущие проверки

Автоматический запуск при открытии PR подтверждён на PR №10 до замены credential. Маршрут `pull_request.opened` и GitHub-триггер сохранили те же настройки. [PR №10](https://github.com/madfanat/ITMOv2/pull/10/files) · [История прямых доставок](evidence/course-verification.json) · [Execution открытия PR](evidence/course-execution-7588.png) · [Вторая модель](evidence/course-execution-7589.png) · [Пропуск повтора](evidence/course-execution-7591.png) · [Data Table](evidence/course-data-table.png) · [Точечные комментарии](evidence/course-github-inline-review.png).

Локальный вариант с Ollama ранее проверен на PR №9. Этим двум ранним ревью в PR соответствуют модели Qwen. [Локальный журнал](evidence/verification.json) · [Запуск 9B](evidence/execution-2.png) · [Запуск 4B](evidence/execution-3.png) · [Ответы Ollama](evidence/execution-3-detail.png) · [Запуск с пропуском](evidence/execution-4.png) · [Причина пропуска](evidence/execution-4-detail.png) · [Таблица после основной модели](evidence/data-table-primary.png) · [Таблица после повтора](evidence/data-table-after-duplicate.png) · [Точечные комментарии](evidence/github-inline-review.png).

До первого развёртывания ассистента временный GitHub ping подтвердил доступность HTTPS-входа учебного n8n. Временный приёмник и его webhook удалены. [Журнал проверки канала](evidence/course-transport.json).
