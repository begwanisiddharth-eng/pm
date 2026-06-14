#!/usr/bin/env bash
# Build the Next frontend to frontend/out (static export served by FastAPI).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
npm install
npm run build
echo "Frontend built to frontend/out"
