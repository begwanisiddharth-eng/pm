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

- [x] Add `openai` dependency
- [x] AI client module (`app/ai.py`) reading `OPENAI_API_KEY`; model `gpt-4o-mini`
- [x] `ask()` helper that asks "what is 2+2" and returns the answer (covered by a
      live test rather than a standalone ping route)
- [x] Clear error if API key missing/invalid (no key leakage in logs)

Tests:
- [x] Unit: AI client builds the request correctly (mocked OpenAI client)
- [x] Unit: missing key path returns a clear error
- [x] Live test (marked `live`, deselected by default) hitting real OpenAI for
      "2+2" returns "4" - verified passing

Success criteria: with a valid key, the 2+2 call returns 4; without a key, a
clear error is returned; no secrets logged.

---

## Part 9 - AI over the board with Structured Outputs

Goal: AI always receives the board JSON + the user's question + conversation
history, and responds with Structured Outputs containing a user-facing reply and
an optional board update.

- [x] Define the structured response schema: `{ reply: str, board: AIBoard |
      null }` (cards as a list for Structured Outputs; converted to BoardData)
- [x] `POST /api/boards/{board_id}/chat` accepting `{ message, history }`;
      loads board, calls `gpt-4o-mini` with board JSON + history + message
- [x] If the model returns a board update: validate it, persist via the same
      board-write path, and return it
- [x] Return `{ reply, board }` to the client; never persist an invalid board

Tests:
- [x] Unit: prompt assembly includes board JSON, history, and message
- [x] Unit (mocked OpenAI): reply-only response leaves board unchanged
- [x] Unit (mocked OpenAI): board-update response validates and persists
- [x] Unit: invalid board update from model is rejected, board unchanged, error
      surfaced
- [x] Auth: chat route requires session and board ownership
- [x] Live test (marked) for a simple add-a-card instruction - verified passing

Success criteria: chat endpoint reliably returns structured replies; valid board
updates persist and invalid ones are rejected; board ownership enforced.

---

## Part 10 - AI chat sidebar UI

Goal: a polished chat sidebar; the AI can update the board via Structured
Outputs, and the UI refreshes automatically when it does.

- [x] Sidebar chat widget (matches color scheme: yellow `#ecad0a`, blue
      `#209dd7`, purple `#753991`, navy `#032147`, gray `#888888`)
- [x] Message list, input, send; shows user + AI messages; loading state
- [x] Send `{ message, history }` to the chat endpoint; append AI reply
- [x] When response includes a board update, replace board state (via
      `applyServerBoard`) so the Kanban refreshes automatically
- [x] Keep conversation history client-side and send it each request

Tests:
- [x] Frontend unit: chat widget renders, sends message, appends reply (mocked
      API); board refreshes when response includes a board
- [x] e2e: open sidebar, send a message, see a reply; the update adds a card that
      appears without manual refresh (chat backend stubbed for determinism)
- [x] Regression: existing board e2e (drag/add/rename) still pass with sidebar

Success criteria: users can chat with the AI; AI-driven board changes appear
immediately and persist; existing board functionality is unaffected.

---

## Definition of done (whole MVP)

- [x] Login gate works; only authenticated users reach the board
- [x] Board is persistent in SQLite (created if absent), multi-board ready
- [x] AI chat can create/edit/move cards via Structured Outputs and the UI
      refreshes automatically
- [x] Backend coverage >= 90%; frontend unit + e2e green
- [x] App runs locally via start/stop scripts on the dev OS
- [x] `README.md`, `AGENTS.md` files, `docs/DATABASE.md` are accurate and concise

---

## Enhancements

Post-MVP changes. E1 (always-visible assistant) is a direct UI change; E2-E4 are
detailed below per the request.

### E1 - Always-visible AI assistant

- [x] Redesign `ChatSidebar` to be always visible (no toggle), fixed height
      (~3-4 inches), scrollable message list, input pinned at the bottom
- [x] Place it to the right of the columns; columns stay in one row (no wrap)
- [x] Update `ChatSidebar` unit test and `chat` e2e (no open/toggle step)

### E2 - Multiple users (single board each)

- [x] DB: add a hashed-password column to `users`; migrate existing DB if needed
- [x] Password hashing with stdlib `hashlib.pbkdf2_hmac` (per-user salt); never
      store or log plaintext
- [x] `POST /api/register` - create user (unique username), hash password, seed
      one board, log the user in (session). Reject duplicate usernames (409)
- [x] `POST /api/login` - validate username + password against the database
      (replace hardcoded check); keep a seeded default `user`/`password` account
- [x] Each user has exactly one board, seeded on sign-up; no board-management UI
      (multiple boards per user remain out of scope)
- [x] Frontend: sign-up screen and a toggle between Log in and Sign up;
      `api.register`; on success the user's board loads
- [x] Cross-user isolation still enforced (a user only sees their own board)

Tests:
- [x] Backend: register success; duplicate username rejected; login with a
      registered user; login wrong password rejected; password stored hashed
      (not plaintext); each new user gets their own seeded board; cross-user
      board access still 404
- [x] Frontend unit: sign-up form validation/submit and login/sign-up toggle
- [x] e2e: register a new user, see a fresh board; log out; log back in

### E3 - Explicit save with unsaved-changes guard

- [x] Remove debounced autosave from `useBoard`; track `dirty` state
- [x] `save()` persists via `PUT` and clears `dirty`; expose `dirty`, `saving`,
      and `error`; AI updates via `applyServerBoard` are already server-persisted
      and do not mark dirty
- [x] Save button to the left of Log Out; disabled when there are no unsaved
      changes; surfaces save errors
- [x] Logout guard: if `dirty`, open a custom dialog "You have unsaved changes..."
      with Cancel (stay), Log out without saving, and Save and log out
- [x] Coordinate auth logout and board save (auth context or lifted handler)

Tests:
- [x] Frontend unit (`useBoard`): edits mark dirty; `save` persists and clears
      dirty; `applyServerBoard` does not mark dirty
- [x] e2e: edit + Save + reload persists; edit without Save + reload reverts
- [x] e2e: logout with unsaved changes shows the dialog; Save and log out
      persists, Log out without saving does not

### E4 - Edit a card

- [x] Card Edit control opens a title/details form (consistent with add-card),
      with Save/Cancel
- [x] `handleEditCard` updates the card and marks the board dirty
- [x] Keep `src/lib/kanban.ts` pure

Tests:
- [x] Frontend unit: editing a card updates its title and details
- [x] e2e: edit a card and see the new title/details

---

## UI refinements (round 2)

- [x] Chat assistant: increase height and reduce width by ~1.5 cm
      (340px -> ~284px) so columns get more room
- [x] Widen the columns and slightly reduce the gap between them
- [x] Fix Edit/Remove buttons overflowing the side of narrow cards
      (let the card text shrink with `min-w-0`)
- [x] Replace the native logout confirm (browser "localhost:8000 says...") with a
      custom in-app unsaved-changes dialog
- [x] Update the unsaved-changes e2e to drive the custom dialog
