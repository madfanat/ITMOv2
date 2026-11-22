NODE ?= node
GH ?= gh
REPO ?= madfanat/ITMOv2
PR ?= 10
PULL = repos/$(REPO)/pulls/$(PR)
COMMENTS = repos/$(REPO)/issues/$(PR)/comments

.PHONY: test test-local test-course inspect-pr review-other review-repeat inspect-reviews inspect-inline

test: test-local test-course

test-local:
	$(NODE) --test check-workflow.mjs

test-course:
	PRACTICE_071_TARGET=course $(NODE) --test check-workflow.mjs

inspect-pr:
	$(GH) api "$(PULL)" --jq '{pr_id: .id, number, state, sha: .head.sha, url: .html_url}'

review-other:
	$(GH) api "$(COMMENTS)" --method POST --raw-field 'body=/make_other_ai_review' --jq '.html_url'

review-repeat:
	$(GH) api "$(COMMENTS)" --method POST --raw-field 'body=/make_ai_review' --jq '.html_url'

inspect-reviews:
	$(GH) api --paginate "$(PULL)/reviews?per_page=100" --jq '.[] | {id, state, commit_id, body, url: .html_url}'

inspect-inline:
	$(GH) api --paginate "$(PULL)/comments?per_page=100" --jq '.[] | {review_id: .pull_request_review_id, path, side, line, url: .html_url}'
