#!/usr/bin/env bash
# Stop the FastAPI server started by start.sh (Mac/Linux).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDFILE="$ROOT/scripts/.server.pid"
if [ -f "$PIDFILE" ]; then
  kill "$(cat "$PIDFILE")" 2>/dev/null || true
  rm "$PIDFILE"
  echo "Server stopped"
else
  echo "No running server found"
fi
