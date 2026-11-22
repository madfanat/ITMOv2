# Практика 7.1. Ассистент код-ревью в n8n

Workflow опубликован на учебном n8n и принимает события напрямую из GitHub. Открытие PR и команда `/make_ai_review` для непроверенного PR запускают GPT‑4.1 mini. Команда `/make_other_ai_review` запускает Gemini 2.5 Flash. После публикации GitHub review сценарий сохраняет глобальный ID PR в Data Table. Повторная основная команда по проверенному PR завершается до загрузки diff и обращения к модели. [Workflow на учебном n8n](https://n8n-itmo.cyrweb.ru/workflow/o9UozImE5ZHsJwOj).

Каждая непрерывная группа изменений получает точечный комментарий. Workflow вычисляет координаты из unified diff и сверяет SHA перед публикацией. В тестовом PR обе модели оставили по три комментария, включая комментарий к удалённой строке. Повторная команда завершилась в `Skip review`. [Тестовый PR №10](https://github.com/madfanat/ITMOv2/pull/10/files) · [Data Table](https://n8n-itmo.cyrweb.ru/projects/qCEYnOmqtgpgej4S/datatables/BnklmwRpBIzvNb8p).

Проверены три прямые доставки GitHub c HTTP 200 и соответствующие запуски n8n №7588, №7589 и №7591. На двух экспортированных вариантах прошли 36 локальных проверок. Команды живой демонстрации собраны в Makefile. [Скриншоты, журнал и сценарий защиты](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/defence/README.md).

[Экспорт учебного workflow](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/workflow.course.json) · [Инструкция запуска](https://github.com/madfanat/ITMOv2/blob/smolyankin-timofey-practice-07-1/practices/practice_07.1/README.md).
