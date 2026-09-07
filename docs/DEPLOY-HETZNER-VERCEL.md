# Deploy Sweet1ne: Hetzner + Vercel + GoDaddy + GitHub Actions

Beginner-friendly production deploy guide for **sweetlive.com**.

Related docs:

- [BACKEND-SETUP.md](./BACKEND-SETUP.md) — local API / Stripe CLI
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- [DESIGN.md](./DESIGN.md) — visual system

---

This guide assumes you have **never** deployed a website, never used a VPS, and never configured DNS. Every step says **where to click**, **what to type**, and **how you know it worked**.

Your project already has:
- Frontend: Next.js (this repo root) → will run on **Vercel**
- Backend: FastAPI (`backend/` folder) → will run on a **Hetzner** cloud computer
- Database: **Supabase** Postgres (already in your `.env.local` — leave it there; do not install a database on the VPS)
- Domain: **sweetlive.com** at **GoDaddy**
- Code on GitHub: `https://github.com/vouh/sweet1live.git`

**What “done” looks like**

| What | URL |
|------|-----|
| Public website | https://sweetlive.com |
| www redirect/same site | https://www.sweetlive.com |
| Backend API | https://api.sweetlive.com |
| API health check | https://api.sweetlive.com/health |
| API docs | https://api.sweetlive.com/docs |

```mermaid
flowchart LR
  You["You on Windows"] -->|"SSH"| VPS["Hetzner Ubuntu VPS"]
  Visitor["Visitor browser"] --> GoDaddy["GoDaddy DNS"]
  GoDaddy -->|"sweetlive.com"| Vercel["Vercel frontend"]
  GoDaddy -->|"api.sweetlive.com"| VPS
  Vercel -->|"API calls"| VPS
  VPS --> Supabase["Supabase database"]
  Stripe["Stripe payments"] -->|"webhooks"| VPS
```

**Order of work (do not skip ahead)**
1. Accounts + secrets checklist  
2. Create Hetzner server + SSH in  
3. Install and start the API (HTTP on the server only)  
4. GoDaddy: point `api` at the server → HTTPS for API  
5. Vercel: deploy the website  
6. GoDaddy: point `sweetlive.com` at Vercel  
7. Stripe webhook  
8. **GitHub Actions** — auto-deploy API to Hetzner on every push (frontend already auto-deploys via Vercel)  
9. Test everything  

**Who deploys what after Actions are set up**

| Change you push to `main` | What updates automatically |
|---------------------------|----------------------------|
| Frontend files (`src/`, etc.) | **Vercel** rebuilds the site |
| Backend files (`backend/`) | **GitHub Actions** SSHs into Hetzner, pulls, migrates, restarts API |
| Both | Both run (Vercel + Actions) |  

---

# Part A — Words you will see (30-second glossary)

- **VPS**: a rented computer in a data centre (Hetzner). You control it with SSH.
- **SSH**: a secure terminal connection from your PC to the VPS (like remote command line).
- **DNS**: the phone book of the internet. GoDaddy tells browsers “sweetlive.com lives at …” and “api.sweetlive.com lives at …”.
- **A record**: DNS row that maps a name to an **IP address** (numbers like `49.13.x.x`).
- **CNAME**: DNS row that maps a name to **another name** (used for `www` → Vercel).
- **nginx**: a small program on the VPS that receives HTTPS traffic and forwards it to your API.
- **systemd**: Linux’s way to keep your API running after reboot and after crashes.
- **Vercel**: hosts the Next.js website for you (build + HTTPS + CDN).
- **Environment variables / `.env.local`**: secret settings (database password, Stripe keys). Never put these in GitHub.
- **CORS**: browser security. The API must allow `https://sweetlive.com` or the site cannot call the API.

---

# Part B — What you need before starting

## B1. Accounts (create if missing)

1. **Hetzner Cloud** — https://console.hetzner.cloud/  
   - Sign up / log in  
   - You will need a payment method for the server (~€4–8/month for a small box)

2. **Vercel** — https://vercel.com  
   - Sign up with **GitHub** (recommended — easiest for this repo)  
   - Use the same GitHub account that owns `vouh/sweet1live`

3. **GoDaddy** — you already have `sweetlive.com`

4. **Stripe** — https://dashboard.stripe.com (you already use this)

5. **Supabase** — you already have the project; keep using the same database

## B2. On your Windows PC — tools

1. Open **PowerShell** (Start → type `PowerShell` → Enter).

2. Check Git works:
```powershell
git --version
```
You should see a version number. If not: install from https://git-scm.com/download/win and reopen PowerShell.

3. Check SSH works (Windows 10/11 usually has it):
```powershell
ssh -V
```
You should see `OpenSSH_…`. If not: Settings → Apps → Optional features → Add **OpenSSH Client**.

## B3. Secrets checklist (do this on paper or a password manager)

Open your local file `c:\PROJECTS\SWEET1LIVE\.env.local` in Cursor (do **not** paste secrets into chat or Discord).

You will copy these onto the VPS later. Make a private checklist:

**From your existing `.env.local` (copy carefully)**
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SECRET`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `STRIPE_SECRET_KEY` (use `sk_test_…` for first launch if you want zero risk of real charges)
- [ ] `RESEND_API_KEY` / `RESEND_FROM` (if you use email)
- [ ] `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` / `SUPER_ADMIN_NAME`
- [ ] `NEXT_PUBLIC_SEVENROOMS_VENUE_ID` (for Vercel only)
- [ ] Analytics IDs if you use them

**Generate NEW ones for production** (do not reuse weak local defaults)

On PowerShell:
```powershell
# Run twice — once for JWT_SECRET, once for STAFF_API_KEY
-join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```
- [ ] New `JWT_SECRET` = (paste result 1)
- [ ] New `STAFF_API_KEY` = (paste result 2)

**Fill in later**
- [ ] Hetzner server IPv4 = ________________
- [ ] `STRIPE_WEBHOOK_SECRET` = (after Stripe webhook step)

---

# Part C — Create the Hetzner server

## C1. Create a project
1. Go to https://console.hetzner.cloud/
2. Log in
3. If asked to create a project: name it `sweet1live` → Create

## C2. Add an SSH key (so you can log in without a password)

**On your Windows PowerShell** (once; skip if you already have a key):
```powershell
dir $env:USERPROFILE\.ssh\id_ed25519.pub
```
- If the file **exists**, skip generation.
- If it says cannot find path:
```powershell
ssh-keygen -t ed25519 -C "sweetlive-hetzner"
```
Press Enter to accept the default file path.  
Press Enter twice for empty passphrase (simplest for first time) **or** set a passphrase if you prefer.

Show the public key (this is safe to paste into Hetzner):
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```
Copy the whole line starting with `ssh-ed25519 …`

**In Hetzner console**
1. Left menu → **Security** → **SSH Keys**
2. **Add SSH Key**
3. Paste the public key
4. Name: `my-windows-pc`
5. Save

## C3. Create the server
1. Left menu → **Servers** → **Add Server**
2. **Location**: Falkenstein or Nuremberg (EU)
3. **Image**: Ubuntu → **24.04**
4. **Type**: Shared Resources → pick **CX22** (or CX23 if CX22 is gone). Do not pick huge machines for a first site.
5. **Networking**: leave public IPv4 on
6. **SSH keys**: tick `my-windows-pc`
7. **Name**: `sweet1live-api`
8. Click **Create & Buy now**
9. Wait until status is **Running**
10. Click the server name → copy **IPv4** → write it in your checklist

## C4. First SSH login from Windows

In PowerShell (replace with your real IP):
```powershell
ssh root@YOUR_HETZNER_IPV4
```

First time Windows asks: `Are you sure you want to continue connecting?`  
Type `yes` and Enter.

You should see a prompt like `root@sweet1live-api:~#`  
**You are now on the server.** Everything you type until you `exit` runs on Hetzner, not on your PC.

If it fails:
- “Permission denied”: wrong key selected when creating the server; add key and rebuild, or use Hetzner Console (browser terminal) from the server page
- “Connection timed out”: wrong IP, or your network blocks port 22

---

# Part D — Secure the server and create a normal user

Still as `root` on the VPS:

```bash
apt update
apt upgrade -y
```
(This can take several minutes. Wait until the prompt returns.)

Create a non-root user named `deploy`:
```bash
adduser deploy
```
- Enter a strong password (twice) when asked  
- You can press Enter through Name/Room/etc.  
- Confirm `Y`

Give `deploy` sudo (admin) rights:
```bash
usermod -aG sudo deploy
```

Copy your SSH key so `deploy` can log in:
```bash
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Turn on the firewall (allow SSH + website ports only):
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```
You should see OpenSSH, 80, 443 allowed.

Log out:
```bash
exit
```

Log back in as `deploy` (from Windows PowerShell):
```powershell
ssh deploy@YOUR_HETZNER_IPV4
```
When you need admin commands, put `sudo` in front (it may ask for the `deploy` password).

---

# Part E — Install software the API needs

As `deploy` on the VPS:
```bash
sudo apt install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx git
```

Check:
```bash
python3 --version
nginx -v
git --version
```

---

# Part F — Put your code on the server

## F1. Clone from GitHub

```bash
sudo mkdir -p /var/www/sweet1live
sudo chown deploy:deploy /var/www/sweet1live
cd /var/www/sweet1live
git clone https://github.com/vouh/sweet1live.git .
```

**If the repo is private**, GitHub will reject anonymous clone. Then either:
- Make a GitHub **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens) and clone with:
  `git clone https://YOUR_USERNAME:YOUR_TOKEN@github.com/vouh/sweet1live.git .`
- Or use SSH deploy keys (advanced). For a first deploy, a token is fine; do not commit the token.

Check the folders exist:
```bash
ls
ls backend
```
You should see `package.json`, `src`, `backend`, etc.

## F2. Create the production secrets file

The API reads **`/var/www/sweet1live/.env.local`** (repo root), not only `backend/.env`.

```bash
nano /var/www/sweet1live/.env.local
```

`nano` is a text editor in the terminal:
- Paste your env contents (see template below)
- Save: `Ctrl+O`, Enter  
- Exit: `Ctrl+X`

**Template** (replace every `…` with your real values):

```env
DATABASE_URL=…
SUPABASE_SERVICE_ROLE_KEY=…
SUPABASE_JWT_SECRET=…
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…

CORS_ORIGINS=["https://sweetlive.com","https://www.sweetlive.com"]
PUBLIC_SITE_URL=https://sweetlive.com

JWT_SECRET=…
STAFF_API_KEY=…

STRIPE_SECRET_KEY=…
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=…
RESEND_FROM="Sweet1ne Live <info@sweetlive.com>"
SUPER_ADMIN_EMAIL=…
SUPER_ADMIN_PASSWORD=…
SUPER_ADMIN_NAME=Super Admin

CURRENCY=gbp
CONVERT_FOREIGN_PAYMENTS=true
CHECKOUT_HOLD_MINUTES=30
```

Lock the file so only you can read it:
```bash
chmod 600 /var/www/sweet1live/.env.local
```

## F3. Python virtual environment + dependencies

```bash
cd /var/www/sweet1live/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Your prompt should start with `(.venv)`.

## F4. Database migrations

Still in `backend` with venv active:
```bash
alembic upgrade head
```
Success looks like lines of “Running upgrade … → …” and then the prompt returns with **no red traceback**.

If it errors about `DATABASE_URL`, your `.env.local` path/value is wrong — fix and retry.

## F5. Quick manual test (optional)

```bash
cd /var/www/sweet1live/backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
In a **second** SSH window:
```bash
curl http://127.0.0.1:8000/health
```
You want JSON mentioning health. Then in the first window press `Ctrl+C` to stop the test server.

---

# Part G — Keep the API running forever (systemd)

## G1. Create the service file

```bash
sudo nano /etc/systemd/system/sweet1live-api.service
```

Paste **exactly**:

```ini
[Unit]
Description=Sweet1ne Live API
After=network.target

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/sweet1live/backend
EnvironmentFile=/var/www/sweet1live/.env.local
ExecStart=/var/www/sweet1live/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

## G2. Start it

```bash
sudo systemctl daemon-reload
sudo systemctl enable sweet1live-api
sudo systemctl start sweet1live-api
sudo systemctl status sweet1live-api
```

Look for **active (running)** in green. Press `q` to quit the status view.

If it failed (`failed` in red):
```bash
sudo journalctl -u sweet1live-api -n 80 --no-pager
```
Read the error (often missing env var or wrong working directory), fix, then:
```bash
sudo systemctl restart sweet1live-api
```

Health check:
```bash
curl http://127.0.0.1:8000/health
```

---

# Part H — nginx reverse proxy (HTTP first)

## H1. Create site config

```bash
sudo nano /etc/nginx/sites-available/sweet1live-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.sweetlive.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25m;
    }
}
```

Enable it:
```bash
sudo ln -sf /etc/nginx/sites-available/sweet1live-api /etc/nginx/sites-enabled/sweet1live-api
sudo nginx -t
sudo systemctl reload nginx
```
`nginx -t` must say **syntax is ok** and **test is successful**.

---

# Part I — GoDaddy DNS for the API (`api.sweetlive.com`)

Do this **before** HTTPS (certbot needs the name to resolve).

1. Open https://dcc.godaddy.com/ and sign in  
2. Go to **My Products** → find **sweetlive.com** → click **DNS** (or **Manage DNS**)  
3. You will see a table of records  

**Add the API record**
1. Click **Add New Record**  
2. Type: **A**  
3. Name: `api`  
4. Value / Points to: your **Hetzner IPv4** (from checklist)  
5. TTL: `600` seconds (or 1 Hour)  
6. Save  

**Clean up conflicts**
- If there is already an `api` A/CNAME, delete or edit it so only one A points at Hetzner  
- Do **not** change `sweetlive.com` apex/`www` yet (that is Part L for Vercel)

**Wait until DNS works**

On Windows PowerShell:
```powershell
nslookup api.sweetlive.com
```
You want the Hetzner IP in the answer. If not, wait 5–15 minutes and try again.

---

# Part J — Free HTTPS certificate for the API (Let’s Encrypt)

Back on the VPS as `deploy`:
```bash
sudo certbot --nginx -d api.sweetlive.com
```

- Enter email when asked  
- Agree to terms (Y)  
- Choose whether to share email (Y/N)  
- Certbot will edit nginx for you  

Test in your **browser** (on Windows):  
https://api.sweetlive.com/health  

You should see JSON and a padlock. Also open:  
https://api.sweetlive.com/docs  

If certbot fails with “failed to authenticate”:
- DNS not pointing yet → wait / fix GoDaddy A record  
- Port 80 blocked → re-check `ufw status`

---

# Part K — Deploy the frontend on Vercel

## K1. Import the project
1. Open https://vercel.com → log in with GitHub  
2. **Add New…** → **Project**  
3. Find **vouh/sweet1live** → **Import**  
4. Configure:
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: leave **empty / `.`** (not `backend`)
   - Build Command: leave default (`npm run build` / from `vercel.json`)
5. **Do not deploy yet** — click **Environment Variables** first (or deploy then immediately add vars and redeploy)

## K2. Environment variables on Vercel

Project → **Settings** → **Environment Variables** → add each (Environment: **Production**, and Preview if you want):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.sweetlive.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | (same as local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (same as local) |
| `NEXT_PUBLIC_SEVENROOMS_VENUE_ID` | (same as local) |
| `SITE_URL` | `https://sweetlive.com` |
| Optional analytics / Turnstile public keys | same as local if used |

**Never add to Vercel:** `DATABASE_URL`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `STAFF_API_KEY`.

## K3. Deploy
1. **Deployments** → … on latest → **Redeploy** (if you added vars after first deploy)  
   or click **Deploy** from the import screen  
2. Wait until status is **Ready**  
3. Open the `*.vercel.app` URL Vercel gives you  
4. Site should load. Open browser DevTools → Network: API calls should go to `api.sweetlive.com`

If the site loads but data fails: usually wrong `NEXT_PUBLIC_API_URL` or CORS — fix and **redeploy** after changing `NEXT_PUBLIC_*` vars.

---

# Part L — Point `sweetlive.com` at Vercel (GoDaddy)

## L1. Add domains in Vercel
1. Vercel project → **Settings** → **Domains**  
2. Add `sweetlive.com`  
3. Add `www.sweetlive.com`  
4. Vercel shows the **exact** DNS records it wants — **use those**, not a random IP from a blog  

Typical pattern (confirm in Vercel UI):
- Apex `@` → **A** record to Vercel’s IP (often `76.76.21.21`, but trust Vercel’s screen)  
- `www` → **CNAME** to `cname.vercel-dns.com` (or whatever Vercel shows)

## L2. Edit GoDaddy DNS
1. GoDaddy → sweetlive.com → **DNS**  
2. **Turn off Domain Forwarding** if it is enabled (Forwarding sends visitors elsewhere and breaks Vercel)  
3. For the apex (`@` / sweetlive.com):
   - Edit existing **A** record(s) to Vercel’s IP, **or** delete old A/AAAA and add the one Vercel asks for  
4. For `www`:
   - Set **CNAME** name `www` → value from Vercel  
5. Leave the **`api` A record** pointing at Hetzner untouched  

## L3. Wait and verify
- In Vercel Domains, wait until both show **Valid**  
- Visit https://sweetlive.com  
- Visit https://www.sweetlive.com  

On Windows:
```powershell
nslookup sweetlive.com
nslookup www.sweetlive.com
nslookup api.sweetlive.com
```

## L4. Confirm API CORS matches the live site
On the VPS, your `.env.local` must already include:
```env
CORS_ORIGINS=["https://sweetlive.com","https://www.sweetlive.com"]
PUBLIC_SITE_URL=https://sweetlive.com
```
Then:
```bash
sudo systemctl restart sweet1live-api
```

---

# Part M — Stripe production webhook

1. Open https://dashboard.stripe.com → **Developers** → **Webhooks**  
2. **Add endpoint**  
3. Endpoint URL: `https://api.sweetlive.com/stripe/webhook`  
4. Select events (minimum):
   - `checkout.session.completed`
   - `checkout.session.expired`  
   (add any others your app already uses if listed in your backend docs)  
5. Create → open the endpoint → **Signing secret** → Reveal → copy `whsec_…`  

On the VPS:
```bash
nano /var/www/sweet1live/.env.local
```
Set:
```env
STRIPE_WEBHOOK_SECRET=whsec_…
```
Save, then:
```bash
sudo systemctl restart sweet1live-api
```

In Stripe, send a **test event** if available; delivery should be **2xx**.

---

# Part N — GitHub Actions (auto-deploy) — beginner deep dive

GitHub Actions is a robot inside GitHub. When you push code, it can:
1. **Check** the project still builds / tests pass (CI)
2. **Deploy** the API to your Hetzner VPS for you (CD)

You do **not** need Actions for the frontend: **Vercel already deploys** when you push to the connected branch. Actions here are mainly for the **Hetzner API**.

```mermaid
flowchart LR
  Push["git push to main"] --> GH["GitHub"]
  GH --> Vercel["Vercel rebuilds frontend"]
  GH --> Actions["GitHub Actions"]
  Actions -->|"SSH as deploy"| Hetzner["Hetzner git pull + restart API"]
```

**Do this only after** Parts F–J work (API already running on the VPS by hand). Actions only automate what you already did manually.

---

## N1. What workflow files live in the repo

Create these under `.github/workflows/` when you reach the GitHub Actions session:

```text
.github/workflows/ci.yml              # on pull requests / pushes — lint frontend, light backend check
.github/workflows/deploy-api.yml      # on push to main — deploy backend to Hetzner
```

---

## N2. Create a special SSH key only for GitHub → Hetzner

Do **not** reuse your personal laptop SSH key in GitHub Secrets if you can avoid it. Make a **deploy key** that only exists for Actions.

### On your Windows PowerShell (on your PC)

```powershell
ssh-keygen -t ed25519 -C "github-actions-sweet1live" -f "$env:USERPROFILE\.ssh\sweet1live_gha" -N ""
```

This creates two files:
- **Private** (secret): `C:\Users\YOU\.ssh\sweet1live_gha` — goes into GitHub Secrets  
- **Public** (safe): `C:\Users\YOU\.ssh\sweet1live_gha.pub` — goes onto the VPS  

Show the **public** key:
```powershell
Get-Content $env:USERPROFILE\.ssh\sweet1live_gha.pub
```
Copy the whole line.

### On the VPS (SSH as `deploy`)

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

- Go to the **end** of the file  
- Paste the **public** key on its **own new line**  
- Save: `Ctrl+O`, Enter, `Ctrl+X`

```bash
chmod 600 ~/.ssh/authorized_keys
```

### Allow password-less restart of the API (needed for Actions)

The deploy user must restart systemd without typing a password. On the VPS:

```bash
sudo nano /etc/sudoers.d/sweet1live-deploy
```

Paste **exactly** this one line (user must be `deploy`):

```text
deploy ALL=(root) NOPASSWD: /bin/systemctl restart sweet1live-api, /bin/systemctl status sweet1live-api, /bin/systemctl is-active sweet1live-api
```

Save, then:
```bash
sudo chmod 440 /etc/sudoers.d/sweet1live-deploy
sudo visudo -cf /etc/sudoers.d/sweet1live-deploy
```
Must say: `parsed OK`.

Test from the VPS (should not ask for a password):
```bash
sudo systemctl restart sweet1live-api
```

---

## N3. Add secrets in GitHub (click-by-click)

1. Open https://github.com/vouh/sweet1live  
2. Click **Settings** (top repo menu — not your profile settings)  
3. Left sidebar → **Secrets and variables** → **Actions**  
4. Click **New repository secret** for each of these:

### Secret 1 — `HETZNER_HOST`
- Name: `HETZNER_HOST`  
- Value: your Hetzner IPv4 **or** `api.sweetlive.com` (after DNS works)  
- Add secret  

### Secret 2 — `HETZNER_USER`
- Name: `HETZNER_USER`  
- Value: `deploy`  
- Add secret  

### Secret 3 — `HETZNER_SSH_KEY`
- Name: `HETZNER_SSH_KEY`  
- Value: open the **private** key on Windows and paste the **entire** contents:

```powershell
Get-Content $env:USERPROFILE\.ssh\sweet1live_gha -Raw
```

Must include the lines:
```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

- Add secret  

### Secret 4 — `HETZNER_SSH_PORT` (optional)
- Only if you changed SSH off port 22. Default is 22 — you can skip this secret if you stay on 22.

**Never** put `.env.local`, Stripe secrets, or database passwords into GitHub Actions secrets for this simple deploy — those stay **only on the VPS** in `/var/www/sweet1live/.env.local`.

---

## N4. Make sure the VPS clone can `git pull` without you typing a password

GitHub Actions will run `git pull` on the server. The server must be allowed to read the repo.

### If the repo is **public**
`git pull` over HTTPS usually works with no extra setup.

### If the repo is **private** (recommended fix: deploy key on the repo)

**Option A — HTTPS with a fine-grained or classic PAT (simpler mentally, less ideal long-term)**  
On the VPS, once:
```bash
cd /var/www/sweet1live
git remote -v
```
If remote is `https://github.com/vouh/sweet1live.git`, you can configure a credential helper / remote URL with a token. Prefer Option B.

**Option B — GitHub Deploy Key (recommended)**  
1. On the VPS, generate a **second** key used only for GitHub→repo read (different from the Actions→VPS key):

```bash
ssh-keygen -t ed25519 -C "hetzner-git-pull" -f ~/.ssh/github_sweet1live -N ""
cat ~/.ssh/github_sweet1live.pub
```

2. GitHub → repo → **Settings** → **Deploy keys** → **Add deploy key**  
   - Title: `hetzner-server-read`  
   - Key: paste the `.pub` contents  
   - Leave **Allow write access** **unchecked** (read-only is enough)  
   - Add key  

3. On the VPS, force git to use that key for GitHub:

```bash
nano ~/.ssh/config
```

Paste:
```text
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_sweet1live
  IdentitiesOnly yes
```

```bash
chmod 600 ~/.ssh/config
cd /var/www/sweet1live
git remote set-url origin git@github.com:vouh/sweet1live.git
ssh -T git@github.com
```

You want a message like: `Hi vouh/sweet1live! You've successfully authenticated...`  
Then:
```bash
git pull
```
Must succeed without asking for a password.

---

## N5. Workflow files (what they will contain)

These will be added under `.github/workflows/` when we execute. Exact contents:

### A) `ci.yml` — safety checks on every push / PR

What it does (simple):
- Checks out the code  
- Sets up Node 20 → `npm ci` → `npm run lint` (and optionally `npm run build` if you want a stronger gate)  
- Sets up Python → install `backend/requirements.txt` → `python -c "import app"` smoke import **or** `pytest` if tests are reliable in CI  

Beginner meaning: if lint fails, you see a red X on GitHub before you trust the deploy.

### B) `deploy-api.yml` — deploy backend when `main` changes

Triggers:
- Push to `main`  
- Only when files under `backend/**` change **or** the workflow file itself changes (saves unnecessary deploys)  
- Also allow **manual** run from the Actions tab (“workflow_dispatch”)

Steps the robot runs:
1. Start an Ubuntu runner at GitHub  
2. Load your SSH private key from `HETZNER_SSH_KEY`  
3. SSH into `deploy@HETZNER_HOST`  
4. Run remotely:

```bash
cd /var/www/sweet1live
git fetch origin
git reset --hard origin/main
cd backend
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart sweet1live-api
sudo systemctl is-active sweet1live-api
curl -fsS http://127.0.0.1:8000/health
```

5. If any command fails, the Actions run shows **red** and the old API may still be running (systemd restart only happens if earlier steps succeed — the script is ordered that way on purpose).

**Note:** `git reset --hard origin/main` makes the server match GitHub exactly. Do not edit code by hand on the server after this is live (always edit locally → push).

---

## N6. How to add and push the workflow files

1. In Cursor / locally create `.github/workflows/ci.yml` and `deploy-api.yml`  
2. Commit and push to `main`:

```powershell
cd c:\PROJECTS\SWEET1LIVE
git add .github/workflows/ci.yml .github/workflows/deploy-api.yml
git commit -m "Add GitHub Actions CI and Hetzner API deploy"
git push origin main
```

3. Open https://github.com/vouh/sweet1live/actions  
4. You should see workflow runs appear within ~30 seconds  
5. Click the **Deploy API** run → watch each step turn green  

---

## N7. How to read success vs failure

**Green check on commit** = Actions succeeded  
**Red X** = click the failed job → expand the red step → read the log  

Common first-time failures:

| Log message | Meaning | Fix |
|-------------|---------|-----|
| Permission denied (publickey) | GitHub cannot SSH to VPS | Public key missing in `~/.ssh/authorized_keys`; or wrong private key secret |
| Host key verification failed | SSH unknown host | Workflow should use `ssh-keyscan` for the host (we include this in the deploy workflow) |
| sudo: a password is required | Missing sudoers rule | Re-do Part N2 sudoers file |
| git pull authentication failed | Private repo, no deploy key | Re-do Part N4 Option B |
| alembic / DATABASE_URL error | Env file missing on server | Fix `/var/www/sweet1live/.env.local` on VPS |
| unit not active | API crashed after restart | `sudo journalctl -u sweet1live-api -n 80` on VPS |

---

## N8. Manual deploy button (useful)

1. GitHub → **Actions**  
2. Left: **Deploy API** (name of workflow)  
3. **Run workflow** → branch `main` → **Run workflow**  

Use this if you need to redeploy without a new commit.

---

## N9. Day-to-day after Actions work

Your new normal:

```powershell
# on your Windows PC, inside the project
git add .
git commit -m "Describe your change"
git push origin main
```

Then:
- Watch https://github.com/vouh/sweet1live/actions for API deploy  
- Watch Vercel dashboard for frontend deploy  
- Soft-check https://api.sweetlive.com/health and https://sweetlive.com  

You should almost never SSH just to `git pull` anymore.

---

## N10. How this relates to “update the site later”

| Task | How |
|------|-----|
| Update website | `git push` → Vercel auto |
| Update API | `git push` → GitHub Actions → Hetzner auto |
| Change secrets (Stripe, DB) | Still SSH / edit `/var/www/sweet1live/.env.local` on VPS, then `sudo systemctl restart sweet1live-api` (or Run workflow) |
| Change Vercel env | Vercel UI → Redeploy |

Emergency manual API update (if Actions is broken) — SSH and run the same commands as in N5.

---

# Part O — Full smoke test checklist

Do these in order after DNS is Valid:

1. [ ] https://api.sweetlive.com/health opens and looks healthy  
2. [ ] https://api.sweetlive.com/docs opens  
3. [ ] https://sweetlive.com homepage loads  
4. [ ] https://www.sweetlive.com loads  
5. [ ] Menus page shows dishes (API working)  
6. [ ] Events page loads  
7. [ ] Contact form submits successfully  
8. [ ] Venue hire enquiry submits  
9. [ ] `/admin` or staff login works with your super admin  
10. [ ] (Optional) small test checkout with `sk_test_` first  
11. [ ] Stripe webhook deliveries show success  

---

# Part P — Common problems and fixes

| What you see | Likely cause | What to do |
|--------------|--------------|------------|
| `ssh` times out | Wrong IP / firewall | Check Hetzner IP; `ufw allow OpenSSH` |
| `systemctl status` red | API crash on start | `sudo journalctl -u sweet1live-api -n 80 --no-pager` |
| Site loads, no data | Wrong API URL or CORS | Check Vercel `NEXT_PUBLIC_API_URL`; check `CORS_ORIGINS`; redeploy + restart API |
| Browser blocks mixed content | API still `http://` | Must use `https://api.sweetlive.com` |
| Vercel domain “Invalid” | GoDaddy forwarding or old A record | Disable forwarding; fix A/CNAME to match Vercel exactly |
| certbot fails | `api` DNS not ready | `nslookup api.sweetlive.com` until it shows Hetzner IP |
| Stripe webhook 400 | Wrong `whsec` | Re-copy signing secret; restart API |
| Git clone denied | Private repo | Use GitHub personal access token or deploy key (Part N4) |
| Changes on Vercel not visible | Cached old deploy / forgot redeploy | Redeploy; hard refresh browser |
| Actions red: Permission denied | SSH key / authorized_keys mismatch | Re-check Part N2 + `HETZNER_SSH_KEY` secret |
| Actions red: sudo password | Missing sudoers.d rule | Re-do Part N2 sudoers |
| Actions green but site old | Looking at wrong URL / CDN cache | Hard refresh; confirm you pushed to `main` |

---

# Part Q — Security reminders (read once)

- Never commit `.env.local` to GitHub  
- Prefer logging in as `deploy`, not `root`, day to day  
- Keep Hetzner and Ubuntu updated occasionally: `sudo apt update && sudo apt upgrade -y`  
- Use Stripe **test** keys until you are ready for real money  
- Restrict who knows `SUPER_ADMIN_PASSWORD` and `STAFF_API_KEY`  

---

# Suggested session plan (so it is not overwhelming)

**Session 1 (45–90 min):** Parts B–G (server + API running on localhost inside VPS)  
**Session 2 (30–45 min):** Parts H–J (DNS api + HTTPS)  
**Session 3 (30–45 min):** Parts K–L (Vercel + sweetlive.com DNS)  
**Session 4 (20–30 min):** Part M (Stripe webhook)  
**Session 5 (45–60 min):** Part N (GitHub Actions deploy key, secrets, workflows, first green run)  
**Session 6 (20–30 min):** Part O smoke tests  

Work through this guide section by section. You can pair with Cursor in chat for debugging. In Session 5, have Cursor create the GitHub Actions workflow files in the repo.