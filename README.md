# sweet1live

Website and booking platform for Sweet1ne LIVE — a Next.js front end over a FastAPI backend,
with Stripe-powered event ticketing and deposit-backed hire across the venue's seven rooms.

## Documentation

| Doc | Contents |
| ----- | ---------- |
| [docs/BACKEND-SETUP.md](docs/BACKEND-SETUP.md) | **Run the backend**, env file, Stripe + webhook listener, testing |
| [docs/DEPLOY-HETZNER-VERCEL.md](docs/DEPLOY-HETZNER-VERCEL.md) | **Production deploy** — Hetzner API, Vercel frontend, GoDaddy DNS, GitHub Actions |
| [docs/CI-CD.md](docs/CI-CD.md) | **Push to main** — Vercel + GitHub Actions auto-deploy how-to |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, API overview, deploy |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | All 14 tables, columns, PKs/FKs, ERDs |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual / UX design notes |

## Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind v4, GSAP/Motion |
| Backend  | FastAPI, SQLModel, Alembic                                  |
| Database | SQLite for local dev, Postgres/Supabase in production       |
| Payments | Stripe Checkout (hosted) + webhooks                         |

## Running locally

### Backend

See **[docs/BACKEND-SETUP.md](docs/BACKEND-SETUP.md)** for full steps (venv, uvicorn, Stripe, webhooks).

Quick start:

```powershell
cd backend
venv\scripts\activate
uvicorn app.main:app --reload
```

Or from repo root: `npm run backend` (first-time setup + start).

First time: copy `.env.example` → `.env.local` and set `DATABASE_URL`.

| URL | Purpose |
| ----- | --------- |
| http://localhost:8000 | API |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | Health check |

Config is read from **repo root `.env.local`** (shared with Next.js) — not `backend/.env`.

The API runs without Stripe configured — the catalogue reads fine, and only checkout
returns 503 until `STRIPE_SECRET_KEY` is set.

### Frontend

```bash
npm install
npm run dev                   # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` in `.env.local` points the site at the API (default
`http://localhost:8000`).

### Stripe webhooks in development

See [docs/BACKEND-SETUP.md](docs/BACKEND-SETUP.md#stripe-cli--webhook-listener).

```bash
stripe listen --forward-to localhost:8000/stripe/webhook
```

Paste the printed `whsec_…` into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart the backend.

## How payments work

All money is stored and charged as **integer pence** — never floats. Prices come from the
database, never from the client; the browser only picks *which* ticket and *how many*.

**Ticket flow**

1. `POST /checkout/tickets` validates the cart, moves seats into `quantity_reserved`,
   opens a `pending` order, and returns a Stripe Checkout URL.
2. The guest pays on Stripe's hosted page.
3. `checkout.session.completed` arrives at `POST /stripe/webhook`. Seats move from
   reserved to sold, and one `Ticket` row per seat is minted with a unique door code.
4. If the guest walks away, `checkout.session.expired` (or the background sweeper, every
   two minutes) releases the seats back to the pool.

**Room flow** is the same shape: a booking is held in `pending_payment`, Stripe takes the
room's deposit, and the webhook flips it to `confirmed`. A room never holds two
overlapping bookings, and a published event in that room blocks the windows it runs across.

**Idempotency.** Stripe delivers webhooks at least once. Every processed event id is
written to `stripe_events` under a primary key, and `mark_order_paid` is safe to run twice —
a redelivery can never mint a second set of tickets. The success page calls
`POST /orders/{ref}/sync` to reconcile directly with Stripe, so guests see their tickets
even if the webhook is delayed.

## The seven rooms

| Room                     | Seated | Standing | Deposit |
| ------------------------ | -----: | -------: | ------: |
| The Main Room            |    160 |      250 |    £500 |
| The Lounge               |     60 |       80 |    £250 |
| The Cellar               |     45 |       60 |    £200 |
| The Alcove               |     24 |       30 |    £150 |
| The Snug                 |      8 |       12 |     £50 |
| The Gallery              |     40 |       70 |    £200 |
| The Private Dining Room  |     30 |       45 |    £250 |

Each room sells four windows a day — Daytime, Early evening, Late set, and a Full day
exclusive that deliberately overlaps the other three.

## Door operations

Check-in endpoints are gated on the `X-Staff-Key` header (`STAFF_API_KEY`):

- `POST /tickets/check-in` — scan a code; accepts once, rejects the second scan
- `GET /tickets/door/{event_slug}` — guest list with sold / checked-in counts
- `GET /tickets/lookup/{code}` — inspect a single ticket

## Deploy (Vercel — frontend)

The Next.js site deploys from the repo root. Config lives in [`vercel.json`](vercel.json).

1. Push this repo to GitHub / GitLab / Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new) — framework **Next.js** is auto-detected.
3. In **Project → Settings → Environment Variables**, add:

| Name | Notes |
| ---- | ----- |
| `NEXT_PUBLIC_API_URL` | Public URL of your FastAPI host (not localhost) |
| `RESEND_API_KEY` | Optional — admin forgot-password emails |
| `RESEND_FROM` | Optional — e.g. `Sweet1ne Live <hello@yourdomain.com>` |

4. Deploy. Preview + production URLs are issued automatically.
5. Point the FastAPI `CORS_ORIGINS` / `PUBLIC_SITE_URL` at your Vercel domain.

Local template: copy [`.env.example`](.env.example) → `.env.local`.

> The Python API under `backend/` is **not** part of the Vercel build — host it separately (Railway, Render, Fly, etc.) and set `NEXT_PUBLIC_API_URL` to that URL.

## Tests

```bash
cd backend
python -m pytest tests/ -q
```

Covers the full purchase path with Stripe's network calls stubbed: holds, payment,
ticket minting, duplicate webhooks, oversell protection, room clashes, and hold expiry.
