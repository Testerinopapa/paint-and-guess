# PowerShell script to start frontend, backend, and DiceBear API servers
Write-Host "Starting Paint & Guess development servers..." -ForegroundColor Green
Write-Host ""

# PID file to track processes
$pidFile = ".dev-servers.pid"

# Start DiceBear API server in a new window
Write-Host "Starting DiceBear API server..." -ForegroundColor Cyan
$apiProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm run dev" -PassThru
Write-Host "  API server PID: $($apiProcess.Id)" -ForegroundColor Gray

# Wait a moment for API server to start
Start-Sleep -Seconds 2

# Start backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -PassThru
Write-Host "  Backend server PID: $($backendProcess.Id)" -ForegroundColor Gray

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend server in a new window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -PassThru
Write-Host "  Frontend server PID: $($frontendProcess.Id)" -ForegroundColor Gray

# Save PIDs to file for shutdown script
$pids = @{
    Api = $apiProcess.Id
    Backend = $backendProcess.Id
    Frontend = $frontendProcess.Id
    Ports = @{
        Api = 3000
        Backend = 3001
        Frontend = 8080
    }
}
$pids | ConvertTo-Json | Out-File $pidFile
Write-Host "  Process IDs saved to $pidFile" -ForegroundColor Gray

# Wait for servers to be ready
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Open Chromium browser
Write-Host "Checking for Chromium browser..." -ForegroundColor Cyan
$frontendUrl = "http://localhost:8080"

# Check for Chromium (supports winget hibbiki.chromium installs)
$chromiumExecutables = @("chromium.exe", "chrome.exe")
$chromiumDirectories = @()

if ($env:ProgramFiles) {
    $chromiumDirectories += (Join-Path $env:ProgramFiles "Chromium\Application")
}

$programFilesX86 = ${env:ProgramFiles(x86)}
if ($programFilesX86) {
    $chromiumDirectories += (Join-Path $programFilesX86 "Chromium\Application")
}

if ($env:LOCALAPPDATA) {
    $chromiumDirectories += (Join-Path $env:LOCALAPPDATA "Chromium\Application")
    $chromiumDirectories += (Join-Path $env:LOCALAPPDATA "Programs\Chromium\Application")
}

$chromiumCandidates = @()

if ($env:PAINT_AND_GUESS_CHROMIUM) {
    $chromiumCandidates += $env:PAINT_AND_GUESS_CHROMIUM
}

foreach ($dir in $chromiumDirectories) {
    foreach ($exe in $chromiumExecutables) {
        $chromiumCandidates += (Join-Path $dir $exe)
    }
}

$chromiumPath = $null
foreach ($candidate in $chromiumCandidates | Where-Object { $_ }) {
    if (Test-Path $candidate) {
        $chromiumPath = $candidate
        break
    }
}

if ($chromiumPath) {
    Write-Host "Found Chromium at: $chromiumPath" -ForegroundColor Green
    Write-Host "Opening Chromium browser..." -ForegroundColor Cyan
    Start-Process $chromiumPath -ArgumentList $frontendUrl
} else {
    Write-Host "Chromium not found. Please install Chromium (or set PAINT_AND_GUESS_CHROMIUM) to auto-open the browser." -ForegroundColor Yellow
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All servers are starting in separate windows." -ForegroundColor Green
Write-Host "DiceBear API: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Browser should open automatically!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Frontend will use hosted DiceBear API by default." -ForegroundColor Cyan
Write-Host "Set VITE_DICEBEAR_API_URL=http://localhost:3000 in .env to use local API." -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all servers, run: .\stop-dev.ps1" -ForegroundColor Green
