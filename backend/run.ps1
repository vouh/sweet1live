# Start FastAPI dev server (Windows)
# Usage: .\backend\run.ps1   or   cd backend; .\run.ps1

Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
$Backend = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Backend

$Python = Join-Path $Backend "venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    Write-Host "Missing venv. First time setup:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv"
    Write-Host "  venv\Scripts\pip install -r requirements.txt"
    Write-Host "  venv\Scripts\python -m alembic upgrade head"
    Write-Host "  venv\Scripts\python -m app.seed"
    exit 1
}

Write-Host "API:  http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Green
& $Python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
