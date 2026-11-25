.PHONY: setup check start test fault

setup:
	cd .. && npm ci && npx playwright install chromium

check:
	cd .. && npm run build && npm test

start:
	cd .. && npm run build && npm start

test:
	cd .. && npm test

fault:
	cd .. && PORT=4174 N8N_WEBHOOK_SECRET=invalid-for-negative-demo npm start
