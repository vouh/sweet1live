# Download Stripe CLI into tools/stripe (Windows)
$Root = Split-Path -Parent $PSScriptRoot
$Tools = Join-Path $Root "tools\stripe"
$Exe = Join-Path $Tools "stripe.exe"
$Version = "1.50.6"
$Url = "https://github.com/stripe/stripe-cli/releases/download/v$Version/stripe_${Version}_windows_x86_64.zip"

if (Test-Path $Exe) {
    Write-Host "Already installed: $Exe"
    & $Exe --version
    exit 0
}

New-Item -ItemType Directory -Force -Path $Tools | Out-Null
$Zip = Join-Path $env:TEMP "stripe_cli.zip"
Write-Host "Downloading Stripe CLI $Version..."
Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing
Expand-Archive -Path $Zip -DestinationPath $Tools -Force
Remove-Item $Zip -Force
& $Exe --version
Write-Host "Done. Run: .\scripts\stripe-listen.ps1"
