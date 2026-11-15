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
