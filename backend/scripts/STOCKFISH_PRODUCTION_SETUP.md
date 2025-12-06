# Stockfish Production Setup Guide

This guide explains how to ensure the Stockfish binary is available in production.

## Overview

The Stockfish chess engine binary is required for chess analysis features. Since the binary is large (~76MB) and platform-specific, it's not committed to git. Instead, we download it during deployment.

## Automatic Download (Recommended)

### For Render.com / Linux Servers

The `render.yaml` configuration automatically downloads Stockfish during build:

```yaml
buildCommand: npm install && npm run prisma:generate && npm run prisma:migrate && (bash scripts/download-stockfish.sh x86-64-avx2 || echo "Stockfish download skipped")
```

The script `backend/scripts/download-stockfish.sh` will:
1. Download the appropriate Linux binary from GitHub releases
2. Place it in `stockfish/stockfish` at the project root
3. Make it executable

### Manual Download Scripts

**Option 1: Bash Script (Linux/macOS)**
```bash
cd backend
bash scripts/download-stockfish.sh x86-64-avx2
```

**Option 2: Node.js Script (Cross-platform)**
```bash
cd backend
npm run download:stockfish
# Or specify platform/arch:
node scripts/download-stockfish.js linux x86-64-avx2
```

## Architecture Selection

Choose the appropriate architecture for your server:

- **`x86-64-avx2`** (Recommended) - Works on most modern servers (Intel Haswell+, AMD Ryzen+)
- **`x86-64-bmi2`** - Better performance if your CPU supports it
- **`x86-64-avx512`** - Best performance for AMD Zen 4+ or Intel Skylake-X+
- **`x86-64-vnni256`** - Best for very recent CPUs with VNNI support
- **`x86-64-sse41-popcnt`** - Fallback for older CPUs (Intel 2008+, AMD 2011+)
- **`x86-64`** - Generic fallback (slowest)

### Detecting Your CPU Architecture

On Linux, check CPU features:
```bash
# Check for AVX2
grep avx2 /proc/cpuinfo

# Check for BMI2
grep bmi2 /proc/cpuinfo

# Check for AVX512
grep avx512 /proc/cpuinfo
```

## Alternative: System Package Manager

Instead of downloading, you can install Stockfish system-wide:

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install stockfish
```

### CentOS/RHEL
```bash
sudo yum install stockfish
# or for newer versions:
sudo dnf install stockfish
```

### macOS (Homebrew)
```bash
brew install stockfish
```

The engine pool will automatically detect system-installed Stockfish if the local binary is not found.

## Docker Deployment

If using Docker, add to your Dockerfile:

```dockerfile
# Download Stockfish binary
RUN mkdir -p /app/stockfish && \
    cd /app/stockfish && \
    wget -q https://github.com/official-stockfish/Stockfish/releases/download/16.1/stockfish_16.1_linux_x86-64-avx2 && \
    chmod +x stockfish_16.1_linux_x86-64-avx2 && \
    mv stockfish_16.1_linux_x86-64-avx2 stockfish
```

## Verification

After deployment, verify Stockfish is working:

```bash
# Test the engine pool
cd backend
npm run test:engine

# Or check the health endpoint
curl https://your-backend-url/api/health/engine
```

## Troubleshooting

### Binary Not Found

**Error**: `Stockfish binary not found`

**Solutions**:
1. Check if download script ran during build
2. Verify binary exists: `ls -la stockfish/stockfish`
3. Check file permissions: `chmod +x stockfish/stockfish`
4. Try manual download: `bash backend/scripts/download-stockfish.sh`

### Download Fails During Build

**Error**: `Download failed` or network timeout

**Solutions**:
1. The build continues (script has `|| echo` fallback)
2. Download manually after deployment
3. Use system package manager instead
4. Check GitHub releases are accessible from your server

### Binary Not Executable

**Error**: Permission denied when running Stockfish

**Solution**:
```bash
chmod +x stockfish/stockfish
```

### Wrong Architecture

**Error**: Binary runs but is slow or crashes

**Solution**:
1. Detect your CPU architecture (see above)
2. Download appropriate binary:
   ```bash
   bash backend/scripts/download-stockfish.sh x86-64-bmi2
   ```

## Production Checklist

- [ ] Stockfish binary downloaded during build
- [ ] Binary is executable (`chmod +x`)
- [ ] Engine health endpoint returns `ready: true`
- [ ] Test analysis endpoint: `POST /api/analyze`
- [ ] Monitor engine pool status in logs

## Environment Variables

You can override the binary path with an environment variable (future enhancement):

```bash
STOCKFISH_BINARY_PATH=/custom/path/stockfish
```

## Notes

- The binary is ~76MB, so download time varies by network speed
- GitHub releases are the official source: https://github.com/official-stockfish/Stockfish/releases
- Binary detection order (in `enginePool.js`):
  1. Local binary in `stockfish/` folder
  2. System PATH (`stockfish` command)
  3. Common system paths
  4. node_modules (if installed)

