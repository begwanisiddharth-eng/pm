# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-board Kanban app: user sign-up, persistent boards, and an AI assistant
that can edit the board. FastAPI backend serves the built Next.js frontend as a
static export; SQLite for storage; OpenAI `gpt-4o-mini` for chat.

## Commands

Run the full app (build frontend, then serve on http://localhost:8000):

```powershell
./scripts/start.ps1 -Build   # omit -Build to skip the frontend rebuild
./scripts/stop.ps1
```

(`scripts/start.sh --build` / `scripts/stop.sh` on Mac/Linux.)

Hot-reload development runs the two servers separately; `next dev` proxies `/api`
to the backend (see `frontend/next.config.ts`):

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000   # :8000
cd frontend && npm install && npm run dev                        # :3000, open this
```

Tests:

```bash
cd backend && uv run pytest                  # pytest + coverage; live tests deselected
cd backend && uv run pytest tests/test_boards.py::test_name   # single test
cd backend && uv run pytest -o addopts="" -m live             # real OpenAI calls

cd frontend && npm run test:unit             # Vitest (jsdom)
cd frontend && npm run test:e2e              # Playwright; resets ../backend/e2e.db, starts its own servers
cd frontend && npm run lint                  # eslint
```

Use `uv` for all Python work (`uv run ...`, `uv add ...`) — never `pip`/`python3`.

## Architecture

**Backend (`backend/app/`)** — FastAPI mounted in `main.py`: `/api/health`, the
`auth` and `boards` routers, then a `StaticFiles` mount at `/` serving the built
frontend (`frontend/out` if present, else `backend/static`). DB is created and
seeded on startup via the lifespan handler.

- `db.py` — SQLite connection, `SCHEMA` (users, boards), `init_db` (create +
  `_migrate` + `seed`). Each user owns exactly one board, seeded from
  `seed.py:SEED_BOARD`. `get_db` is the request-scoped FastAPI dependency.
- `auth.py` — register/login/logout/me backed by a signed HTTP-only session
  cookie (Starlette `SessionMiddleware`). `get_current_user` is the auth
  dependency that other routes depend on.
- `security.py` — stdlib PBKDF2 password hashing (`salt_hex$digest_hex`).
- `boards.py` — board CRUD scoped to the authenticated user (`_owned_board`
  enforces ownership → 404). `validate_board_data` rejects columns referencing
  unknown cards. `POST /{id}/chat` runs the AI and, when it returns a board,
  persists it via `_write_board` before responding.
- `ai.py` — OpenAI client. `chat_about_board` uses Structured Outputs
  (`client.chat.completions.parse`) with `response_format=AIStructuredResponse`.
- `models.py` — Pydantic models. `BoardData` (`columns`, `cards` keyed by id)
  mirrors the frontend type. Note `AIBoard`: the model emits cards as a **list**
  (Structured Outputs has no open-ended maps); `to_board_data()` converts to the
  keyed `BoardData` server-side.

**Frontend (`frontend/src/`)** — Next.js 16 App Router + React 19, Tailwind v4,
`@dnd-kit` for drag/drop. Static export (`output: "export"`).

- `lib/kanban.ts` — pure, framework-free board logic and types; the source of
  truth for board shape. Keep it pure (no React, no fetch). `moveCard` handles
  reorder/cross-column/drop-to-empty immutably.
- `lib/api.ts` — fetch client (always `credentials: "include"`).
- `lib/useBoard.ts` — loads the user's board and tracks `dirty`. Local edits go
  through `setBoard` (marks dirty); persistence happens **only on explicit
  `save()`**. AI updates come back already persisted server-side, so apply them
  via `applyServerBoard` (stays clean) — do not re-save them.
- `components/` — `KanbanBoard` is the stateful root owning all data and passing
  callbacks down (no global store); `ChatSidebar` posts `{ message, history }`
  to `/api/boards/{id}/chat` and applies any returned board; `AuthGate`/
  `AuthPanel` gate the board behind sign in / self-service sign up.

## Conventions

- Default seeded account: `user` / `password`. `.env` at project root holds
  `OPENAI_API_KEY` (and optional `SESSION_SECRET`).
- Use the color CSS variables in `globals.css` (e.g. `--primary-blue`), not raw
  hex. Palette is documented in `AGENTS.md`.
- Test DB override: backend tests use a temp SQLite via the `db_conn`/`client`
  fixtures in `tests/conftest.py`; e2e uses `backend/e2e.db` (reset by the
  `test:e2e` script). `PM_DB_PATH` env var overrides the DB location.
- Keep it simple — no defensive programming or speculative features. Identify the
  root cause before fixing; prove the problem before changing code. No emojis.

## Docs

`docs/` holds `PLAN.md`, `TASKS.md`, `DATABASE.md`. Per-directory `AGENTS.md`
files (root, `backend/`, `frontend/`) carry more detail on requirements and
component structure.
