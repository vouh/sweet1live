# CI/CD quick start — push to `main` → live

How deploys work for Sweet1ne Live:

| What you change | Who deploys | When |
|-----------------|-------------|------|
| Frontend (`src/`, etc.) | **Vercel** (GitHub integration) | Every push to `main` |
| Backend (`backend/`) | **GitHub Actions → Ubuntu VPS** | Push to `main` that touches `backend/**` |
| Both | Both | Same push |

Full VPS setup (nginx, systemd, DNS): [DEPLOY-HETZNER-VERCEL.md](./DEPLOY-HETZNER-VERCEL.md).

---

## What was added in this repo

```text
.github/workflows/ci.yml           # lint frontend + compile backend on push/PR
.github/workflows/deploy-api.yml   # SSH to VPS, git pull, migrate, restart API
```

---

## One-time setup (required before auto-deploy works)

### 1) Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `vouh/sweet1live`
2. Framework: Next.js (auto)
3. Add environment variables (same as local production values), at least:
   - `NEXT_PUBLIC_API_URL` = `https://api.sweetlive.com` (or your API URL)
   - any other `NEXT_PUBLIC_*` / server secrets the app needs
4. Deploy
5. In Vercel → **Settings → Git**: Production Branch = `main`

After this, **every `git push origin main` rebuilds the site on Vercel**. No GitHub Action needed for the frontend.

### 2) Backend → Ubuntu VPS secrets (GitHub)

VPS must already have the app at `/var/www/sweet1live`, systemd unit `sweet1live-api`, and passwordless sudo for restart (see Part N in the deploy guide).

On your PC, create an SSH key **only for Actions**:

```powershell
ssh-keygen -t ed25519 -C "github-actions-sweet1live" -f $env:USERPROFILE\.ssh\sweet1live_gha -N '""'
```

On the VPS (as `deploy`):

```bash
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Public key file on Windows: `Get-Content $env:USERPROFILE\.ssh\sweet1live_gha.pub`

In GitHub → repo **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|--------|
| `HETZNER_HOST` | VPS IP or `api.sweetlive.com` |
| `HETZNER_USER` | `deploy` |
| `HETZNER_SSH_KEY` | Full private key (`Get-Content $env:USERPROFILE\.ssh\sweet1live_gha -Raw`) |
| `HETZNER_SSH_PORT` | Optional; only if SSH is not port 22 |

Also ensure the VPS can `git pull` without a password (public repo, or a read-only deploy key — Part N4 of the deploy guide).

### 3) Passwordless API restart on VPS

```bash
sudo nano /etc/sudoers.d/sweet1live-deploy
```

```text
deploy ALL=(root) NOPASSWD: /bin/systemctl restart sweet1live-api, /bin/systemctl status sweet1live-api, /bin/systemctl is-active sweet1live-api
```

```bash
sudo chmod 440 /etc/sudoers.d/sweet1live-deploy
sudo visudo -cf /etc/sudoers.d/sweet1live-deploy
```

---

## Day-to-day use

```powershell
cd c:\PROJECTS\SWEET1LIVE
git add .
git commit -m "Your message"
git push origin main
```

Then:

1. **Frontend** — Vercel dashboard → Deployments (or project URL)
2. **Backend** — https://github.com/vouh/sweet1live/actions → **Deploy API** (runs only if `backend/` changed)
3. Health check: `https://api.sweetlive.com/health`

### Manual backend redeploy (no new commit)

GitHub → **Actions** → **Deploy API** → **Run workflow** → branch `main`.

### Frontend-only change

Push as usual. Deploy API workflow **skips** (path filter). Vercel still deploys.

### Backend-only change

Push as usual. Deploy API runs. Vercel may also rebuild (harmless) unless you later add an ignore rule in Vercel.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Permission denied (publickey) | Wrong/missing `HETZNER_SSH_KEY`, or public key not in VPS `authorized_keys` |
| sudo password required | Fix sudoers file above |
| git pull fails on VPS | Private repo needs deploy key / SSH remote (Part N4) |
| alembic / DB error | Fix `/var/www/sweet1live/.env.local` on the VPS |
| Vercel site up, no data | Check `NEXT_PUBLIC_API_URL` and API `CORS_ORIGINS` |

Secrets (Stripe, DB) stay on the VPS in `.env.local` — do **not** put them in GitHub Actions for this setup.
