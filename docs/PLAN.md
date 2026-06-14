# High level steps for project

Part 1: Plan

Enrich this document to plan out each of these parts in detail, with substeps listed out as a checklist to be checked off by the agent, and with tests and success critieria for each. Also create an AGENTS.md file inside the frontend directory that describes the existing code there. Ensure the user checks and approves the plan.

Part 2: Scaffolding

Set up the backend in backend/ with FastAPI, and write the start and stop scripts in the scripts/ directory. This should serve example static HTML to confirm that a 'hello world' example works running locally and also make an API call.

Part 3: Add in Frontend

Now update so that the frontend is statically built and served, so that the app has the demo Kanban board displayed at /. Comprehensive unit and integration tests.

Part 4: Add in a fake user sign in experience

Now update so that on first hitting /, you need to log in with dummy credentials ("user", "password") in order to see the Kanban, and you can log out. Comprehensive tests.

Part 5: Database modeling

Now propose a database schema for the Kanban, saving it as JSON. Document the database approach in docs/ and get user sign off.

Part 6: Backend

Now add API routes to allow the backend to read and change the Kanban for a given user; test this thoroughly with backend unit tests. The database should be created if it doesn't exist.

Part 7: Frontend + Backend

Now have the frontend actually use the backend API, so that the app is a proper persistent Kanban board. Test very throughly.

Part 8: AI connectivity

Now allow the backend to make an AI call via OpenAI. Test connectivity with a simple "2+2" test and ensure the AI call is working.

Part 9: Now extend the backend call so that it always calls the AI with the JSON of the Kanban board, plus the user's question (and conversation history). The AI should respond with Structured Outputs that includes the response to the user and optionaly an update to the Kanban. Test thoroughly.

Part 10: Now add a beautiful sidebar widget to the UI supporting full AI chat, and allowing the LLM (as it determines) to update the Kanban based on its Structured Outputs. If the AI updates the Kanban, then the UI should refresh automatically.

## Enhancements

Requested after the 10-part MVP was complete. Detailed, checkable tasks for E2-E4
live in the Enhancements section of `docs/TASKS.md`.

E1: Always-visible AI assistant. The assistant is always shown (no toggle),
positioned to the right of the board columns and about 3-4 inches tall. All
columns continue to appear in a single row and never wrap to the next row.

E2: Multiple users, single board each. Support multiple user accounts via
self-service sign-up (username + password, stored hashed in the database).
Login validates against the database. Each user has exactly one board, seeded on
sign-up. Boards remain one-per-user; multiple boards per user are out of scope.

E3: Explicit save with an unsaved-changes guard. Replace autosave with an
explicit Save button placed to the left of Log Out. Only saved changes are
persisted. Logging out with unsaved changes prompts the user: "You have unsaved
changes. Save before logging out?" - OK saves then logs out; Cancel logs out
without saving. The guard applies on logout only.

E4: Edit a card. Allow editing a card's title and details via an Edit control
that opens a form, consistent with the add-card form.