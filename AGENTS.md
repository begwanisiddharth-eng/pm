# The Project Management MVP web app

## Business Requirements

This project is building a Project Management App. Key features:
- A user can sign in
- When signed in, the user sees a Kanban board representing their project
- The Kanban board has fixed columns that can be renamed
- The cards on the Kanban board can be moved with drag and drop, and edited
- There is an AI chat feature in a sidebar; the AI is able to create / edit / move one or more cards

## Limitations

Users can register and sign in. A default 'user' / 'password' account is seeded; new accounts are created via self-service sign-up (passwords stored hashed).

Each signed-in user has exactly 1 Kanban board (multiple boards per user are out of scope).

For the MVP, this will run locally.

## Technical Decisions

- NextJS frontend
- Python FastAPI backend, including serving the static NextJS site at /
- Run locally with no containerization
- Use "uv" as the package manager for python
- Use OpenAI for the AI calls. An OPENAI_API_KEY is in .env in the project root
- Use `gpt-4o-mini` as the model
- Use SQLLite local database for the database, creating a new db if it doesn't exist
- Auth via a signed HTTP-only session cookie; passwords hashed with PBKDF2 (stdlib)
- Board edits are saved explicitly via a Save button; logging out with unsaved changes prompts to save first
- Start and Stop server scripts for Mac, PC, Linux in scripts/

## Starting Point

A working MVP of the frontend has been built and is already in frontend. It's a pure frontend-only demo.

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding.