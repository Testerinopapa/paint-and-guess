#!/bin/bash
# Simple bash script to download Stockfish binary for Linux
# This is more reliable on Linux systems than the Node.js script

# Don't use set -e, we want to handle errors gracefully
set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STOCKFISH_DIR="$PROJECT_ROOT/stockfish"
OUTPUT_PATH="$STOCKFISH_DIR/stockfish"

# Default to avx2 which works on most modern Linux servers
ARCH="${1:-x86-64-avx2}"

# Stockfish version (update this when new versions are released)
VERSION="16.1"

# Binary name mapping
declare -A BINARY_NAMES=(
  ["x86-64-vnni512"]="stockfish_${VERSION}_linux_x86-64-vnni512"
  ["x86-64-vnni256"]="stockfish_${VERSION}_linux_x86-64-vnni256"
  ["x86-64-avx512"]="stockfish_${VERSION}_linux_x86-64-avx512"
  ["x86-64-bmi2"]="stockfish_${VERSION}_linux_x86-64-bmi2"
  ["x86-64-avx2"]="stockfish_${VERSION}_linux_x86-64-avx2"
  ["x86-64-sse41-popcnt"]="stockfish_${VERSION}_linux_x86-64-sse41-popcnt"
  ["x86-64"]="stockfish_${VERSION}_linux_x86-64"
)

BINARY_NAME="${BINARY_NAMES[$ARCH]}"

if [ -z "$BINARY_NAME" ]; then
  echo "[Stockfish Downloader] Unsupported architecture: $ARCH"
  echo "[Stockfish Downloader] Supported: ${!BINARY_NAMES[@]}"
  exit 1
fi

DOWNLOAD_URL="https://github.com/official-stockfish/Stockfish/releases/download/${VERSION}/${BINARY_NAME}"

# Check if binary already exists
if [ -f "$OUTPUT_PATH" ]; then
  echo "[Stockfish Downloader] Binary already exists at $OUTPUT_PATH"
  echo "[Stockfish Downloader] Skipping download. Delete the file to re-download."
  exit 0
fi

# Create stockfish directory
mkdir -p "$STOCKFISH_DIR"

echo "[Stockfish Downloader] Downloading Stockfish $VERSION ($ARCH)..."
echo "[Stockfish Downloader] URL: $DOWNLOAD_URL"
echo "[Stockfish Downloader] Output: $OUTPUT_PATH"

# Try wget first, then curl
DOWNLOAD_SUCCESS=0
if command -v wget >/dev/null 2>&1; then
  echo "[Stockfish Downloader] Using wget..."
  wget --progress=bar:force -O "$OUTPUT_PATH" "$DOWNLOAD_URL" 2>&1
  if [ $? -eq 0 ] && [ -f "$OUTPUT_PATH" ]; then
    DOWNLOAD_SUCCESS=1
  else
    echo "[Stockfish Downloader] wget failed, trying curl..."
    rm -f "$OUTPUT_PATH"
  fi
fi

if [ $DOWNLOAD_SUCCESS -eq 0 ] && command -v curl >/dev/null 2>&1; then
  echo "[Stockfish Downloader] Using curl..."
  curl -L --progress-bar -o "$OUTPUT_PATH" "$DOWNLOAD_URL" 2>&1
  if [ $? -eq 0 ] && [ -f "$OUTPUT_PATH" ]; then
    DOWNLOAD_SUCCESS=1
  else
    echo "[Stockfish Downloader] curl also failed!"
    rm -f "$OUTPUT_PATH"
  fi
fi

if [ $DOWNLOAD_SUCCESS -eq 0 ]; then
  echo "[Stockfish Downloader] ERROR: Download failed - neither wget nor curl succeeded"
  echo "[Stockfish Downloader] URL was: $DOWNLOAD_URL"
  exit 1
fi

# Make executable
chmod +x "$OUTPUT_PATH"

# Verify the binary exists and is executable
if [ ! -f "$OUTPUT_PATH" ]; then
  echo "[Stockfish Downloader] ERROR: Binary file not found after download!"
  exit 1
fi

if [ ! -x "$OUTPUT_PATH" ]; then
  echo "[Stockfish Downloader] WARNING: Binary is not executable, attempting to fix..."
  chmod +x "$OUTPUT_PATH"
fi

echo "[Stockfish Downloader] Download complete!"
echo "[Stockfish Downloader] Binary ready at: $OUTPUT_PATH"
echo "[Stockfish Downloader] File size: $(du -h "$OUTPUT_PATH" | cut -f1)"

