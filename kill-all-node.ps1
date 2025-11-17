# Nuclear option: Kill ALL Node.js processes
Write-Host "⚠️  NUCLEAR OPTION: Killing ALL Node.js processes..." -ForegroundColor Red
Write-Host ""

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses.Count -eq 0) {
    Write-Host "No Node.js processes found." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
$nodeProcesses | ForEach-Object {
    Write-Host "  Killing PID: $($_.Id)" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ All Node.js processes killed!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now start fresh with: .\start-dev.ps1" -ForegroundColor Cyan

