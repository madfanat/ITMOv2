# Защита лабораторной 7.2

[План работы](plan.md) · [Экспорты и подключение](../README.md#решение) · [Журнал контрольной проверки](evidence/verification.json)

## Девять критериев

| № | Баллы | Что показать |
| --- | ---: | --- |
| 1 | 2 | GitHub Issues [№12 bug](https://github.com/madfanat/ITMOv2/issues/12), [№13 task](https://github.com/madfanat/ITMOv2/issues/13), [№14 feature](https://github.com/madfanat/ITMOv2/issues/14). В каждом один лейбл категории и один ответ. [Execution 11](evidence/issues-execution-11.png) · [Execution 13](evidence/issues-execution-13.png) · [Execution 15](evidence/issues-execution-15.png). |
| 2 | 1 | У Issue [№15](https://github.com/madfanat/ITMOv2/issues/15) классификатор вернул `unknown` и `0.5`. Switch передал его в `needs-triage`. GitHub подтвердил 0 комментариев. [Execution 17](evidence/issues-execution-17-detail.png). |
| 3 | 2 | В родительском `Execute classifier` видны входы `title` и `body`. В отдельном Execution 18 модель вернула `type` и `confidence`. Уверенные обращения получили категории с confidence `0.95`. [Execution 18](evidence/classifier-execution-18-detail.png). |
| 4 | 2 | `Monday at 09:00` содержит cron `0 9 * * MON` и часовой пояс `Europe/Moscow`. [Настройка cron](evidence/weekly-report-execution-21-monday-at-09-00.png). Ручной Execution 21 выполнил выборки созданных Issues, закрытых Issues, мержей PR и комментариев к Issues. [Execution 21](evidence/weekly-report-execution-21.png). |
| 5 | 2 | `Group by type and author` посчитал 4 новых Issues автора `madfanat`, по одному каждого типа. [Группировка](evidence/weekly-report-execution-21-group-by-type-and-author.png). |
| 6 | 2 | `Send HTML via Gmail` вернул ID сообщения. Gmail подтвердил метку `INBOX`. [Письмо](evidence/gmail-report.png). |
| 7 | 1 | `Save weekly snapshot` записал текущий снимок. В истории две строки с источниками `github` и `fixture`. [Data Table](evidence/practice_072_weekly_stats.png). |
| 8 | 2 | Открыто 4 Issues, Δ **+2** к тестовой строке. По типам Δ равна −1 для `bug` и +1 для `task`, `feature` и `needs-triage`. [Письмо](evidence/gmail-report.png). |
| 9 | 2 | `Summarize changes` передал модели числа по новым обращениям и Δ. В письме есть блок «AI-комментарий недели». [Таблица по авторам и AI-комментарий](evidence/gmail-report-annotation.png). |

Повтор подписанной доставки Issue №12 завершился в `Skip duplicate` до вызова модели. В GitHub осталось по одному комментарию в трёх уверенных Issues. Обработка `author_association == NONE` проверена отдельно на локальных данных. [Execution 19](evidence/issues-execution-19-detail.png) · [Таблица обработанных Issues](evidence/practice_072_processed_issues.png).

## Как показать на защите

1. Откройте три уверенных Issue и №15. Сверьте лейблы и комментарии командой `make -C practices/practice_07.2/defence inspect`. Для нового прогона предусмотрены цели `open-bug`, `open-task`, `open-feature` и `open-unknown`.
2. Откройте Execution 17, покажите порог `0.8` и ветку без ответа. Перейдите из `Execute classifier` в дочернее исполнение и покажите вход и результат.
3. Откройте запланированный триггер и выполните отчёт через `Manual report`. В `Set report window` видны границы семи дней. В четырёх HTTP-нодах видны ответы GitHub, в Code node — счётчики по типам и авторам.
4. Покажите `Read previous week`, две строки таблицы и письмо. Для нового стенда поместите [тестовые агрегаты](previous-week.json) как строку источника `fixture`. В `week_key` укажите `<репозиторий>|manual|<московская дата семь дней назад>`. Поля `window_start` и `window_end` описывают предшествующие семь дней в UTC.
5. Запустите `make -C practices/practice_07.2/defence check` для восьми проверок экспортов. Они покрывают порог, пропуск повторов, пагинацию, границы дат, HTML и условия мержа.

## Сверхрезультат

[Issue №16](https://github.com/madfanat/ITMOv2/issues/16) описывает функциональный дефект `sum([])`. После классификации обработчик передал номер Issue в `Execute sandbox bugfix`. Execution 24 получил исходник из отдельного репозитория, сгенерировал одну строку, проверил её форму и четыре примера, создал отдельную ветку и PR. Вторая AI-цепочка проверила diff. Сценарий опубликовал ревью и смёрджил проверенный head в `main`. На исходном коммите тест пустого массива падал с `TypeError`, на смёрдженном прошли четыре теста. [Execution 24](evidence/bugfix-execution-24.png) · [Результат слияния](evidence/bugfix-execution-24-confirm-github-merge.png) · [Смёрдженный PR](https://github.com/madfanat/itmo-practice-072-demo/pull/1).

PR меняет только `src/sum.mjs` в изолированном деморепозитории. Повторить демонстрацию можно на состоянии до фикса `cd1a7a23` в новом деморепозитории, привязав его в URL нод сценария.

## Условия прогона

Прогоны выполнены в локальном n8n 2.40 с Qwen 3.5 4B через Ollama. GitHub доставил подписанные события в журнал webhook. Для локального прогона их передали из GitHub API на loopback с сохранением оригинальной подписи. Учебный ключ модели получил HTTP 401, а предоставленный GitHub PAT получил HTTP 403 при записи лейблов. В локальном прогоне запись в GitHub выполнял ограниченный адаптер авторизованного GitHub CLI. Экспорты подключаются напрямую к GitHub API с подходящей credential. Gmail подключён через отдельный OAuth-клиент проекта `itmo-515522` с областью `gmail.send`. Адрес получателя и credential задаются в экземпляре n8n при импорте.

Снимки сделаны в интерфейсах n8n и Gmail во время проверки. История и сценарий для повторного запуска доступны в [журнале](evidence/verification.json) и [Makefile](Makefile).
