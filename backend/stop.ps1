# Stop orphaned Sweet1ne API workers on port 8000 (Windows)
$Backend = Split-Path -Parent $MyInvocation.MyCommand.Path
$pattern = [regex]::Escape($Backend)

$stopped = 0
Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and ($_.CommandLine -match $pattern -or $_.CommandLine -match "uvicorn app\.main:app") } |
    ForEach-Object {
        Write-Host "Stopping PID $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        $stopped++
    }

if ($stopped -eq 0) {
    Write-Host "No Sweet1ne API python processes found."
} else {
    Write-Host "Stopped $stopped process(es)."
}
