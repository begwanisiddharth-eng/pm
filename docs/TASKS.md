# TASKS

Detailed, checkable task list for the Project Management MVP. Tasks are grouped
by the parts in `PLAN.md`. Each section lists implementation steps, tests, and
success criteria. Check a box off only when its tests pass and the success
criteria are met.

## Architecture decisions (agreed)

- Run locally, no containerization. Single FastAPI server on port 8000 serves
  the statically exported Next site at `/` and the API under `/api/*`.
- Frontend dev uses `next dev` (port 3000) and proxies `/api` to FastAPI; the
  production-like flow is `next build` (static export) served by FastAPI.
- Database: SQLite. Tables `users` and `boards(id, user_id, title, data JSON)`.
  The whole board is stored as a JSON blob; schema is multi-board ready (one
  user can have many boards). MVP UI uses the user's first board.
- API is board-scoped now: `/api/boards`, `/api/boards/{board_id}`.
- Auth: hardcoded `user` / `password`. Signed HTTP-only cookie session.
- AI: OpenAI `gpt-4o-mini` via the `openai` Python SDK using Structured Outputs.
  `OPENAI_API_KEY` comes from `.env` in the project root.
- Chat history is client-held and sent with each request (not persisted in MVP).
- Tooling: `uv` for Python; `pytest` for backend tests; Vitest + Playwright for
  the frontend.
- Testing target: backend line coverage >= 90%; every API route and every AI
  code path covered; frontend unit + e2e cover board CRUD, login, and AI flow.

---

## Part 1 - Plan

- [x] Review existing frontend code and project structure
- [x] Confirm architecture decisions with the user (done)
- [x] Create this `docs/TASKS.md` with sections, checkable tasks, tests, and
      success criteria
- [x] Create `frontend/AGENTS.md` describing the existing frontend code
      (structure, data model in `src/lib/kanban.ts`, components, tests)
- [x] User reviews and approves the plan

Success criteria: `TASKS.md` and `frontend/AGENTS.md` exist and accurately
describe the work and the existing code; the user has approved before any
backend coding begins.

---

## Part 2 - Scaffolding

Goal: a runnable FastAPI backend that serves a static "hello world" page at `/`
and exposes a working API endpoint, plus start/stop scripts.

- [x] Initialize backend Python project with `uv` in `backend/`
      (`pyproject.toml`, pinned Python 3.12+)
- [x] Add dependencies: `fastapi`, `uvicorn[standard]`, `python-dotenv`,
      `pytest`, `httpx` (test client), `pytest-cov`
- [x] Create FastAPI app with:
  - [x] `GET /api/health` returning `{"status": "ok"}`
  - [x] Static file mount serving a placeholder `index.html` at `/`
- [x] Load `.env` from project root (read `OPENAI_API_KEY`, do not log it)
- [x] Write `scripts/start.sh`, `scripts/stop.sh` (Mac/Linux) and
      `scripts/start.ps1`, `scripts/stop.ps1` (Windows) to run/stop uvicorn
- [x] Update `backend/AGENTS.md` and `scripts/AGENTS.md` with real descriptions

Tests:
- [x] `test_health` - `GET /api/health` returns 200 and `{"status":"ok"}`
- [x] `test_root_serves_html` - `GET /` returns 200 and HTML content
- [x] Coverage report generated for backend

Success criteria: `uv run` starts the server; `/` shows the placeholder page;
`/api/health` returns ok; start/stop scripts work on the dev OS; backend tests
pass.

---

## Part 3 - Add in Frontend (static build served by backend)

Goal: the existing Kanban demo is statically built and served by FastAPI at `/`.

- [x] Configure Next for static export (`output: "export"`, `images.unoptimized`
      if needed); verify the demo works as a static export
- [x] Add an `/api` rewrite/proxy for `next dev` so dev hits FastAPI
- [x] Build script that runs `next build`; FastAPI serves `frontend/out` at `/`
      when present (falls back to the placeholder)
- [x] Update start scripts to (optionally) build the frontend then serve

Tests:
- [x] Frontend unit (Vitest): existing `kanban.test.ts` and
      `KanbanBoard.test.tsx` still pass
- [x] e2e (Playwright): board loads at `/`, 5 columns visible, add-card works,
      drag-and-drop moves a card (existing `tests/kanban.spec.ts`)
- [x] Backend `test_root_serves_spa` - `GET /` returns the built Kanban HTML
- [x] Integration: build the export, start FastAPI, verify the served SPA HTML
      and a hashed `_next` asset both load (200) alongside the API

Success criteria: visiting `/` on the FastAPI server shows the working demo
Kanban; all existing frontend tests pass against the served build.

---

## Part 4 - Fake user sign in

Goal: hitting `/` requires login with `user` / `password`; user can log out.

- [x] Backend: `POST /api/login` validates hardcoded creds, sets signed
      HTTP-only session cookie; `POST /api/logout` clears it;
      `GET /api/me` returns current user or 401
- [x] Session signing secret loaded from env (dev default allowed)
- [x] Auth dependency (`get_current_user`) that protects routes; reused by
      `/api/me` now and board routes in Part 6
- [x] Frontend: login page/form; redirect to board when authenticated;
      logout control; unauthenticated users see login

Tests:
- [x] Backend: `test_login_success`, `test_login_bad_password`,
      `test_login_bad_user`, `test_me_requires_session`, `test_me_after_login`,
      `test_logout_clears_session`
- [x] Frontend unit: login form validation and submit behavior
- [x] e2e: visiting `/` shows login; wrong creds show error; correct creds show
      board; logout returns to login; refresh keeps session until logout

Success criteria: only authenticated users see the board; sessions persist
across refresh and clear on logout; all auth tests pass.

---

## Part 5 - Database modeling

Goal: documented SQLite schema storing each board as JSON, multi-board ready.

- [x] Write `docs/DATABASE.md`: tables `users(id, username, ...)`,
      `boards(id, user_id, title, data JSON, created_at, updated_at)`;
      explain JSON blob choice and multi-board direction
- [x] Define the `BoardData` JSON shape (matches frontend `src/lib/kanban.ts`)
- [x] Document seeding: default user `user`; one starter board from the demo's
      `initialData`
- [x] User sign-off on schema

Success criteria: `docs/DATABASE.md` is approved; JSON shape matches the
frontend model exactly.

---

## Part 6 - Backend (board API + persistence)

Goal: API to read and change a user's boards, backed by SQLite, created if
missing. Thorough unit tests.

- [x] Use stdlib `sqlite3` (kept simple, no ORM)
- [x] DB module: create DB and tables if not present; seed default user + board
- [x] Pydantic models for `Card`, `Column`, `BoardData`, board metadata
- [x] Routes (all auth-protected, scoped to current user):
  - [x] `GET /api/boards` - list current user's boards (id, title)
  - [x] `POST /api/boards` - create a board (seeded/empty)
  - [x] `GET /api/boards/{board_id}` - full board data
  - [x] `PUT /api/boards/{board_id}` - replace board data (validated)
  - [x] `DELETE /api/boards/{board_id}` - delete a board
  - [x] 404 when board missing or owned by another user
- [x] Validation: reject malformed board JSON (unknown card ids in columns, etc.)

Tests (pytest, fresh temp DB per test):
- [x] DB creation when file absent; seeding correctness
- [x] Each route happy path
- [x] `GET /api/boards/{id}` 404 for unknown id
- [x] Cross-user access returns 404
- [x] `PUT` persists and round-trips board data
- [x] `PUT` rejects invalid board JSON (400)
- [x] All board routes require auth (401 without session)
- [x] Coverage >= 90% for backend (95%)

Success criteria: DB auto-creates and seeds; all board routes behave per spec
with validation and auth; coverage target met.

---

## Part 7 - Frontend + Backend (persistent board)

Goal: the frontend uses the backend API so the board is persistent.

- [x] API client in frontend (fetch with credentials for cookie session)
- [x] On load: fetch the user's first board; render from server data
- [x] Persist changes (add/edit/delete card, rename column, move card) via
      `PUT /api/boards/{id}` (debounced autosave)
- [x] Loading and error states; optimistic update with rollback on failure
- [x] Keep `src/lib/kanban.ts` pure logic; persistence in the `useBoard` hook

Tests:
- [x] Frontend unit: API client (mocked fetch) for get/put; `useBoard` applies
      server data, saves, and rolls back on failed save
- [x] e2e: rename a column / add a card, reload or re-login, changes persist
- [x] Backend integration: frontend-driven `PUT` is validated and stored

Success criteria: edits survive refresh and re-login because they are stored in
SQLite; failures surface to the user and do not corrupt state.

---

## Part 8 - AI connectivity

Goal: backend can call OpenAI; verify with a simple "2+2" test.

- [ ] Add `openai` dependency
- [ ] AI client module reading `OPENAI_API_KEY`; model `gpt-4o-mini`
- [ ] `POST /api/ai/ping` (or a test) that asks "what is 2+2" and returns the
      answer
- [ ] Clear error if API key missing/invalid (no key leakage in logs)

Tests:
- [ ] Unit: AI client builds the request correctly (mocked OpenAI client)
- [ ] Unit: missing key path returns a clear error
- [ ] Optional live test (marked, skipped by default) hitting real OpenAI for
      "2+2" returns "4"

Success criteria: with a valid key, the 2+2 call returns 4; without a key, a
clear error is returned; no secrets logged.

---

## Part 9 - AI over the board with Structured Outputs

Goal: AI always receives the board JSON + the user's question + conversation
history, and responds with Structured Outputs containing a user-facing reply and
an optional board update.

- [ ] Define the structured response schema: `{ reply: str, board: BoardData |
      null }` (Structured Outputs / JSON schema)
- [ ] `POST /api/boards/{board_id}/chat` accepting `{ message, history }`;
      loads board, calls `gpt-4o-mini` with board JSON + history + message
- [ ] If the model returns a board update: validate it, persist via the same
      board-write path, and return it
- [ ] Return `{ reply, board }` to the client; never persist an invalid board

Tests:
- [ ] Unit: prompt assembly includes board JSON, history, and message
- [ ] Unit (mocked OpenAI): reply-only response leaves board unchanged
- [ ] Unit (mocked OpenAI): board-update response validates and persists
- [ ] Unit: invalid board update from model is rejected, board unchanged, error
      surfaced
- [ ] Auth: chat route requires session and board ownership
- [ ] Optional live test (marked) for a simple add-a-card instruction

Success criteria: chat endpoint reliably returns structured replies; valid board
updates persist and invalid ones are rejected; board ownership enforced.

---

## Part 10 - AI chat sidebar UI

Goal: a polished chat sidebar; the AI can update the board via Structured
Outputs, and the UI refreshes automatically when it does.

- [ ] Sidebar chat widget (matches color scheme: yellow `#ecad0a`, blue
      `#209dd7`, purple `#753991`, navy `#032147`, gray `#888888`)
- [ ] Message list, input, send; shows user + AI messages; loading state
- [ ] Send `{ message, history }` to the chat endpoint; append AI reply
- [ ] When response includes a board update, replace board state so the Kanban
      refreshes automatically
- [ ] Keep conversation history client-side and send it each request

Tests:
- [ ] Frontend unit: chat widget renders, sends message, appends reply (mocked
      API); board refreshes when response includes a board
- [ ] e2e: open sidebar, send a message, see a reply; an instruction that adds a
      card causes the card to appear without manual refresh (mocked or live AI)
- [ ] Regression: existing board e2e (drag/add/rename) still pass with sidebar

Success criteria: users can chat with the AI; AI-driven board changes appear
immediately and persist; existing board functionality is unaffected.

---

## Definition of done (whole MVP)

- [ ] Login gate works; only authenticated users reach the board
- [ ] Board is persistent in SQLite (created if absent), multi-board ready
- [ ] AI chat can create/edit/move cards via Structured Outputs and the UI
      refreshes automatically
- [ ] Backend coverage >= 90%; frontend unit + e2e green
- [ ] App runs locally via start/stop scripts on the dev OS
- [ ] `README.md`, `AGENTS.md` files, `docs/DATABASE.md` are accurate and concise
