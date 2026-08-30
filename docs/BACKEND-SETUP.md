# Backend setup & Stripe webhooks

Step-by-step guide for running the FastAPI API locally and configuring Stripe payments.

For system design and API overview, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## How to run this project (local)

Sweet1ne is **two servers** from one repo:

| What | Where | Port |
|------|-------|------|
| **Frontend** (Next.js) | repo root | http://localhost:3000 |
| **Backend** (FastAPI) | `backend/` folder | http://localhost:8000 |

Both read **one env file**: `.env.local` at the repo root (copy from `.env.example`).

### Daily workflow — three terminals

**Terminal 1 — Backend (API)**

```powershell
cd backend
.\run.ps1
```

**Terminal 2 — Stripe webhooks** (only while testing payments)

```powershell
.\scripts\stripe-listen.ps1
```

**Terminal 3 — Frontend (website)**

```powershell
npm run dev
```

Then open:

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Website |
| http://localhost:3000/test-tickets | Ticket checkout test page |
| http://localhost:8000/health | API health — `"stripe": true` if keys are set |
| http://localhost:8000/docs | Swagger — try API endpoints in the browser |

Restart the backend after changing `.env.local`.

---

## What is `run.ps1`?

**`.ps1`** = **PowerShell script** (a small program for Windows PowerShell).

`backend/run.ps1` does three things for you:

1. Allows the venv activation script to run (execution policy, this session only)
2. `cd`s into `backend/`
3. Starts the API with `venv\Scripts\python.exe -m uvicorn app.main:app --reload`

So instead of typing activate + uvicorn yourself, you run:

```powershell
cd backend
.\run.ps1
```

The `.\` means “run this script in the current folder.”

> **Not the same as Railway.** Locally we use `--reload` for auto-restart on code changes. On Railway the start command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (no `.ps1` file — that's Linux in the cloud).

---

## PowerShell: one command per line (or use `;`)

PowerShell does **not** chain commands with spaces like bash does with `&&`.

**Wrong** (what causes the “positional parameter” error):

```powershell
cd backend venv\scripts\activate uvicorn app.main:app --reload
```

**Right** — separate lines:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Right** — one line with semicolons:

```powershell
cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload
```

On Windows the folder is **`Scripts`** (capital S), not `scripts`.

---

## Prerequisites

- **Python 3.11+** (`python --version`)
- **Node.js** (for the Next.js frontend — separate terminal)
- **Repo root `.env.local`** — one file shared by frontend and backend (copy from `.env.example`)

---

## Environment file (`.env.local`)

Create at the **repository root** (`SWEET1LIVE/.env.local`), not inside `backend/`.

Both Next.js and FastAPI read this file. It has three sections:

| Section | Who uses it |
|---------|-------------|
| **1. Frontend** | `NEXT_PUBLIC_*` vars (safe in the browser) |
| **2. Backend** | Database, Supabase, auth, staff |
| **3. Stripe** | Payment keys (server-only) |

Minimum to start the API:

```env
DATABASE_URL=postgresql+psycopg2://...   # Supabase PostgreSQL (Session pooler URL)
CORS_ORIGINS=["http://localhost:3000"]
```

The catalogue (menus, events, rooms) works without Stripe. Checkout needs Stripe keys (below).

---

## Run the backend

### First time only

From the repo root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python -m app.seed
```

`app.seed` loads sample rooms and events (safe to run again — it updates, doesn't duplicate).

### Every day (recommended)

**Easiest — run script** (sets execution policy for you):

```powershell
cd backend
.\run.ps1
```

**Or manually** from the repo root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Both `venv` and `.venv` work — `.venv` is a shortcut to the same folder.

Or without activating the venv:

```powershell
cd backend
venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

**Why `app.main:app`?** The FastAPI app lives in `backend/app/main.py` inside the `app` package — not `main.py` at the root of `backend/`.

### Alternative: npm script

From the repo root (does venv/deps/migrate/seed on first run, then starts Uvicorn):

```bash
npm run backend
```

Use this if you prefer one command; daily Python workflow above is fine too.

### URLs

| URL | Purpose |
|-----|---------|
| http://localhost:8000 | API |
| http://localhost:8000/docs | Swagger UI (try endpoints in the browser) |
| http://localhost:8000/health | Health check — `"stripe": true` if secret key is set |

Restart the backend after changing `.env.local`.

---

## Stripe setup

Sweet1ne uses **Stripe Checkout** (hosted payment page). The backend creates a session; the guest pays on Stripe's site. This is **not** the "Payment Link" flow from many YouTube tutorials (fixed link + copy/paste amount).

### Keys you need

| Variable | Required? | Where to get it |
|----------|-----------|-----------------|
| `STRIPE_SECRET_KEY` | Yes (for checkout) | Stripe Dashboard → **Developers → API keys → Secret key** (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Yes (for orders to confirm) | See **Stripe CLI listener** below (`whsec_…`) |

**Not used by this project:**

- **Publishable key** (`pk_…`) — only needed if you embed Stripe.js on your own page
- **Restricted key** (`rk_…`) — optional limited API key; use the secret key above instead

Add to `.env.local` section **3. STRIPE**:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test mode vs live mode

- **Local development:** use **Test mode** in Stripe Dashboard (toggle top-right). Use `sk_test_…` and test card `4242 4242 4242 4242`.
- **Production:** use `sk_live_…` — charges real money; test cards do not work.

Your secret key and webhook secret must be from the **same mode** (both test or both live).

---

## Stripe CLI & webhook listener

Stripe sends payment confirmations to your server via **webhooks**. Locally, your machine isn't on the public internet, so the **Stripe CLI** forwards events to `localhost`.

### 1. Install Stripe CLI (one time)

**Option A — Windows (winget)**

```powershell
winget install Stripe.StripeCli
```

Close and reopen PowerShell, then check:

```powershell
stripe --version
```

If you still get `stripe is not recognized`:

**Option B — Manual download**

1. Download: https://github.com/stripe/stripe-cli/releases/latest (`stripe_*_windows_x86_64.zip`)
2. Unzip `stripe.exe` to a folder, e.g. `C:\Tools\stripe\`
3. Add that folder to your **PATH**, or run with full path:
   ```powershell
   C:\Tools\stripe\stripe.exe listen --forward-to localhost:8000/stripe/webhook
   ```
4. Open a **new** terminal after changing PATH

**Option C — Fix broken winget install**

If `winget list Stripe.StripeCli` shows installed but `stripe` doesn't run, reinstall from https://stripe.com/docs/stripe-cli#install

### 2. Log in (one time)

```powershell
stripe login
```

Complete the browser prompt.

### 3. Run three terminals

**Terminal 1 — Backend**

```powershell
cd backend
.\run.ps1
```

**Terminal 2 — Stripe listener** (keep open while testing payments)

```powershell
.\scripts\stripe-listen.ps1
```

Or directly (if `stripe` is on PATH):

```powershell
stripe listen --forward-to localhost:8000/stripe/webhook
```

You'll see output like:

```text
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx
```

Copy the **`whsec_…`** value into `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

**Restart the backend** (Terminal 1) so it loads the new secret.

**Terminal 3 — Frontend**

```powershell
npm run dev
```

Open http://localhost:3000

> **Important:** Run `stripe listen` whenever you test checkout locally. If you close Terminal 2, webhooks stop reaching your API.

### Production webhooks

On a deployed API (Railway, Render, etc.):

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://your-api-domain.com/stripe/webhook`
3. Events: at least `checkout.session.completed`, `checkout.session.expired`
4. Copy the endpoint **Signing secret** → `STRIPE_WEBHOOK_SECRET` in production env

No Stripe CLI needed in production.

---

## Test that Stripe works

### 1. Config check

- http://localhost:8000/health → `"stripe": true`
- http://localhost:3000/staff-dashboard/settings → **Stripe webhooks** shows configured (after `STRIPE_WEBHOOK_SECRET` is set)

### 2. End-to-end checkout (best test)

1. Backend + `stripe listen` + frontend all running
2. Open http://localhost:3000/test-tickets (or any event under **Live & Events**)
3. On Stripe Checkout, pay with test card (test mode only):
   - **4242 4242 4242 4242**
   - Any future expiry, any CVC
4. In the **stripe listen** terminal, look for:
   ```text
   checkout.session.completed [200]
   ```
5. You should reach the success page; the order is marked paid in the database.

### 3. Quick webhook pipe test (optional)

With `stripe listen` running:

```powershell
stripe trigger checkout.session.completed
```

This proves Stripe → your server works, but it won't match a real order in your DB. Use the ticket checkout flow for a full test.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Set-Location : A positional parameter cannot be found` | You chained commands with spaces — use **`;`** or separate lines (see above) |
| `ModuleNotFoundError: app` | Run uvicorn from **`backend/`** directory |
| Checkout returns 503 | Set `STRIPE_SECRET_KEY` in `.env.local`, restart backend |
| Payment succeeds but order stays pending | Run `stripe listen`, set `STRIPE_WEBHOOK_SECRET`, restart backend |
| Webhook signature error | `whsec_…` must match the **current** `stripe listen` session; re-copy after restarting listen |
| Test card declined on live key | Switch to **test mode** and `sk_test_…` for local dev |
| `stripe` not recognized | Install Stripe CLI (see above); restart terminal; or use full path to `stripe.exe` |
| Activate.ps1 not found | Use **`venv`**, not `.venv`: `backend\venv\Scripts\Activate.ps1` |

---

## Quick reference

```powershell
# Backend (daily) — easiest
cd backend
.\run.ps1

# Backend (manual)
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Stripe webhooks (while testing payments)
.\scripts\stripe-listen.ps1

# Frontend
npm run dev
```
