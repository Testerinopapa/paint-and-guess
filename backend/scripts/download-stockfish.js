#!/usr/bin/env node
/**
 * Download Stockfish binary for production deployment
 * 
 * This script downloads the appropriate Stockfish binary for the current platform
 * and places it in the stockfish/ folder at the project root.
 * 
 * Usage:
 *   node scripts/download-stockfish.js [platform] [arch]
 * 
 * Examples:
 *   node scripts/download-stockfish.js linux x86-64-avx2
 *   node scripts/download-stockfish.js linux x86-64-bmi2
 *   node scripts/download-stockfish.js windows x86-64-avx2
 */

import { createWriteStream } from "fs";
import { mkdir, access, chmod } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import { pipeline } from "stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");
const stockfishDir = join(projectRoot, "stockfish");

// Stockfish GitHub releases API
const STOCKFISH_RELEASES_URL = "https://api.github.com/repos/official-stockfish/Stockfish/releases/latest";
const STOCKFISH_DOWNLOAD_BASE = "https://github.com/official-stockfish/Stockfish/releases/download";

// Platform and architecture mapping
const PLATFORM_MAP = {
  linux: {
    "x86-64-vnni512": "stockfish_16.1_linux_x86-64-vnni512",
    "x86-64-vnni256": "stockfish_16.1_linux_x86-64-vnni256",
    "x86-64-avx512": "stockfish_16.1_linux_x86-64-avx512",
    "x86-64-bmi2": "stockfish_16.1_linux_x86-64-bmi2",
    "x86-64-avx2": "stockfish_16.1_linux_x86-64-avx2",
    "x86-64-sse41-popcnt": "stockfish_16.1_linux_x86-64-sse41-popcnt",
    "x86-64": "stockfish_16.1_linux_x86-64",
  },
  windows: {
    "x86-64-vnni512": "stockfish_16.1_windows_x86-64-vnni512.exe",
    "x86-64-vnni256": "stockfish_16.1_windows_x86-64-vnni256.exe",
    "x86-64-avx512": "stockfish_16.1_windows_x86-64-avx512.exe",
    "x86-64-bmi2": "stockfish_16.1_windows_x86-64-bmi2.exe",
    "x86-64-avx2": "stockfish_16.1_windows_x86-64-avx2.exe",
    "x86-64-sse41-popcnt": "stockfish_16.1_windows_x86-64-sse41-popcnt.exe",
    "x86-64": "stockfish_16.1_windows_x86-64.exe",
  },
  darwin: {
    "x86-64-avx2": "stockfish_16.1_osx_x86-64-avx2",
    "x86-64-bmi2": "stockfish_16.1_osx_x86-64-bmi2",
    "x86-64": "stockfish_16.1_osx_x86-64",
    "arm64": "stockfish_16.1_osx_arm64",
  },
};

// Detect platform and architecture
function detectPlatform() {
  const platform = process.platform;
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "darwin";
  return "linux";
}

function detectArchitecture() {
  const arch = process.arch;
  
  // For Linux, default to a safe choice that works on most servers
  // x86-64-avx2 is a good balance of performance and compatibility
  if (process.platform === "linux") {
    // You can add CPU feature detection here if needed
    // For now, default to avx2 which works on most modern servers
    return "x86-64-avx2";
  }
  
  if (arch === "arm64") return "arm64";
  return "x86-64-avx2"; // Safe default
}

async function getLatestRelease() {
  return new Promise((resolve, reject) => {
    https.get(STOCKFISH_RELEASES_URL, {
      headers: {
        "User-Agent": "Stockfish-Downloader/1.0",
        "Accept": "application/vnd.github.v3+json",
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch releases: ${res.statusCode}`));
        return;
      }
      
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      res.on("end", () => {
        try {
          const release = JSON.parse(data);
          resolve(release);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function findMatchingAsset(assets, platform, arch) {
  // Build search patterns based on platform and architecture
  const patterns = [];
  
  if (platform === "linux") {
    // GitHub uses "ubuntu" in asset names, not "linux"
    patterns.push(`ubuntu.*${arch}`);
    patterns.push(`${arch}.*ubuntu`);
    patterns.push(`linux.*${arch}`);
    patterns.push(`${arch}.*linux`);
    // Also try without underscores/dashes
    patterns.push(`ubuntu.*${arch.replace(/-/g, "")}`);
    patterns.push(`linux.*${arch.replace(/-/g, "")}`);
  } else if (platform === "windows") {
    patterns.push(`windows.*${arch}`);
    patterns.push(`${arch}.*windows`);
    patterns.push(`windows.*${arch.replace(/-/g, "")}`);
  } else if (platform === "darwin") {
    patterns.push(`osx.*${arch}`);
    patterns.push(`macos.*${arch}`);
    patterns.push(`darwin.*${arch}`);
    patterns.push(`${arch}.*osx`);
  }
  
  // Find asset matching any pattern (including .tar files)
  for (const asset of assets) {
    const name = asset.name.toLowerCase();
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"), "i");
      if (regex.test(name)) {
        return asset; // Return even if it's a .tar file - we'll extract it
      }
    }
  }
  
  return null;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const fileStream = createWriteStream(dest);
      pipeline(response, fileStream)
        .then(() => resolve())
        .catch(reject);
    }).on("error", reject);
  });
}

async function main() {
  // Skip if we're in Docker (Stockfish is installed in Dockerfile)
  if (process.env.SKIP_STOCKFISH_DOWNLOAD === "true") {
    console.log(`[Stockfish Downloader] Skipping download (SKIP_STOCKFISH_DOWNLOAD environment variable set)`);
    return;
  }
  
  // Check if Docker path exists (synchronous check)
  try {
    if (fs.existsSync("/app/stockfish/stockfish")) {
      console.log(`[Stockfish Downloader] Skipping download (Docker environment detected)`);
      return;
    }
  } catch {
    // Continue if check fails
  }
  
  const platform = process.argv[2] || detectPlatform();
  const arch = process.argv[3] || detectArchitecture();
  
  console.log(`[Stockfish Downloader] Platform: ${platform}, Architecture: ${arch}`);
  
  // Validate platform and architecture
  if (!PLATFORM_MAP[platform]) {
    console.error(`[Stockfish Downloader] Unsupported platform: ${platform}`);
    console.error(`[Stockfish Downloader] Supported platforms: ${Object.keys(PLATFORM_MAP).join(", ")}`);
    process.exit(1);
  }
  
  if (!PLATFORM_MAP[platform][arch]) {
    console.error(`[Stockfish Downloader] Unsupported architecture for ${platform}: ${arch}`);
    console.error(`[Stockfish Downloader] Supported architectures: ${Object.keys(PLATFORM_MAP[platform]).join(", ")}`);
    process.exit(1);
  }
  
  const outputPath = join(stockfishDir, platform === "windows" ? "stockfish.exe" : "stockfish");
  
  // Check if binary already exists and is valid (at least 1MB)
  try {
    const stats = await import("fs/promises").then(m => m.stat(outputPath));
    if (stats.size > 1048576) { // 1MB minimum
      console.log(`[Stockfish Downloader] Binary already exists at ${outputPath} (size: ${(stats.size / 1048576).toFixed(1)}MB)`);
      console.log(`[Stockfish Downloader] Skipping download. Delete the file to re-download.`);
      return;
    } else {
      console.log(`[Stockfish Downloader] Existing binary is too small (${stats.size} bytes), re-downloading...`);
      await import("fs/promises").then(m => m.unlink(outputPath).catch(() => {}));
    }
  } catch {
    // File doesn't exist, proceed with download
  }
  
  // Get latest release and find matching asset
  console.log(`[Stockfish Downloader] Fetching latest Stockfish release...`);
  let release;
  let downloadUrl;
  
  try {
    release = await getLatestRelease();
    console.log(`[Stockfish Downloader] Latest release: ${release.tag_name}`);
    
    // Find matching asset
    const asset = findMatchingAsset(release.assets, platform, arch);
    if (!asset) {
      console.error(`[Stockfish Downloader] No matching asset found for ${platform}/${arch}`);
      console.error(`[Stockfish Downloader] Available assets:`);
      release.assets.slice(0, 10).forEach(a => {
        console.error(`[Stockfish Downloader]   - ${a.name}`);
      });
      throw new Error(`No matching binary found for ${platform}/${arch}`);
    }
    
    downloadUrl = asset.browser_download_url;
    console.log(`[Stockfish Downloader] Found asset: ${asset.name} (${(asset.size / 1048576).toFixed(1)}MB)`);
  } catch (error) {
    console.error(`[Stockfish Downloader] Failed to find asset: ${error.message}`);
    console.error(`[Stockfish Downloader] Falling back to URL construction method...`);
    
    // Fallback: try to construct URL (less reliable)
    const version = release?.tag_name?.replace(/^sf_/, "").replace(/^v/, "") || "16.1";
    const binaryName = PLATFORM_MAP[platform][arch]?.replace(/16\.1/g, version) || `stockfish_${version}_${platform}_${arch}`;
    downloadUrl = `${STOCKFISH_DOWNLOAD_BASE}/${release?.tag_name || version}/${binaryName}`;
    console.log(`[Stockfish Downloader] Trying constructed URL: ${downloadUrl}`);
  }
  
  // Ensure stockfish directory exists
  try {
    await mkdir(stockfishDir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
  
  // Check if we're downloading a tar file
  const isTarFile = downloadUrl.includes(".tar");
  const downloadPath = isTarFile ? join(stockfishDir, "stockfish.tar") : outputPath;
  
  // Download the binary (or tar archive)
  console.log(`[Stockfish Downloader] Downloading from ${downloadUrl}...`);
  console.log(`[Stockfish Downloader] Saving to ${downloadPath}...`);
  
  try {
    await downloadFile(downloadUrl, downloadPath);
    
    // Verify file size
    const stats = await import("fs/promises").then(m => m.stat(downloadPath));
    if (stats.size < 1048576) {
      throw new Error(`Downloaded file too small (${stats.size} bytes) - likely 404 error page`);
    }
    
    console.log(`[Stockfish Downloader] Download complete! (${(stats.size / 1048576).toFixed(1)}MB)`);
    
    // Extract if it's a tar file
    if (isTarFile) {
      console.log(`[Stockfish Downloader] Extracting tar archive...`);
      const { execSync } = await import("child_process");
      const fs = await import("fs/promises");
      const { stat, rm } = await import("fs/promises");
      
      try {
        // Extract to a temporary subdirectory to avoid conflicts
        const extractDir = join(stockfishDir, "extracted");
        try {
          await rm(extractDir, { recursive: true, force: true });
        } catch {
          // Directory doesn't exist, that's fine
        }
        await fs.mkdir(extractDir, { recursive: true });
        
        execSync(`tar -xf "${downloadPath}" -C "${extractDir}"`, { stdio: "inherit" });
        // Remove tar file
        await fs.unlink(downloadPath);
        
        // Find the extracted binary (might be in a subdirectory)
        async function findBinary(dir, depth = 0) {
          if (depth > 3) return null; // Limit recursion
          
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory()) {
              const found = await findBinary(fullPath, depth + 1);
              if (found) return found;
            } else if (entry.isFile()) {
              // Check if it's a binary file (not .tar, .txt, etc.)
              if (!entry.name.includes(".tar") && 
                  !entry.name.includes(".txt") && 
                  !entry.name.includes(".md") &&
                  !entry.name.includes(".sha") &&
                  entry.name !== "stockfish" &&
                  entry.name !== "stockfish.exe") {
                // Check if it's likely the binary (large file, typically ~76MB)
                const stats = await stat(fullPath);
                if (stats.size > 1000000) { // At least 1MB (real binary is ~76MB)
                  return fullPath;
                }
              }
            }
          }
          return null;
        }
        
        const foundBinary = await findBinary(extractDir);
        
        if (foundBinary) {
          // Remove outputPath if it exists (whether file or directory)
          try {
            const outputStats = await stat(outputPath);
            if (outputStats.isDirectory()) {
              await rm(outputPath, { recursive: true, force: true });
              console.log(`[Stockfish Downloader] Removed existing directory at ${outputPath}`);
            } else {
              await fs.unlink(outputPath);
              console.log(`[Stockfish Downloader] Removed existing file at ${outputPath}`);
            }
          } catch {
            // Path doesn't exist, that's fine
          }
          
          // Copy the binary to the final location (use copy then remove to handle cross-filesystem moves)
          await fs.copyFile(foundBinary, outputPath);
          await fs.chmod(outputPath, 0o755); // Make executable
          
          // Clean up extraction directory
          await rm(extractDir, { recursive: true, force: true });
          
          console.log(`[Stockfish Downloader] Found and copied binary from ${foundBinary} to ${outputPath}`);
        } else {
          // List what we found for debugging
          const allFiles = await fs.readdir(extractDir, { recursive: true });
          console.error(`[Stockfish Downloader] Could not find extracted binary. Files found:`, allFiles);
          await rm(extractDir, { recursive: true, force: true });
          throw new Error("Could not find extracted binary in tar archive");
        }
      } catch (extractError) {
        console.error(`[Stockfish Downloader] Extraction failed: ${extractError.message}`);
        throw extractError;
      }
    }
    
    // Verify final binary exists
    const finalStats = await import("fs/promises").then(m => m.stat(outputPath));
    if (finalStats.size < 1048576) {
      throw new Error(`Binary too small (${finalStats.size} bytes)`);
    }
    
    // Make executable on Unix systems
    if (platform !== "windows") {
      await chmod(outputPath, 0o755);
      console.log(`[Stockfish Downloader] Made binary executable`);
    }
    
    console.log(`[Stockfish Downloader] Stockfish binary ready at: ${outputPath} (${(finalStats.size / 1048576).toFixed(1)}MB)`);
  } catch (error) {
    console.error(`[Stockfish Downloader] Download failed: ${error.message}`);
    console.error(`[Stockfish Downloader] You may need to download manually from:`);
    console.error(`[Stockfish Downloader] ${downloadUrl}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[Stockfish Downloader] Fatal error:`, error);
  process.exit(1);
});

