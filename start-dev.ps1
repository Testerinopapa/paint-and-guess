# PowerShell script to start frontend, backend, and DiceBear API servers
Write-Host "Starting Paint & Guess development servers..." -ForegroundColor Green
Write-Host ""

# Start DiceBear API server in a new window
Write-Host "Starting DiceBear API server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm run dev"

# Wait a moment for API server to start
Start-Sleep -Seconds 2

# Start backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend server in a new window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait for servers to be ready
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Open Chromium browser
Write-Host "Checking for Chromium browser..." -ForegroundColor Cyan
$frontendUrl = "http://localhost:8080"

# Check for Chromium only (no Chrome fallback)
$chromiumPaths = @(
    "${env:ProgramFiles}\Chromium\Application\chromium.exe",
    "${env:ProgramFiles(x86)}\Chromium\Application\chromium.exe",
    "${env:LOCALAPPDATA}\Chromium\Application\chromium.exe"
)

$chromiumFound = $false
foreach ($path in $chromiumPaths) {
    if (Test-Path $path) {
        Write-Host "Found Chromium at: $path" -ForegroundColor Green
        Write-Host "Opening Chromium browser..." -ForegroundColor Cyan
        Start-Process $path -ArgumentList $frontendUrl
        $chromiumFound = $true
        break
    }
}

if (-not $chromiumFound) {
    Write-Host "Chromium not found. Please install Chromium to auto-open the browser." -ForegroundColor Yellow
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

