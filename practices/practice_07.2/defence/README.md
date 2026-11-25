# Защита лабораторной 7.2

[План работы](plan.md) · [Экспорты и подключение](../README.md#решение) · [Журнал учебных запусков](evidence/hosted-verification.json)

Все четыре сценария опубликованы на учебном n8n. Классификатор и автофикс используют `openai/gpt-4.1-mini` через VseLLM. GitHub отправляет подписанные события прямо на учебный webhook. Лейблы и ответы записываются через GitHub API. [Обработчик Issues](https://n8n-itmo.cyrweb.ru/workflow/L1cE4SoKVWNIb9iN) · [Классификатор](https://n8n-itmo.cyrweb.ru/workflow/mSEPpLZhCzCr6qxc) · [Недельный отчёт](https://n8n-itmo.cyrweb.ru/workflow/l3q27BriiWwP1aFq) · [Автофикс](https://n8n-itmo.cyrweb.ru/workflow/wn2DdRtmluI8DH5T).

## Девять критериев

| № | Баллы | Что показать |
| --- | ---: | --- |
| 1 | 2 | GitHub Issues [№19 bug](https://github.com/madfanat/ITMOv2/issues/19), [№20 task](https://github.com/madfanat/ITMOv2/issues/20) и [№21 feature](https://github.com/madfanat/ITMOv2/issues/21) получили по одному лейблу категории и одному ответу. Уверенность модели — `0.9`. [Execution 8993](evidence/hosted-issues-8993.png) · [Execution 8996](evidence/hosted-issues-8996.png) · [Execution 9000](evidence/hosted-issues-9000.png). |
| 2 | 1 | У Issue [№22](https://github.com/madfanat/ITMOv2/issues/22) классификатор вернул `unknown` и `0.7`. Ниже порога `0.8` Switch передал Issue в `needs-triage`. GitHub подтвердил 0 комментариев. [Execution 9001](evidence/hosted-issues-9001-apply-confidence-threshold.png). |
| 3 | 2 | В родительском `Execute classifier` видны входы `title` и `body`. Дочернее выполнение 8994 вернуло `type` и `confidence`. Structured Output Parser восстанавливает невалидный JSON дополнительным вызовом модели. [Execution 8994](evidence/hosted-classifier-8994-return-type-and-confidence.png). |
| 4 | 2 | Триггер использует cron `0 9 * * MON` и часовой пояс `Europe/Moscow`. Ручной запуск выполнил четыре выборки GitHub за семь дней. [Настройка cron](evidence/hosted-weekly-report-9019-monday-at-09-00.png) · [Execution 9019](evidence/hosted-weekly-report-9019.png). |
| 5 | 2 | `Group by type and author` сгруппировал 10 новых Issues. По типам получилось 4 `bug`, по 2 `task`, `feature` и `needs-triage`. [Группировка](evidence/hosted-weekly-report-9019-group-by-type-and-author.png). |
| 6 | 2 | Gmail вернул ID сообщения и метку `INBOX` для отправленного HTML. [Полученное письмо](evidence/hosted-gmail-report.png). |
| 7 | 1 | `Save weekly snapshot` записал текущий снимок. В истории две строки с источниками `github` и `fixture`. [Data Table](evidence/hosted-practice_072_weekly_stats.png). |
| 8 | 2 | В отчёте 10 новых Issues и Δ **+8** к тестовой строке. По категориям Δ равна **+2** для каждого из четырёх типов. [Таблица в письме](evidence/hosted-gmail-annotation.png). |
| 9 | 2 | `Summarize changes` получил число новых Issues, Δ и лидирующий тип `bug`. В письме эти данные отражены в блоке «AI-комментарий недели». [AI-комментарий](evidence/hosted-gmail-annotation.png). |

GitHub повторил доставку события Issue №19. Execution 9011 завершился в `Skip duplicate` до вызова модели, в Issue остался один комментарий. Обработка `author_association == NONE` проверена локальным тестом. [Повторная доставка](evidence/hosted-issues-9011-skip-duplicate.png) · [Таблица обработанных Issues](evidence/hosted-practice_072_processed_issues.png).

## Как показать на защите

1. Откройте три уверенных Issue и №22. Сверьте лейблы и число комментариев командой `make -C practices/practice_07.2/defence inspect`. Для нового прогона есть цели `open-bug`, `open-task`, `open-feature` и `open-unknown`.
2. Откройте Execution 9001, покажите порог `0.8` и ветку без ответа. Из `Execute classifier` перейдите в дочернее исполнение и покажите вход и результат. В Execution 9011 покажите, что повторная доставка завершилась до вызова классификатора. [Execution 9001](https://n8n-itmo.cyrweb.ru/workflow/L1cE4SoKVWNIb9iN/executions/9001) · [Execution 9011](https://n8n-itmo.cyrweb.ru/workflow/L1cE4SoKVWNIb9iN/executions/9011).
3. Откройте запланированный триггер и запустите `Manual report`. В `Set report window` отображаются границы семи дней. В четырёх HTTP-нодах видны ответы GitHub, в Code node — группировка. [Execution 9019](https://n8n-itmo.cyrweb.ru/workflow/l3q27BriiWwP1aFq/executions/9019).
4. Покажите `Read previous week`, две строки таблицы и письмо. Для нового стенда используйте [тестовые агрегаты](previous-week.json) как строку с источником `fixture`. В `week_key` укажите `<репозиторий>|manual|<московская дата семь дней назад>`. Поля `window_start` и `window_end` описывают предшествующие семь дней в UTC.
5. Запустите `make -C practices/practice_07.2/defence check`. Восемь проверок экспортов покрывают порог, пропуск повторов, пагинацию, границы дат, HTML и условия мержа.

## Сверхрезультат

[Issue №23](https://github.com/madfanat/ITMOv2/issues/23) описывает функциональный дефект `sum([])`. Обработчик передал номер Issue в `Execute sandbox bugfix`. Execution 9016 получил исходник из отдельного репозитория, сгенерировал одну строку, проверил её форму и четыре примера, создал ветку и PR. Вторая AI-цепочка проверила diff. Сценарий опубликовал ревью и смёрджил проверенный head в `main`. На исходном коммите `c00b4f9` тест пустого массива падал с `TypeError`. На смёрдженном коммите `6402ca1` прошли четыре теста. [Execution 9016](evidence/hosted-bugfix-9016.png) · [Подтверждение мержа](evidence/hosted-bugfix-9016-confirm-github-merge.png) · [Смёрдженный PR](https://github.com/madfanat/itmo-practice-072-demo/pull/2).

PR изменил только `src/sum.mjs` в изолированном деморепозитории. На учебном n8n вход в ветку автофикса разрешён только для Issue с нужным префиксом от владельца репозитория. В импорте ветка включается явно. Повторить демонстрацию можно на исходном коммите `c00b4f9` в новом деморепозитории, обновив URL нод сценария.

## Учётные данные и предыдущая проверка

Два GitHub-токена хранятся в учебном n8n. Credential `ITMO 7.2 Issues and webhooks` ограничена форком `ITMOv2` и правами записи Issues и Webhooks. Credential `ITMO 7.2 isolated autofix` ограничена деморепозиторием и правами записи Contents и Pull requests. История старого локального webhook сохранена, сам дубль отключён. Gmail подключён с областью `gmail.send`. Адрес получателя задаётся в ноде Gmail, за пределами выходных данных агрегации.

Gmail OAuth обновлён 25 ноября 2026 года. Первый плановый запуск 30 ноября в 09:00 по Москве попадает в семидневный период авторизации. OAuth-приложение Google работает в режиме Testing, в котором refresh token действует семь дней. [Правила Google OAuth](https://developers.google.com/identity/protocols/oauth2#expiration).

До публикации выполнялась проверка на локальном n8n 2.40 с Qwen 3.5 4B через Ollama. Подписанные доставки тогда поступали на loopback, запись в GitHub выполнял авторизованный GitHub CLI. [Журнал локальной проверки](evidence/verification.json) · [Локальные Issues №12–15](https://github.com/madfanat/ITMOv2/issues?q=is%3Aissue+%22Демо+7.2%22) · [Первый PR автофикса](https://github.com/madfanat/itmo-practice-072-demo/pull/1).
