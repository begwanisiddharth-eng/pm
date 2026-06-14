# Project Management MVP

A single-board Kanban app with user sign-up, persistent boards, and an AI
assistant that can edit the board. FastAPI backend (serves the built Next.js
frontend), SQLite storage, OpenAI `gpt-4o-mini` for chat.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Node.js 20+ and npm
- A `.env` file in the project root with `OPENAI_API_KEY=...`

## Run

Build the frontend, then start the server on http://localhost:8000.

Windows (PowerShell):

```powershell
./scripts/start.ps1 -Build
./scripts/stop.ps1
```

Mac/Linux:

```bash
./scripts/start.sh --build
./scripts/stop.sh
```

Sign in with the seeded account `user` / `password`, or create a new account.
Omit `-Build` / `--build` to start without rebuilding the frontend.

## Develop (hot reload)

Run the two servers separately; the frontend proxies `/api` to the backend.

```bash
# terminal 1 - backend on :8000
cd backend && uv run uvicorn app.main:app --reload --port 8000

# terminal 2 - frontend on :3000
cd frontend && npm install && npm run dev
```

Open http://localhost:3000.

## Test

```bash
# backend (pytest, coverage)
cd backend && uv run pytest

# frontend unit (Vitest)
cd frontend && npm run test:unit

# frontend end-to-end (Playwright; starts its own servers)
cd frontend && npm run test:e2e
```

Tests marked `live` make real OpenAI calls and are skipped by default. Run them
with: `cd backend && uv run pytest -o addopts="" -m live`.

## Layout

- `backend/` - FastAPI app, SQLite, auth, board API, AI chat (`uv`)
- `frontend/` - Next.js + React app (static export served by the backend)
- `scripts/` - start/stop/build scripts for Windows and Unix
- `docs/` - plan, task list, and database design
