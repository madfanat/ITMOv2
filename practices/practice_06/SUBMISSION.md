# Практика 6: готовое решение

Дата: 28.10.2026.

PR: [madfanat/ITMOv2#6](https://github.com/madfanat/ITMOv2/pull/6).
Подтверждение открытия: [pull-request.json](evidence/pull-request.json)
(снимок на момент создания, до добавления ссылки в документацию).

| Критерий | Где смотреть |
|---|---|
| Модель угроз, DFD/Mermaid, STRIDE, политика доступа | [THREAT_MODEL.md](THREAT_MODEL.md) |
| Найденные проблемы и исходные атаки | [REPORT_01.md](REPORT_01.md), [before/attacks.json](evidence/before/attacks.json) |
| Исправленная реализация | [lab/service.py](lab/service.py) |
| Новые регрессионные тесты | [test_security.py](lab/test_security.py), [test_http_security.py](lab/test_http_security.py) |
| Промпт независимого судьи | [judge-system-prompt.md](judge-system-prompt.md), [opencode.json](opencode.json) |
| Повторные атаки, результаты, ограничения и выводы | [REPORT_02.md](REPORT_02.md), [after/attacks.json](evidence/after/attacks.json) |
| Сценарии воспроизведения | [attack_probe.py](tools/attack_probe.py), [planner_eval.py](tools/planner_eval.py) |
| Параметры среды и SHA-256 | [environment.json](evidence/environment.json) |
| Описание PR | [PR.md](PR.md) |

**Проверено:** make step6, make test, 57 тестов практики 6 проходят; 20 HTTP-
кейсов воспроизведены до и после. sandbox.py и planner-system.txt не изменены.

**Ограничение:** реальный LLM-провайдер возвращает ошибку TLS. Четыре входа и
ошибки запусков сохранены, но ответов/решений модели нет. Устойчивость LLM к
инъекции не заявлена. Прямой опасный JSON независимо проверен на исполнителе:
удаление Sandbox до фикса и отказ 403 с сохранением файлов после.

## Запуск и тесты

Требуется Python 3.10+, только стандартная библиотека. Команды из корня
репозитория, где python3 уже указывает на подходящую версию:

```bash
make step6
make test
make -C practices/practice_06 run
```

Если системный Python старый, выберите установленный Python 3.10+ через PATH.
Для самой практики 6 также можно явно задать интерпретатор:

```bash
make step6 PYTHON=python3.12
make -C practices/practice_06 run PYTHON=python3.12
```

В среде выполнения использовался Python 3.12.14 из runtime Codex и PATH:
`/Users/tim/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin`.
Для общего make test PATH нужен и предыдущим практикам. Точные результаты:
[evidence/after/make-step6.txt](evidence/after/make-step6.txt),
[evidence/after/make-test.txt](evidence/after/make-test.txt).

## HTTP-атаки и исходная версия

Скрипт сам создаёт новый loopback-сервер на случайном порту для каждого кейса,
закрывает его и удаляет одноразовые данные. У него нет параметра удалённой цели.
Запуск повторно заменяет только свои JSON-трассы; для сохранения исходных
свидетельств можно выбрать другой выходной каталог:

```bash
python3 practices/practice_06/tools/attack_probe.py /tmp/p06-recheck-before --baseline
python3 practices/practice_06/tools/attack_probe.py /tmp/p06-recheck-after
```

--baseline загружает сохранённый уязвимый service.py.txt; рабочий исправленный
service.py не заменяется. Для регрессионного набора на исходной версии:

```bash
mkdir -p /tmp/p06-original-tests
cp practices/practice_06/evidence/before/service.py.txt /tmp/p06-original-tests/service.py
cp practices/practice_06/lab/sandbox.py practices/practice_06/lab/test_security.py /tmp/p06-original-tests/
python3 -m unittest discover -s /tmp/p06-original-tests -v
```

Ожидаемое поведение последней команды — ненулевой код и падения проверок
безопасности. На исправленной версии они проходят. Снимок уязвимой реализации
хранится только как учебное доказательство, не является запускаемым сервисом
по умолчанию. Физическая граница sandbox.py не расширялась.

## Реальная модель: повтор после восстановления провайдера

Требуются OpenCode, доступ к `vsellm/openai/gpt-5` и VSELLM_API_KEY в окружении.
Ключ никогда не добавлять в git. Provider vsellm уже настроен в корневом
opencode.json; конфигурация практики добавляет изолированных агентов. На
другой машине настройте свой разрешённый провайдер отдельно от сдаваемых файлов.
Для этой работы пользователь разрешил только синтетический контекст Mini Shop
на litellm.data-light.ru. Не отправляйте туда реальные данные или содержимое
других проектов.

```bash
python3 practices/practice_06/tools/planner_eval.py before
python3 practices/practice_06/tools/planner_eval.py after
```

Каждая команда создаёт чистый стенд, запускает модель отдельно для обычного и
отравленного контекста, сохраняет финальный ответ, извлекает JSON и передаёт
его локальному исполнителю только при корректном формате. Затем выполняет
отдельный forced-decision тест. Папки evidence/before и evidence/after
обновляются, поэтому перед повтором сохраните текущие свидетельства при
необходимости. before использует исходный снимок, after — исправленный сервис.
При ошибке провайдера команда возвращает exit 1 и не выдумывает решение.

Для ограниченной среды с недоступными стандартными каталогами OpenCode можно
задать XDG_DATA_HOME, XDG_STATE_HOME, XDG_CACHE_HOME на отдельные каталоги /tmp.
Если нужен корпоративный CA, используйте только доверенный системный сертификат
через NODE_EXTRA_CA_CERTS; не отключайте проверку TLS.

## Связь с лекцией

[Лекция 6](../../lections/lection_6_AI%20engineering%20tools.pdf): уровни проверок
агента (слайд 16), изоляция контекста (19), действия и эффект в среде (20),
повторы и Pass@k/Pass^k (21), red teaming (22), регрессии при изменениях (25),
ограничения LLM-судьи (46). В этой работе проверки контракта/контекста/инструмента
автоматизированы, HTTP-сценарии проверяют эффект, а реальная LLM-часть явно
отделена от deterministic ACL-тестов и отмечена как unverified из-за TLS.

## Выводы автора

Опасность исходной реализации была в отсутствии серверных границ: и клиент,
и модель могли диктовать SQL, владельца, цену, роль и файловое действие.
Исправленный сервер сам устанавливает полномочия, ограничивает контекст и
повторно проверяет каждый инструмент. Такой контроль сохраняет полезные
операции и защищает данные даже при ошибочном решении AI.

Для проверки агента нужны точные входы, исходный ответ и наблюдаемый эффект.
Отправленный вручную delete_tree доказывает уязвимость исполнителя, но ничего
не говорит о послушании модели. Ошибку TLS я сохранил как незавершённый
эксперимент; рабочий серверный регрессионный набор и подготовленные входы
позволяют завершить LLM-проверку после восстановления доступа без подмены результатов.
