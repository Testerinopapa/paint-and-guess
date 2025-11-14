# PowerShell script to gracefully stop all development servers
Write-Host "Stopping Paint & Guess development servers..." -ForegroundColor Yellow
Write-Host ""

$pidFile = ".dev-servers.pid"
$ports = @(3000, 3001, 8080)  # API, Backend, Frontend

function Stop-ProcessSafe($pid, $label) {
    if (-not $pid) { return }
    try {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping $label (PID: $pid)..." -ForegroundColor Cyan
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            return $true
        }
    } catch {
        Write-Host "  Unable to stop PID $pid ($label)" -ForegroundColor Gray
    }
    return $false
}

function Stop-PortProcess($port) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if (-not $connections) {
            Write-Host "  Port $port is free" -ForegroundColor Gray
            return $false
        }

        $stoppedAny = $false
        foreach ($conn in @($connections)) {
            $pid = $conn.OwningProcess
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process -and ($process.ProcessName -eq "node" -or $process.ProcessName -eq "node.exe")) {
                Write-Host "  Port $port used by Node.js (PID: $pid) - stopping..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                $stoppedAny = $true
            }
        }

        if (-not $stoppedAny) {
            Write-Host "  Port $port not used by project servers" -ForegroundColor Gray
        }

        return $stoppedAny
    } catch {
        Write-Host "  Unable to inspect port $port" -ForegroundColor Gray
        return $false
    }
}

# Method 1: Try to stop by PID file
if (Test-Path $pidFile) {
    Write-Host "Reading process IDs from $pidFile..." -ForegroundColor Cyan
    try {
        $pids = Get-Content $pidFile | ConvertFrom-Json
        $labels = @{
            Api = "DiceBear API server"
            Backend = "Backend server"
            Frontend = "Frontend server"
        }

        foreach ($key in $labels.Keys) {
            Stop-ProcessSafe $pids.$key $labels[$key] | Out-Null
        }

        Remove-Item $pidFile -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Error reading PID file: $_" -ForegroundColor Red
    }
}

# Method 2: Stop processes by port (fallback)
Write-Host ""
Write-Host "Checking server ports (3000, 3001, 8080)..." -ForegroundColor Cyan
$portsStopped = $false
foreach ($port in $ports) {
    if (Stop-PortProcess $port) {
        $portsStopped = $true
    }
}

# Method 3: Confirm ports are free
Write-Host ""
Write-Host "Verifying ports are free..." -ForegroundColor Cyan
$allFree = $true
foreach ($port in $ports) {
    if (Stop-PortProcess $port) {
        $allFree = $false
    }
}
if ($allFree) {
    Write-Host "  ✓ All ports are free" -ForegroundColor Green
} else {
    Write-Host "  Some ports required stopping processes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All servers stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: If servers are still running, you may need to:" -ForegroundColor Yellow
Write-Host '  1. Close the PowerShell windows manually' -ForegroundColor Yellow
Write-Host '  2. Or run: Get-Process node | Stop-Process -Force' -ForegroundColor Yellow
