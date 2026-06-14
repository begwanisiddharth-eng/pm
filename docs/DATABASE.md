# Database

SQLite database storing each Kanban board as a JSON blob. The schema is
multi-board ready: one user can own many boards (the MVP UI uses the first one).
The database file is created and seeded automatically if it does not exist.

## Why JSON blob

The frontend already models a board as a single `BoardData` object
(`frontend/src/lib/kanban.ts`). Storing that object verbatim in a JSON column
keeps the backend trivial: read returns the blob, write validates and replaces
it atomically. No column/card tables, ordering rows, or joins. When richer
cross-board querying is needed later, the `boards.data` blob can be normalized
without changing the API shape.

## Tables

### `users`

| Column       | Type     | Notes                          |
| ------------ | -------- | ------------------------------ |
| `id`         | INTEGER  | Primary key, autoincrement     |
| `username`   | TEXT     | Unique, not null               |
| `created_at` | TEXT     | ISO 8601 timestamp             |

For the MVP, credentials are hardcoded (`user` / `password`) and authentication
does not read this table; it exists so multiple users are supported later.
A password/credential column is intentionally omitted until real auth is added.

### `boards`

| Column       | Type     | Notes                                   |
| ------------ | -------- | --------------------------------------- |
| `id`         | INTEGER  | Primary key, autoincrement              |
| `user_id`    | INTEGER  | Not null, foreign key -> `users.id`     |
| `title`      | TEXT     | Not null (board name)                   |
| `data`       | TEXT     | Not null, JSON-encoded `BoardData`      |
| `created_at` | TEXT     | ISO 8601 timestamp                      |
| `updated_at` | TEXT     | ISO 8601 timestamp, updated on write    |

One row per board. `data` holds the whole board as JSON (see shape below).
`user_id` scopes boards to their owner; the API enforces ownership.

## `BoardData` JSON shape

Matches the frontend `BoardData` type exactly, so the same object round-trips
between the UI, the API, and storage.

```json
{
  "columns": [
    { "id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"] }
  ],
  "cards": {
    "card-1": { "id": "card-1", "title": "Align roadmap", "details": "..." }
  }
}
```

Rules:
- `columns` is an ordered list; each `cardIds` entry is an id that must exist in
  `cards`. Column order and within-column card order are both significant.
- `cards` is keyed by card id; each card has `id`, `title`, `details`.
- Writes are validated against this shape before being stored (Part 6).

## Seeding

On first startup, if the database file is absent it is created and seeded with:
- one user `user`
- one board titled `Kanban Studio` whose `data` is the demo board from the
  frontend `initialData` (5 columns, 8 sample cards)

This guarantees a logged-in user always has a board to load.

## Location and lifecycle

- The SQLite file lives in `backend/` (e.g. `backend/app.db`) and is gitignored.
- Created and seeded lazily on startup if missing; never dropped automatically.
- Tests use a fresh temporary database per test (no shared state).
