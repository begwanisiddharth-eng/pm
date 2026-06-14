#!/usr/bin/env bash
# Start the FastAPI server (Mac/Linux). Serves the app at http://localhost:8000
# Pass --build to (re)build the frontend first.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$1" = "--build" ]; then "$ROOT/scripts/build-frontend.sh"; fi
cd "$ROOT/backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
echo $! > "$ROOT/scripts/.server.pid"
echo "Server started (PID $(cat "$ROOT/scripts/.server.pid")) on http://localhost:8000"
