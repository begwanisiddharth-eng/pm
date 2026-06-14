#!/usr/bin/env bash
# Start the FastAPI server (Mac/Linux). Serves the app at http://localhost:8000
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
echo $! > "$ROOT/scripts/.server.pid"
echo "Server started (PID $(cat "$ROOT/scripts/.server.pid")) on http://localhost:8000"
