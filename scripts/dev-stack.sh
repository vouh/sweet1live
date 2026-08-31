#!/usr/bin/env bash
# One command: restart API, Stripe webhooks, re-seed, and Next.js dev server.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
PY="$BACKEND/venv/bin/python"
ENV_LOCAL="$ROOT/.env.local"
STRIPE_LOG="${TMPDIR:-/tmp}/sweet1ne-stripe-listen.log"

cleanup() {
  echo ""
  echo "Stopping background services..."
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${STRIPE_PID:-}" ]] && kill "$STRIPE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "Sweet1ne dev stack"
echo "=================="
echo ""

if [[ -x "$BACKEND/stop.sh" ]]; then
  bash "$BACKEND/stop.sh" || true
fi

export BACKEND_SEED=1
bash "$ROOT/scripts/backend-dev.sh" &
API_PID=$!
sleep 2
kill "$API_PID" 2>/dev/null || true

# Stripe + backend — mac/linux users: install stripe CLI globally
if ! command -v stripe >/dev/null 2>&1; then
  echo "Install Stripe CLI: https://stripe.com/docs/stripe-cli"
  exit 1
fi

: > "$STRIPE_LOG"
stripe listen --forward-to localhost:8000/stripe/webhook >>"$STRIPE_LOG" 2>&1 &
STRIPE_PID=$!

WHSEC=""
for _ in $(seq 1 50); do
  if grep -Eo 'whsec_[a-zA-Z0-9]+' "$STRIPE_LOG" | head -1 | read -r WHSEC; then
    break
  fi
  sleep 0.4
done

if [[ -z "$WHSEC" ]]; then
  echo "Could not read webhook secret from Stripe CLI."
  exit 1
fi

export STRIPE_WEBHOOK_SECRET="$WHSEC"
cd "$BACKEND"
"$PY" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
API_PID=$!
cd "$ROOT"

echo "API:    http://localhost:8000"
echo "Stripe: webhooks forwarded (secret synced for this session)"
echo "Site:   http://localhost:3000"
echo ""

npm run dev
