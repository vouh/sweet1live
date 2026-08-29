# Backend dev server (Windows). Usage: npm run backend

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$VenvDir = Join-Path $Backend ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$VenvPip = Join-Path $VenvDir "Scripts\pip.exe"
$Requirements = Join-Path $Backend "requirements.txt"
$DepsStamp = Join-Path $VenvDir ".deps-synced"
$SeedStamp = Join-Path $VenvDir ".seeded"
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

$needsPip = -not (Test-Path $DepsStamp)
if (-not $needsPip -and (Test-Path $Requirements)) {
    $needsPip = (Get-Item $Requirements).LastWriteTimeUtc -gt (Get-Item $DepsStamp).LastWriteTimeUtc
}

if ($needsPip) {
    Write-Host "Installing Python dependencies..."
    & $VenvPip install -q -r $Requirements
    New-Item -ItemType File -Path $DepsStamp -Force | Out-Null
}

Push-Location $Backend

Write-Host "Applying database migrations..."
& $VenvPython -m alembic upgrade head

if (-not (Test-Path $SeedStamp) -or $env:BACKEND_SEED -eq "1") {
    Write-Host "Seeding rooms and events (first run)..."
    & $VenvPython -m app.seed
    New-Item -ItemType File -Path $SeedStamp -Force | Out-Null
}

Write-Host ""
Write-Host "API:  http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

& $VenvPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Pop-Location
