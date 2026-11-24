# Практика 7.1. Ассистент код-ревью в n8n

Workflow опубликован на учебном n8n и принимает события напрямую из GitHub. Открытие PR и `/make_ai_review` для непроверенного PR запускают GPT‑4.1 mini. Команда `/make_other_ai_review` запускает Gemini 2.5 Flash. Обе модели используют действующий VseLLM credential. После публикации ревью сценарий сохраняет глобальный ID PR в Data Table. [Workflow на учебном n8n](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj).

В повторном прогоне 25 ноября обе модели прокомментировали по три блока в тестовом PR. Workflow вычислил координаты из unified diff и проверил SHA перед публикацией. Среди комментариев есть привязка к удалённой строке. Повторный `/make_ai_review` завершился в `Skip review` без запроса к VseLLM. [Тестовый PR №9](https://github.com/madfanat/ITMOv2/pull/9/files) · [Data Table](https://n8n-itmo.cyrweb.ru/projects/qCEYnOmqtgpgej4S/datatables/BnklmwRpBIzvNb8p).

Подтверждены три прямые доставки GitHub с HTTP 200 и три запуска n8n №8956–8958. На двух экспортированных вариантах прошли 37 локальных проверок. Команды живой демонстрации собраны в Makefile. [Скриншоты, журнал и сценарий защиты](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/defence/README.md).

[Экспорт учебного workflow](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/workflow.course.json) · [Инструкция запуска](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/README.md).
