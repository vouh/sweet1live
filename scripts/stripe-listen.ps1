# Stripe webhook listener for local dev
# Usage: .\scripts\stripe-listen.ps1

$Root = Split-Path -Parent $PSScriptRoot
$LocalStripe = Join-Path $Root "tools\stripe\stripe.exe"

if (Test-Path $LocalStripe) {
    $StripeExe = $LocalStripe
} else {
    $cmd = Get-Command stripe -ErrorAction SilentlyContinue
    if ($cmd) {
        $StripeExe = $cmd.Source
    } else {
        Write-Host "Stripe CLI not found." -ForegroundColor Red
        Write-Host "Run from repo root once (downloads to tools/stripe):"
        Write-Host "  .\scripts\install-stripe-cli.ps1"
        exit 1
    }
}

Write-Host "Using: $StripeExe" -ForegroundColor DarkGray
Write-Host "Forwarding webhooks to http://localhost:8000/stripe/webhook" -ForegroundColor Green
Write-Host "Copy whsec_... into .env.local as STRIPE_WEBHOOK_SECRET, then restart backend." -ForegroundColor DarkGray
Write-Host "First time? Run: & '$StripeExe' login" -ForegroundColor Yellow
& $StripeExe listen --forward-to localhost:8000/stripe/webhook
