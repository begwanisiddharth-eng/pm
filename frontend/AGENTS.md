# Frontend

A Next.js 16 (App Router) + React 19 single-board Kanban demo, styled with
Tailwind v4 and using `@dnd-kit` for drag and drop. This is currently a pure
frontend-only demo: all state lives in React, there is no backend or
persistence yet. Later parts wire it to the FastAPI backend.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag and drop
- `clsx` for conditional class names
- Vitest + Testing Library (unit) and Playwright (e2e)
- Path alias `@` -> `src` (see `tsconfig.json`, `vitest.config.ts`)

## Data model - `src/lib/kanban.ts`

Pure, framework-free logic (no React). This is the source of truth for the board
shape and should stay pure as persistence is added.

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

- `KanbanBoard.tsx` (`"use client"`) - the stateful root. Holds `board`
  (`BoardData`) in `useState(initialData)` and the active drag id. Sets up
  `DndContext` (PointerSensor, `closestCorners`) and a `DragOverlay`. Handlers:
  - `handleDragStart` / `handleDragEnd` - drag lifecycle; `handleDragEnd` calls
    `moveCard`.
  - `handleRenameColumn(columnId, title)`
  - `handleAddCard(columnId, title, details)` - uses `createId("card")`
  - `handleDeleteCard(columnId, cardId)`
  Renders a header (title, column chips) and a 5-column grid.
- `KanbanColumn.tsx` - a droppable column (`useDroppable`) wrapping a
  `SortableContext` of cards; inline-editable title `<input>`; card count;
  empty-state placeholder; embeds `NewCardForm`. Root has
  `data-testid="column-<id>"`.
- `KanbanCard.tsx` - a sortable card (`useSortable`) showing title, details, and
  a Remove button. Root has `data-testid="card-<id>"`.
- `KanbanCardPreview.tsx` - a static, non-interactive card used inside the
  `DragOverlay` while dragging.
- `NewCardForm.tsx` - collapsed "Add a card" button that expands to a
  title/details form; requires a non-empty title; resets on submit/cancel.

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

## Notes for later parts

- Static export: the app will be built with `output: "export"` and served by
  FastAPI at `/`; Google fonts are fetched at build time, which is fine for
  static export.
- Persistence: keep `src/lib/kanban.ts` pure; add an API client and wire
  `KanbanBoard` to fetch/save `BoardData` via the board-scoped backend API.
- Auth and the AI chat sidebar are added in later parts.
