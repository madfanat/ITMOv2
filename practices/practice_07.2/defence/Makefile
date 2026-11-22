REPO ?= madfanat/ITMOv2
ISSUES ?= 12 13 14 15

.PHONY: check inspect open-bug open-task open-feature open-unknown

check:
	node --test check-workflows.mjs

inspect:
	@for issue in $(ISSUES); do \
		gh issue view "$$issue" --repo "$(REPO)" --json url,title,labels,comments \
			--jq '{url, title, labels: [.labels[].name], comments: (.comments | length)}' || exit; \
	done

open-bug:
	gh issue create --repo "$(REPO)" --title '[Демо 7.2] Пустой CSV экспорт падает' \
		--body 'На пустом списке экспорт CSV возвращает 500. Ожидается файл с заголовком. Версия 1.4.0.'

open-task:
	gh issue create --repo "$(REPO)" --title '[Демо 7.2] Где настроить часовой пояс отчёта?' \
		--body 'Нужна настройка уже существующего отчёта. Подскажите, где поменять часовой пояс.'

open-feature:
	gh issue create --repo "$(REPO)" --title '[Демо 7.2] Добавьте XLSX экспорт' \
		--body 'Сейчас имеется только CSV. Нужна новая выгрузка XLSX с отдельным листом для каждого типа Issue.'

open-unknown:
	gh issue create --repo "$(REPO)" --title '[Демо 7.2] Иногда не работает' \
		--body 'Неясно, где и когда. Подробностей пока нет.'
