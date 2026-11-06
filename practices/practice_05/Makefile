PYTHON ?= python3
VENV := .venv
PY := $(VENV)/bin/python
HOST ?= 127.0.0.1
PORT ?= 8005

.PHONY: install install-dev test e2e run smoke baseline spec-check check

install:
	$(PYTHON) -m venv $(VENV)
	$(PY) -m pip install -r requirements.txt

install-dev: install
	$(PY) -m pip install -r requirements-dev.txt

test:
	$(PY) -m pytest -q

e2e:
	$(PY) scripts/e2e.py

run:
	$(PY) -m uvicorn app.api:app --host $(HOST) --port $(PORT) --no-access-log --log-config app/logging.json

smoke:
	$(PY) scripts/smoke.py --url http://$(HOST):$(PORT)

baseline:
	$(PY) scripts/baseline.py

spec-check:
	SPECIFY_FEATURE_DIRECTORY=specs/003-llm-timeout bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks

check: spec-check test e2e
