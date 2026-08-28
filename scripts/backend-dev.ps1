# One-command backend dev server (Windows).
# Usage: npm run backend

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$VenvDir = Join-Path $Backend ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$VenvPip = Join-Path $VenvDir "Scripts\pip.exe"
$EnvLocal = Join-Path $Root ".env.local"
$EnvExample = Join-Path $Root ".env.example"

if (-not (Test-Path $EnvLocal)) {
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvLocal
        Write-Host "Created .env.local - add DATABASE_URL and other secrets, then run again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Missing .env.local at repo root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating Python virtualenv..."
    Push-Location $Backend
    python -m venv .venv
    Pop-Location
}

Write-Host "Installing Python dependencies..."
& $VenvPip install -q -r (Join-Path $Backend "requirements.txt")

Push-Location $Backend

Write-Host "Applying database migrations..."
& $VenvPython -m alembic upgrade head

Write-Host "Seeding rooms and events (idempotent)..."
& $VenvPython -m app.seed

Write-Host ""
Write-Host "API:  http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

& $VenvPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Pop-Location
