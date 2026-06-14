# Backend

Python FastAPI backend. Serves the statically exported Next frontend at `/` and
the API under `/api/*`. Managed with `uv`; runs on `uvicorn` (port 8000).

## Layout

- `app/main.py` - FastAPI app. `GET /api/health` returns `{"status":"ok"}`;
  mounts `static/` at `/` (serves `index.html`).
- `app/config.py` - loads the project-root `.env`; exposes paths and
  `get_static_dir()`, `get_session_secret()`, `get_openai_api_key()`.
- `app/auth.py` - hardcoded-credential login over a signed session cookie;
  `get_current_user` dependency.
- `app/db.py` - sqlite3 connection, schema creation, seeding, `get_db` dependency.
- `app/models.py` - Pydantic board and chat models.
- `app/boards.py` - board CRUD plus `POST /api/boards/{id}/chat`.
- `app/ai.py` - OpenAI client (`gpt-4o-mini`); `ask()` and `chat_about_board()`
  (Structured Outputs returning a reply and optional board update).
- `static/` - placeholder `index.html`; the built Next export in `frontend/out`
  is served instead when present.
- `tests/` - pytest suite (`conftest.py` provides temp-DB and logged-in
  clients). Tests marked `live` make real OpenAI calls and are deselected by
  default; run them with `uv run pytest -o addopts="" -m live`.

## Run

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or use `scripts/start.ps1` / `scripts/start.sh`.

## Test

```bash
uv run pytest
```

Coverage is configured in `pyproject.toml` (`--cov=app`, term-missing).

## Conventions

- `uv` only (`uv add`, `uv run`); never pip or bare `python`.
- Keep it simple; no defensive programming unless needed. Never log secrets.
