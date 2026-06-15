# Frontend

A Next.js 16 (App Router) + React 19 single-board Kanban app, styled with
Tailwind v4 and using `@dnd-kit` for drag and drop. The board is wired to the
FastAPI backend: it loads the signed-in user's board, persists edits on explicit
save, and updates live when the AI assistant changes the board. Built as a
static export (`output: "export"`) and served by the backend at `/`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag and drop
- `clsx` for conditional class names
- Vitest + Testing Library (unit) and Playwright (e2e)
- Path alias `@` -> `src` (see `tsconfig.json`, `vitest.config.ts`)

## Data model - `src/lib/kanban.ts`

Pure, framework-free logic (no React). This is the source of truth for the board
shape and must stay pure (persistence lives in `useBoard.ts`, not here).

- Types:
  - `Card` - `{ id, title, details }`
  - `Column` - `{ id, title, cardIds: string[] }`
  - `BoardData` - `{ columns: Column[], cards: Record<string, Card> }`
    (cards are stored by id; column order is the `cardIds` array)
- `initialData` - the seed board: 5 columns (Backlog, Discovery, In Progress,
  Review, Done) and 8 sample cards. This mirrors the backend seed board.
- `moveCard(columns, activeId, overId)` - returns new columns after a drag:
  handles reorder within a column, move across columns, and drop onto an empty
  column (drop to end). Pure and immutable.
- `createId(prefix)` - generates a unique-ish id from random + timestamp.

## App shell - `src/app/`

- `layout.tsx` - root layout; loads Google fonts (Space Grotesk as
  `--font-display`, Manrope as `--font-body`); sets page metadata.
- `page.tsx` - renders `<KanbanBoard />` at `/`.
- `globals.css` - imports Tailwind and defines the color-scheme CSS variables:
  - `--accent-yellow #ecad0a`, `--primary-blue #209dd7`,
    `--secondary-purple #753991`, `--navy-dark #032147`, `--gray-text #888888`,
    plus surface/stroke/shadow tokens. Use these variables, not raw hex.
- `favicon.ico`.

## Components - `src/components/`

- `KanbanBoard.tsx` (`"use client"`) - the stateful root. Gets `board` and
  persistence helpers from the `useBoard()` hook (loaded from the backend, not
  `initialData`) and tracks the active drag id and the logout-confirm dialog.
  Sets up `DndContext` (PointerSensor, `closestCorners`) and a `DragOverlay`.
  Handlers:
  - `handleDragStart` / `handleDragEnd` - drag lifecycle; `handleDragEnd` calls
    `moveCard`.
  - `handleRenameColumn(columnId, title)`
  - `handleAddCard(columnId, title, details)` - uses `createId("card")`
  - `handleEditCard(cardId, title, details)`
  - `handleDeleteCard(columnId, cardId)`
  Renders a header (title, column chips), a Save / Log out toolbar with a custom
  unsaved-changes dialog, a 5-column grid, and the `ChatSidebar`.
- `KanbanColumn.tsx` - a droppable column (`useDroppable`) wrapping a
  `SortableContext` of cards; inline-editable title `<input>`; card count;
  empty-state placeholder; embeds `NewCardForm`. Root has
  `data-testid="column-<id>"`.
- `KanbanCard.tsx` - a sortable card (`useSortable`) showing title and details
  with Edit and Remove controls; Edit swaps the card to an inline title/details
  form. Root has `data-testid="card-<id>"`.
- `KanbanCardPreview.tsx` - a static, non-interactive card used inside the
  `DragOverlay` while dragging.
- `NewCardForm.tsx` - collapsed "Add a card" button that expands to a
  title/details form; requires a non-empty title; resets on submit/cancel.
- `AuthGate.tsx` / `AuthPanel.tsx` - gate the board behind sign in; `AuthPanel`
  toggles between log in and self-service sign up. `AuthGate` exposes the current
  user and `logout` via context (`useAuth`).
- `ChatSidebar.tsx` - always-visible AI assistant to the right of the columns.

State flows top-down: `KanbanBoard` owns all data and passes callbacks into
columns and cards. There is no global store.

## Tests

- Unit (Vitest, jsdom) - run with `npm run test:unit`:
  - `src/lib/kanban.test.ts` - `moveCard` reorder / cross-column / drop-to-end.
  - `src/components/KanbanBoard.test.tsx` - renders 5 columns; rename a column;
    add then remove a card.
  - Config: `vitest.config.ts` (jsdom, globals, setup `src/test/setup.ts`,
    `@` alias, coverage via v8). `src/test/setup.ts` wires jest-dom matchers.
- e2e (Playwright) - run with `npm run test:e2e`:
  - `tests/kanban.spec.ts` - board loads with 5 columns; add a card; drag a card
    between columns.
  - Config: `playwright.config.ts` - starts `next dev` on 127.0.0.1:3000 and
    runs Chromium against it.

Note: Playwright e2e tests live in `tests/` and are excluded from Vitest.

## Scripts (`package.json`)

- `dev` - `next dev`
- `build` - `next build`
- `start` - `next start`
- `lint` - `eslint`
- `test:unit` / `test:unit:watch` - Vitest
- `test:e2e` - Playwright
- `test:all` - unit then e2e

## Backend integration

- Static export (`output: "export"`) served by FastAPI at `/`; `next dev`
  proxies `/api` to the backend (port 8000).
- `src/lib/api.ts` - fetch client (cookie credentials): register/login/logout/me,
  board CRUD, and `chatWithBoard`.
- `src/lib/useBoard.ts` - loads the user's board, tracks `dirty`, and persists
  only on explicit `save()`; `applyServerBoard` reflects AI updates the server
  already persisted (stays clean). `src/lib/kanban.ts` stays pure.
- `AuthGate` gates the board and provides `logout` via context; `AuthPanel`
  toggles between sign in and self-service sign up.
- `KanbanBoard` - toolbar with Save (left of Log out) and a custom
  unsaved-changes dialog on logout; cards support edit via `KanbanCard`.
- `ChatSidebar` - always-visible AI assistant to the right of the columns; sends
  `{ message, history }` to `/api/boards/{id}/chat` and applies any returned
  board update so the Kanban refreshes automatically.

## Tests added

- Unit: `api.test.ts`, `useBoard.test.ts`, `AuthPanel.test.tsx`,
  `ChatSidebar.test.tsx`, `KanbanBoard.test.tsx`, `NewCardForm.test.tsx`
  (api/backend calls are mocked).
- e2e (`tests/`): `auth`, `kanban`, `persistence`, `chat`, `enhancements`. The
  e2e database is reset by the `test:e2e` script; the chat backend is stubbed via
  route interception for determinism.
