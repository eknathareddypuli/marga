---
title: Python for operations
summary: Packaging, retry rules and pytest commands.
module: python-ops
---

## Packaging

| Item | Value |
|------|-------|
| Layout | `src/tool/`, `tests/`, `pyproject.toml` |
| Environment | `python -m venv .venv` |
| Entry point | `[project.scripts] tool = "tool.cli:main"` |

## Retry rules

| Case | Action |
|------|--------|
| 429 | Wait for Retry-After |
| 5xx or timeout | Backoff with jitter |
| 4xx other | Do not retry |
| POST | Use an idempotency key |

## Pytest

| Job | Command |
|-----|---------|
| Run | `pytest -q` |
| One test | `pytest -k name` |
| Parametrise | `@pytest.mark.parametrize` |
| Temp files | `tmp_path` fixture |

## Handy commands

```bash
python3 -m venv .venv && . .venv/bin/activate
```

```bash
pip install -r requirements.txt
```

```bash
python3 -m pytest -q
```

```bash
python3 -m json.tool response.json
```

```bash
python3 -m pip list --outdated
```

```bash
python3 -m venv --upgrade-deps .venv
```

## Watch out for

> **Warning:** Never run a script that deletes resources without a dry run and a limit on the count.

> **Warning:** Unpinned dependencies make the same script behave differently next month.

> **Warning:** Catching every exception hides failures, so catch only what you can handle.

> **Warning:** A retry loop without backoff and jitter makes throttling worse.
