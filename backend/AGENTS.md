# Backend

Python FastAPI backend. Serves the statically exported Next frontend at `/` and
the API under `/api/*`. Managed with `uv`; runs on `uvicorn` (port 8000).

## Layout

- `app/main.py` - FastAPI app. `GET /api/health` returns `{"status":"ok"}`;
  mounts `static/` at `/` (serves `index.html`).
- `app/config.py` - loads the project-root `.env`; exposes paths
  (`PROJECT_ROOT`, `STATIC_DIR`) and `get_openai_api_key()`.
- `static/` - files served at `/`. Currently a placeholder `index.html`; later
  replaced by the built Next export.
- `tests/` - pytest suite (`conftest.py` provides a `TestClient` fixture).

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
