# Start FastAPI dev server (Windows)
# Usage: .\backend\run.ps1   or   cd backend; .\run.ps1

Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
$Backend = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Backend

$Python = $null
foreach ($venvDir in @("venv", ".venv")) {
    $candidate = Join-Path $Backend "$venvDir\Scripts\python.exe"
    if (Test-Path $candidate) {
        $Python = $candidate
        break
    }
}

if (-not $Python) {
    Write-Host "Missing venv. First time setup:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv"
    Write-Host "  venv\Scripts\pip install -r requirements.txt"
    Write-Host "  venv\Scripts\python -m alembic upgrade head"
    Write-Host "  venv\Scripts\python -m app.seed"
    exit 1
}

$portInUse = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Port 8000 is already in use. Stop other API servers first:" -ForegroundColor Yellow
    Write-Host "  Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Select ProcessId, CommandLine"
    Write-Host "  Stop-Process -Id <pid> -Force"
    Write-Host ""
    Write-Host "Or run: .\stop.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "API:  http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Green
& $Python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
