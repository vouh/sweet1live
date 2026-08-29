#!/usr/bin/env bash
# Backend dev server. Usage: npm run backend

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
VENV="$BACKEND/.venv"
PY="$VENV/bin/python"
PIP="$VENV/bin/pip"
REQ="$BACKEND/requirements.txt"
DEPS_STAMP="$VENV/.deps-synced"
SEED_STAMP="$VENV/.seeded"
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

if [[ ! -x "$PY" ]]; then
  echo "Creating Python virtualenv..."
  python3 -m venv "$VENV"
fi

if [[ ! -f "$DEPS_STAMP" ]] || [[ "$REQ" -nt "$DEPS_STAMP" ]]; then
  echo "Installing Python dependencies..."
  "$PIP" install -q -r "$REQ"
  touch "$DEPS_STAMP"
fi

cd "$BACKEND"

echo "Applying database migrations..."
"$PY" -m alembic upgrade head

if [[ ! -f "$SEED_STAMP" ]] || [[ "${BACKEND_SEED:-}" == "1" ]]; then
  echo "Seeding rooms and events (first run)..."
  "$PY" -m app.seed
  touch "$SEED_STAMP"
fi

echo ""
echo "API:   http://localhost:8000"
echo "Docs:  http://localhost:8000/docs"
echo ""

exec "$PY" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
