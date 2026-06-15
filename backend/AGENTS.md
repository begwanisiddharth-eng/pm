# Backend

Python FastAPI backend. Serves the statically exported Next frontend at `/` and
the API under `/api/*`. Managed with `uv`; runs on `uvicorn` (port 8000).

## Layout

- `app/main.py` - FastAPI app. `GET /api/health` returns `{"status":"ok"}`;
  adds the session middleware, includes the `auth` and `boards` routers, and
  mounts the static site at `/` (the built Next export in `frontend/out` when
  present, else `static/`). Creates and seeds the DB on startup via lifespan.
- `app/config.py` - loads the project-root `.env`; exposes paths and
  `get_static_dir()`, `get_session_secret()`, `get_openai_api_key()`.
- `app/auth.py` - database-backed register / login / logout / me over a signed
  session cookie; `get_current_user` dependency. Each user owns one board.
- `app/security.py` - stdlib PBKDF2 password hashing (`salt_hex$digest_hex`)
  and verification; no plaintext stored or logged.
- `app/db.py` - sqlite3 connection, schema creation, `_migrate`, seeding, and
  `create_user` (seeds the user's board); `get_db` request dependency.
- `app/seed.py` - `SEED_BOARD`, the starter board data (mirrors the frontend
  `initialData`).
- `app/models.py` - Pydantic board and chat models, including `AIBoard`
  (cards as a list for Structured Outputs) and its `to_board_data()`.
- `app/boards.py` - board CRUD scoped to the user plus
  `POST /api/boards/{id}/chat`; `validate_board_data` and `_write_board`.
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
