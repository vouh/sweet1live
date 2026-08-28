#!/usr/bin/env bash
# One-command backend dev server (macOS / Linux).
# Usage: npm run backend

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
VENV="$BACKEND/.venv"
ENV_LOCAL="$ROOT/.env.local"
ENV_EXAMPLE="$ROOT/.env.example"

if [[ ! -f "$ENV_LOCAL" ]]; then
  if [[ -f "$ENV_EXAMPLE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_LOCAL"
    echo "Created .env.local — add DATABASE_URL and other secrets, then run again."
    exit 1
  fi
  echo "Missing .env.local at repo root."
  exit 1
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Creating Python virtualenv..."
  python3 -m venv "$VENV"
fi

echo "Installing Python dependencies..."
"$VENV/bin/pip" install -q -r "$BACKEND/requirements.txt"

cd "$BACKEND"

echo "Applying database migrations..."
"$VENV/bin/python" -m alembic upgrade head

echo "Seeding rooms and events (idempotent)..."
"$VENV/bin/python" -m app.seed

echo ""
echo "API:   http://localhost:8000"
echo "Docs:  http://localhost:8000/docs"
echo ""

exec "$VENV/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
