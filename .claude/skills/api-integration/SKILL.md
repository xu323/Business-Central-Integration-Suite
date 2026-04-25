---
name: api-integration
description: Use when adding or changing FastAPI endpoints, audit logging, or BusinessCentralClient (mock/real) behaviour inside apps/api/.
---

# API Integration

## When to use

- Adding a new endpoint (`/api/...`).
- Adjusting Pydantic schemas or SQLAlchemy models.
- Changing how the BusinessCentralClient talks to BC (mock or real).
- Adding new audit-logged actions.

## Workflow

1. **Schema first** — define request/response in `app/schemas.py` (Pydantic v2, `from_attributes=True` for ORM).
2. **Model** — add SQLAlchemy mapped columns; if a status enum is involved, mirror the AL enum.
3. **Router** — implement under `app/routers/...`, with `response_model` set explicitly.
4. **Audit** — every state-changing endpoint must call `write_audit(...)` *before* commit.
5. **Tests** — add a pytest case in `apps/api/tests/test_purchase_requests.py` (or a sibling file) covering success + at least one negative path.
6. **Lint + Test** — run `ruff check app tests` and `pytest -q` before shipping.

## Quality bar

- 100% of state transitions are audit-logged.
- No HTTP 500 leaks: validation goes through Pydantic; expected errors raise `HTTPException`.
- BusinessCentralClient never blocks the event loop in `mock` mode (use synchronous calls).

## Forbidden

- Logging secrets or BC bearer tokens.
- Returning ORM objects without a `response_model`.
- Catching `Exception:` without re-raising or audit-logging.

## Output format

Per change: list new/modified files (including tests), with `file:line` references for the most important change site.
