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

# Fetch latest release info from GitHub API
echo "[Stockfish Downloader] Fetching latest release info from GitHub..."
RELEASE_INFO=$(curl -s -H "User-Agent: Stockfish-Downloader/1.0" "https://api.github.com/repos/official-stockfish/Stockfish/releases/latest")

# Check if curl failed or response is empty
if [ $? -ne 0 ] || [ -z "$RELEASE_INFO" ]; then
  echo "[Stockfish Downloader] WARNING: Failed to fetch release info, using fallback method"
  RELEASE_TAG="sf_17.1"
  VERSION="17.1"
  BINARY_NAME="stockfish_${VERSION}_linux_x86-64-avx2"
  DOWNLOAD_URLS=(
    "https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${BINARY_NAME}"
  )
else
  # Check if response contains an error message
  if echo "$RELEASE_INFO" | grep -q '"message"'; then
    echo "[Stockfish Downloader] WARNING: GitHub API returned an error:"
    echo "$RELEASE_INFO" | grep -o '"message": "[^"]*' | cut -d'"' -f4 | head -1
    echo "[Stockfish Downloader] Using fallback method"
    RELEASE_TAG="sf_17.1"
    VERSION="17.1"
    BINARY_NAME="stockfish_${VERSION}_linux_x86-64-avx2"
    DOWNLOAD_URLS=(
      "https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${BINARY_NAME}"
    )
  else
    # Extract tag name and find matching asset
    RELEASE_TAG=$(echo "$RELEASE_INFO" | grep -o '"tag_name": "[^"]*' | cut -d'"' -f4)
    echo "[Stockfish Downloader] Latest release tag: $RELEASE_TAG"
    
    # Validate that we got a tag
    if [ -z "$RELEASE_TAG" ]; then
      echo "[Stockfish Downloader] WARNING: Could not extract release tag from API response"
      echo "[Stockfish Downloader] API response preview: $(echo "$RELEASE_INFO" | head -c 200)"
      echo "[Stockfish Downloader] Using fallback method"
      RELEASE_TAG="sf_17.1"
      VERSION="17.1"
      BINARY_NAME="stockfish_${VERSION}_linux_x86-64-avx2"
      DOWNLOAD_URLS=(
        "https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${BINARY_NAME}"
      )
    else
      # Find asset matching the architecture (including .tar files - that's what GitHub provides)
      # Use jq if available, otherwise use grep/sed
      if command -v jq >/dev/null 2>&1; then
        # Check if assets array exists and is not null
        if echo "$RELEASE_INFO" | jq -e '.assets' >/dev/null 2>&1; then
          # Try ubuntu first (most common), then linux
          # Match assets that contain both "ubuntu" (or "linux") and the architecture
          DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r ".assets[] | select((.name | ascii_downcase | contains(\"ubuntu\") or contains(\"linux\")) and (ascii_downcase | contains(\"${ARCH}\"))) | .browser_download_url" | head -1)
          if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
            echo "[Stockfish Downloader] jq: No matching asset found, listing available assets:"
            echo "$RELEASE_INFO" | jq -r ".assets[].name" | grep -i "ubuntu\|linux" | head -5
          fi
        else
          echo "[Stockfish Downloader] WARNING: API response has no assets array"
          DOWNLOAD_URL=""
        fi
      else
        # Fallback: try to extract asset URL manually
        # Convert ARCH to lowercase for matching
        ARCH_LOWER=$(echo "$ARCH" | tr '[:upper:]' '[:lower:]')
        echo "[Stockfish Downloader] Using grep fallback (jq not available)"
        echo "[Stockfish Downloader] Looking for assets matching: ubuntu/linux + ${ARCH_LOWER}"
        
        # Extract all asset names first, then filter
        # The JSON structure has each asset as a block with "name" and "browser_download_url"
        # We need to find the asset block that contains both ubuntu/linux and the arch
        
        # Method: Extract all asset names, find matching one
        # Get all asset names, filter for ubuntu/linux, then filter for architecture
        ALL_ASSET_NAMES=$(echo "$RELEASE_INFO" | grep -o '"name": "[^"]*"' | cut -d'"' -f4)
        
        # Try ubuntu first: find assets with both "ubuntu" and the architecture
        MATCHING_ASSET_NAME=$(echo "$ALL_ASSET_NAMES" | grep -i "ubuntu" | grep -i "${ARCH_LOWER}" | head -1)
        
        # Try linux if ubuntu didn't work
        if [ -z "$MATCHING_ASSET_NAME" ]; then
          MATCHING_ASSET_NAME=$(echo "$ALL_ASSET_NAMES" | grep -i "linux" | grep -i "${ARCH_LOWER}" | head -1)
        fi
        
        if [ -n "$MATCHING_ASSET_NAME" ]; then
          # Now find the browser_download_url for this asset
          # The URL should be near the asset name in the JSON
          # We'll construct it from the tag and asset name
          DOWNLOAD_URL="https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${MATCHING_ASSET_NAME}"
          echo "[Stockfish Downloader] Found asset via grep: $MATCHING_ASSET_NAME"
        else
          echo "[Stockfish Downloader] Available Linux assets (for debugging):"
          echo "$RELEASE_INFO" | grep -o '"name": "[^"]*"' | cut -d'"' -f4 | grep -i "ubuntu\|linux" | head -5
        fi
      fi
      
      if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
        echo "[Stockfish Downloader] WARNING: Could not find matching asset, using fallback URL construction"
        VERSION=$(echo "$RELEASE_TAG" | sed 's/^sf_//' | sed 's/^v//')
        # Validate VERSION is not empty
        if [ -z "$VERSION" ]; then
          VERSION="17.1"
        fi
        BINARY_NAME="stockfish_${VERSION}_linux_x86-64-avx2"
        DOWNLOAD_URLS=(
          "https://github.com/official-stockfish/Stockfish/releases/download/${RELEASE_TAG}/${BINARY_NAME}"
        )
      else
        echo "[Stockfish Downloader] Found matching asset: $DOWNLOAD_URL"
        DOWNLOAD_URLS=("$DOWNLOAD_URL")
      fi
    fi
  fi
fi

# Check if binary already exists and is valid (at least 1MB - real binary is ~76MB)
if [ -f "$OUTPUT_PATH" ]; then
  FILE_SIZE=$(stat -f%z "$OUTPUT_PATH" 2>/dev/null || stat -c%s "$OUTPUT_PATH" 2>/dev/null || echo "0")
  MIN_SIZE=1048576  # 1MB minimum
  if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
    echo "[Stockfish Downloader] Binary already exists at $OUTPUT_PATH (size: $(du -h "$OUTPUT_PATH" | cut -f1))"
    # Ensure it's executable (in case permissions were lost)
    chmod +x "$OUTPUT_PATH"
    echo "[Stockfish Downloader] Verified execute permissions. Skipping download. Delete the file to re-download."
    exit 0
  else
    echo "[Stockfish Downloader] Existing binary is too small ($FILE_SIZE bytes), re-downloading..."
    rm -f "$OUTPUT_PATH"
  fi
fi

# Create stockfish directory
mkdir -p "$STOCKFISH_DIR"

echo "[Stockfish Downloader] Downloading Stockfish ($ARCH)..."
echo "[Stockfish Downloader] Output: $OUTPUT_PATH"

# Determine if we're downloading a tar file
IS_TAR=false
DOWNLOAD_PATH="$OUTPUT_PATH"
for url in "${DOWNLOAD_URLS[@]}"; do
  if [[ "$url" == *.tar* ]]; then
    IS_TAR=true
    DOWNLOAD_PATH="$STOCKFISH_DIR/stockfish.tar"
    break
  fi
done

# Try each URL until one works
DOWNLOAD_SUCCESS=0
MIN_SIZE=1048576  # 1MB minimum (real binary is ~76MB)

for DOWNLOAD_URL in "${DOWNLOAD_URLS[@]}"; do
  echo "[Stockfish Downloader] Trying URL: $DOWNLOAD_URL"
  
  # Try wget first, then curl
  if command -v wget >/dev/null 2>&1; then
    echo "[Stockfish Downloader] Using wget..."
    wget --progress=bar:force -O "$DOWNLOAD_PATH" "$DOWNLOAD_URL" 2>&1
    WGET_EXIT=$?
    if [ $WGET_EXIT -eq 0 ] && [ -f "$DOWNLOAD_PATH" ]; then
      FILE_SIZE=$(stat -f%z "$DOWNLOAD_PATH" 2>/dev/null || stat -c%s "$DOWNLOAD_PATH" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
        DOWNLOAD_SUCCESS=1
        echo "[Stockfish Downloader] Successfully downloaded (size: $(du -h "$DOWNLOAD_PATH" | cut -f1))"
        break
      else
        echo "[Stockfish Downloader] Downloaded file too small ($FILE_SIZE bytes) - likely 404 error page"
        rm -f "$DOWNLOAD_PATH"
      fi
    else
      echo "[Stockfish Downloader] wget failed (exit code: $WGET_EXIT)"
      rm -f "$DOWNLOAD_PATH"
    fi
  fi

  if [ $DOWNLOAD_SUCCESS -eq 0 ] && command -v curl >/dev/null 2>&1; then
    echo "[Stockfish Downloader] Using curl..."
    HTTP_CODE=$(curl -L -w "%{http_code}" -o "$DOWNLOAD_PATH" -s "$DOWNLOAD_URL")
    if [ "$HTTP_CODE" = "200" ] && [ -f "$DOWNLOAD_PATH" ]; then
      FILE_SIZE=$(stat -f%z "$DOWNLOAD_PATH" 2>/dev/null || stat -c%s "$DOWNLOAD_PATH" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" -gt "$MIN_SIZE" ]; then
        DOWNLOAD_SUCCESS=1
        echo "[Stockfish Downloader] Successfully downloaded (size: $(du -h "$DOWNLOAD_PATH" | cut -f1))"
        break
      else
        echo "[Stockfish Downloader] Downloaded file too small ($FILE_SIZE bytes) - likely 404 error page"
        rm -f "$DOWNLOAD_PATH"
      fi
    else
      echo "[Stockfish Downloader] curl failed (HTTP $HTTP_CODE)"
      rm -f "$DOWNLOAD_PATH"
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

# Extract tar file if needed
if [ "$IS_TAR" = true ]; then
  echo "[Stockfish Downloader] Extracting tar archive..."
  if ! tar -xf "$DOWNLOAD_PATH" -C "$STOCKFISH_DIR" 2>/dev/null; then
    echo "[Stockfish Downloader] ERROR: Failed to extract tar archive"
    exit 1
  fi
  
  # Remove tar file
  rm -f "$DOWNLOAD_PATH"
  
  # Find the extracted binary (might have a different name)
  EXTRACTED_BINARY=$(find "$STOCKFISH_DIR" -maxdepth 1 -type f -name "stockfish*" ! -name "*.tar" ! -name "*.txt" | head -1)
  
  if [ -z "$EXTRACTED_BINARY" ]; then
    echo "[Stockfish Downloader] ERROR: Could not find extracted binary"
    exit 1
  fi
  
  # Rename to standard name if needed
  if [ "$EXTRACTED_BINARY" != "$OUTPUT_PATH" ]; then
    mv "$EXTRACTED_BINARY" "$OUTPUT_PATH"
    echo "[Stockfish Downloader] Renamed extracted binary to stockfish"
  fi
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

