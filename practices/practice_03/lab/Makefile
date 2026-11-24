.PHONY: install test

# Resolve a Python executable preferring pyenv, then python3
PY := $(shell if command -v pyenv >/dev/null 2>&1; then pyenv which python; elif command -v python3 >/dev/null 2>&1; then command -v python3; else command -v python || echo python; fi)

install:
	@"$(PY)" -c "import sys; assert sys.version_info >= (3,10), 'Python 3.10+ required'; print('Standard library only: ready')"

test: install
	$(MAKE) -C demo test PY="$(PY)"
