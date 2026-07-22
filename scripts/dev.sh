#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npm install
(
  cd backend && npm install
) &
(
  cd frontend && npm install
) &
wait

( cd backend && npm run dev ) &
BACKEND_PID=$!

( cd frontend && npm run dev ) &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait "$BACKEND_PID" "$FRONTEND_PID"
