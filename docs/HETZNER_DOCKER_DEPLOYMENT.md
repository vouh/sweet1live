# Sweet1ne Live — Hetzner Docker deployment

This deployment runs only the Sweet1ne frontend and API. It does not bind the
server's public ports and does not operate on another Compose project.

## Architecture

- GitHub Actions builds multi-architecture images and pushes them to GHCR:

  | Role | Image name | Container name |
  |------|------------|----------------|
  | Frontend (Next.js) | `ghcr.io/<github-owner>/sweet1ne-live-web` | `sweet1live-web` |
  | Backend (FastAPI) | `ghcr.io/<github-owner>/sweet1ne-live-api` | `sweet1live-api` |

- `compose.prod.yml` runs the stack under the fixed project name `sweet1live`.
- Next.js listens only on `127.0.0.1:3100`.
- FastAPI listens only on `127.0.0.1:8100`.
- The host's existing Nginx routes the Sweet1ne domain to those ports.
- PostgreSQL and uploaded images remain in Supabase, so there is no database
  volume on this VPS.

## Important isolation limitation

Compose project names, directories, ports and networks protect against normal
deployment mistakes. They are not a security boundary. A user who can access
the host Docker socket (usually through the `docker` group) can control every
container on that Docker daemon. If the two projects must be unable to affect
each other, use a separate VPS. That is the strongest and recommended option.

## Information required from the other developer

Before doing anything, obtain:

1. The VPS IP, Ubuntu version and CPU architecture.
2. The current reverse proxy: Nginx, Caddy, Traefik or a control panel.
3. Confirmation that host ports `3100` and `8100` are free.
4. A dedicated SSH user and `/srv/sweet1live` owned by that user.
5. Confirmation that a current Hetzner snapshot exists.
6. The SSH host-key fingerprint, verified through a separate trusted channel.

Do not install a second reverse proxy if the server already has one. Adapt the
two upstream routes from `deploy/nginx/sweet1live.conf` to the existing proxy.

## One-time VPS preparation

The server owner should run these commands. Replace the username if needed:

```bash
sudo adduser --disabled-password --gecos "" sweet1live-deploy
sudo install -d -o sweet1live-deploy -g sweet1live-deploy /srv/sweet1live
sudo usermod -aG docker sweet1live-deploy
```

Log out and back in after changing Docker group membership. Docker Engine and
the Compose plugin should be installed from Docker's official Ubuntu repository.

Copy `deploy/production.env.example` to `/srv/sweet1live/production.env`, fill
in the real production secrets on the VPS, then protect it:

```bash
sudo chown sweet1live-deploy:sweet1live-deploy /srv/sweet1live/production.env
sudo chmod 600 /srv/sweet1live/production.env
```

The production env file must never be committed or uploaded by Actions.

### GHCR access

If the GitHub packages are private, create a classic GitHub PAT with only
`read:packages`, then log in once on the VPS:

```bash
echo "YOUR_READ_PACKAGES_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Prefer making the two container packages public if the repository permits it;
the images contain application code and public build variables, not runtime
secrets.

## GitHub configuration

Create a protected GitHub Environment named `production` and add these secrets:

- `HETZNER_HOST`: VPS IP or SSH hostname
- `HETZNER_USER`: `sweet1live-deploy`
- `HETZNER_SSH_PORT`: normally `22`
- `HETZNER_SSH_KEY`: the dedicated private deployment key
- `HETZNER_KNOWN_HOSTS`: a verified `known_hosts` entry for the VPS

Add these repository or environment variables because they are compiled into
browser JavaScript and are not secret:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

GTM, Meta Pixel and the public API path are already defined in the workflow.

The workflow deploys on pushes to `main`. Use required pull-request reviews and
the `production` environment approval rule if production must not deploy on
every merge.

## Reverse proxy and TLS

The supplied Nginx file is a template. The server owner must merge it into the
existing proxy instead of replacing the global configuration:

```bash
sudo cp deploy/nginx/sweet1live.conf /etc/nginx/sites-available/sweet1live
sudo ln -s /etc/nginx/sites-available/sweet1live /etc/nginx/sites-enabled/sweet1live
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d sweet1nelive.com -d www.sweet1nelive.com
```

Do not run the copy command from this repository unless it is actually cloned
on the VPS. The other developer can instead paste only this site's server block
into the appropriate host configuration.

## DNS cutover

The domain currently points to Vercel. Do not change it until both containers
are healthy and Nginx has been tested. At cutover, replace the Vercel web A/CNAME
records with records that point to the Hetzner public IP. Preserve all MX, TXT,
DKIM and Microsoft 365 records.

## Verification

On the VPS:

```bash
cd /srv/sweet1live
docker compose -p sweet1live -f compose.prod.yml ps
curl -fsS http://127.0.0.1:8100/health
curl -I http://127.0.0.1:3100/
```

Then check the public site, sign-in, admin pages, image uploads, checkout and the
Stripe webhook endpoint.

## Rollback

Every deployment is tagged with its Git commit SHA. To roll back, find the last
working SHA in GitHub Actions and run:

```bash
cd /srv/sweet1live
export IMAGE_PREFIX=ghcr.io/OWNER/sweet1ne-live
export IMAGE_TAG=LAST_WORKING_GIT_SHA
docker compose -p sweet1live -f compose.prod.yml pull
docker compose -p sweet1live -f compose.prod.yml up -d --wait --wait-timeout 180
```

Example images after deploy:

```text
ghcr.io/OWNER/sweet1ne-live-web:latest
ghcr.io/OWNER/sweet1ne-live-api:latest
```

Database migrations need separate review before rolling back across a schema
change. Take a database backup before destructive migrations.
