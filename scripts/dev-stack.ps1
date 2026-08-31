# One command: restart API, Stripe webhooks, re-seed, and Next.js dev server.
# Usage: npm run dev:stack

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$VenvPython = Join-Path $Backend "venv\Scripts\python.exe"
$LocalStripe = Join-Path $Root "tools\stripe\stripe.exe"
$EnvLocal = Join-Path $Root ".env.local"

function Get-StripeExe {
    if (Test-Path $LocalStripe) { return $LocalStripe }
    $cmd = Get-Command stripe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    Write-Host "Stripe CLI not found - installing to tools/stripe ..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "install-stripe-cli.ps1")
    if (Test-Path $LocalStripe) { return $LocalStripe }
    throw "Stripe CLI install failed. Run: .\scripts\install-stripe-cli.ps1"
}

function Stop-PortListener([int]$Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object {
            Write-Host "Stopping process on port $Port (PID $($_.OwningProcess))" -ForegroundColor DarkGray
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
}

function Read-DotEnvValue([string]$Path, [string]$Key) {
    if (-not (Test-Path $Path)) { return $null }
    $pattern = '^\s*' + [regex]::Escape($Key) + '=(.+)$'
    foreach ($line in Get-Content $Path) {
        if ($line -match $pattern) {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

Write-Host ""
Write-Host "Sweet1ne dev stack" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Stop orphaned API workers and anything on :8000
& (Join-Path $Backend "stop.ps1")
Stop-PortListener 8000

$stripeKey = Read-DotEnvValue $EnvLocal "STRIPE_SECRET_KEY"
if ($stripeKey -like "sk_live_*") {
    Write-Host "Warning: STRIPE_SECRET_KEY is a LIVE key - use sk_test_... for local checkout." -ForegroundColor Yellow
}
if (-not $stripeKey) {
    Write-Host "Missing STRIPE_SECRET_KEY in .env.local - card checkout will fail." -ForegroundColor Yellow
}

# Migrate + seed on first run (set BACKEND_SEED=1 to force re-seed demo data)
& (Join-Path $PSScriptRoot "backend-setup.ps1")

$StripeExe = Get-StripeExe

$stripeProc = $null
$apiProc = $null

Write-Host ""
Write-Host "Starting Stripe webhook listener..." -ForegroundColor Green
$stripeLog = Join-Path $env:TEMP "sweet1ne-stripe-listen.log"
$stripeErr = Join-Path $env:TEMP "sweet1ne-stripe-listen.err"
Remove-Item $stripeLog, $stripeErr -Force -ErrorAction SilentlyContinue

$stripeProc = Start-Process -FilePath $StripeExe `
    -ArgumentList @("listen", "--forward-to", "localhost:8000/stripe/webhook") `
    -RedirectStandardOutput $stripeLog `
    -RedirectStandardError $stripeErr `
    -PassThru `
    -WindowStyle Hidden

$whsec = $null
$deadline = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $deadline -and -not $whsec) {
    Start-Sleep -Milliseconds 500
    foreach ($file in @($stripeLog, $stripeErr)) {
        if (-not (Test-Path $file)) { continue }
        $text = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($text -and $text -match '(whsec_[a-zA-Z0-9]+)') {
            $whsec = $Matches[1]
            break
        }
    }
    if ($stripeProc.HasExited) { break }
}

if (-not $whsec) {
    if (Test-Path $stripeErr) {
        Write-Host (Get-Content $stripeErr -Raw -ErrorAction SilentlyContinue) -ForegroundColor Yellow
    }
    if (Test-Path $stripeLog) {
        Write-Host (Get-Content $stripeLog -Raw -ErrorAction SilentlyContinue) -ForegroundColor Yellow
    }
    $whsec = Read-DotEnvValue $EnvLocal "STRIPE_WEBHOOK_SECRET"
    if ($whsec) {
        Write-Host "Using STRIPE_WEBHOOK_SECRET from .env.local (Stripe CLI did not start)." -ForegroundColor Yellow
        Write-Host "If checkout completes but tickets stay unpaid, run once: stripe login" -ForegroundColor Yellow
        Stop-Process -Id $stripeProc.Id -Force -ErrorAction SilentlyContinue
        $stripeProc = $null
    } else {
        Stop-Process -Id $stripeProc.Id -Force -ErrorAction SilentlyContinue
        throw 'Stripe listen failed. Run stripe login, then npm run dev:stack again.'
    }
} else {
    Write-Host "Stripe webhooks -> http://localhost:8000/stripe/webhook" -ForegroundColor Green
    Write-Host "Webhook secret synced for this session." -ForegroundColor DarkGray
}

$env:STRIPE_WEBHOOK_SECRET = $whsec

Write-Host ""
Write-Host "Starting API on http://localhost:8000 ..." -ForegroundColor Green
$apiProc = Start-Process -FilePath $VenvPython `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $Backend `
    -PassThru `
    -WindowStyle Hidden

Start-Sleep -Seconds 2
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 10
    if ($health.StatusCode -eq 200) {
        Write-Host "API is up." -ForegroundColor Green
    }
} catch {
    Write-Host "API still starting - give it a few seconds." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Next.js on http://localhost:3000 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop everything." -ForegroundColor DarkGray
Write-Host ""

Stop-PortListener 3000

Push-Location $Root
try {
    npm run dev
} finally {
    Pop-Location
    Write-Host ""
    Write-Host "Stopping background services..." -ForegroundColor DarkGray
    if ($apiProc -and -not $apiProc.HasExited) {
        Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($stripeProc -and -not $stripeProc.HasExited) {
        Stop-Process -Id $stripeProc.Id -Force -ErrorAction SilentlyContinue
    }
    & (Join-Path $Backend "stop.ps1")
}
