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
# Note: Release tag format on GitHub might be "16.1" or "sf_16.1"
VERSION="16.1"
RELEASE_TAG="16.1"  # Try this first, might need to be "sf_16.1" or other format

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

# GitHub releases URL - need to check actual release tag format
# Stockfish uses format like "16.1" but release tag might be different
# Try different release tag formats
DOWNLOAD_URLS=(
  "https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${BINARY_NAME}"
  "https://github.com/official-stockfish/Stockfish/releases/download/sf_${VERSION}/${BINARY_NAME}"
  "https://github.com/official-stockfish/Stockfish/releases/download/v${VERSION}/${BINARY_NAME}"
)

# Check if binary already exists and is valid (at least 1MB - real binary is ~76MB)
if [ -f "$OUTPUT_PATH" ]; then
  FILE_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null || echo "0")
  MIN_SIZE=1048576  # 1MB minimum
  if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
    echo "[Stockfish Downloader] Binary already exists at $OUTPUT_PATH (size: $(du -h "$OUTPUT_PATH" | cut -f1))"
    echo "[Stockfish Downloader] Skipping download. Delete the file to re-download."
    exit 0
  else
    echo "[Stockfish Downloader] Existing binary is too small ($FILE_SIZE bytes), re-downloading..."
    rm -f "$OUTPUT_PATH"
  fi
fi

# Create stockfish directory
mkdir -p "$STOCKFISH_DIR"

echo "[Stockfish Downloader] Downloading Stockfish $VERSION ($ARCH)..."
echo "[Stockfish Downloader] Output: $OUTPUT_PATH"

# Try each URL until one works
DOWNLOAD_SUCCESS=0
MIN_SIZE=1048576  # 1MB minimum (real binary is ~76MB)

for DOWNLOAD_URL in "${DOWNLOAD_URLS[@]}"; do
  echo "[Stockfish Downloader] Trying URL: $DOWNLOAD_URL"
  
  # Try wget first, then curl
  if command -v wget >/dev/null 2>&1; then
    echo "[Stockfish Downloader] Using wget..."
    wget --progress=bar:force -O "$OUTPUT_PATH" "$DOWNLOAD_URL" 2>&1
    WGET_EXIT=$?
    if [ $WGET_EXIT -eq 0 ] && [ -f "$OUTPUT_PATH" ]; then
      FILE_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
        DOWNLOAD_SUCCESS=1
        echo "[Stockfish Downloader] Successfully downloaded (size: $(du -h "$OUTPUT_PATH" | cut -f1))"
        break
      else
        echo "[Stockfish Downloader] Downloaded file too small ($FILE_SIZE bytes) - likely 404 error page"
        rm -f "$OUTPUT_PATH"
      fi
    else
      echo "[Stockfish Downloader] wget failed (exit code: $WGET_EXIT)"
      rm -f "$OUTPUT_PATH"
    fi
  fi

  if [ $DOWNLOAD_SUCCESS -eq 0 ] && command -v curl >/dev/null 2>&1; then
    echo "[Stockfish Downloader] Using curl..."
    HTTP_CODE=$(curl -L -w "%{http_code}" -o "$OUTPUT_PATH" -s "$DOWNLOAD_URL")
    if [ "$HTTP_CODE" = "200" ] && [ -f "$OUTPUT_PATH" ]; then
      FILE_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
        DOWNLOAD_SUCCESS=1
        echo "[Stockfish Downloader] Successfully downloaded (size: $(du -h "$OUTPUT_PATH" | cut -f1))"
        break
      else
        echo "[Stockfish Downloader] Downloaded file too small ($FILE_SIZE bytes) - likely 404 error page"
        rm -f "$OUTPUT_PATH"
      fi
    else
      echo "[Stockfish Downloader] curl failed (HTTP $HTTP_CODE)"
      rm -f "$OUTPUT_PATH"
    fi
  fi
done

if [ $DOWNLOAD_SUCCESS -eq 0 ]; then
  echo "[Stockfish Downloader] ERROR: Download failed - all URLs returned 404 or file too small"
  echo "[Stockfish Downloader] Tried URLs:"
  for url in "${DOWNLOAD_URLS[@]}"; do
    echo "[Stockfish Downloader]   - $url"
  done
  echo "[Stockfish Downloader] Please check: https://github.com/official-stockfish/Stockfish/releases"
  echo "[Stockfish Downloader] And verify the correct release tag and binary name format"
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

