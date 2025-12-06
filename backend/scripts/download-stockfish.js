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
      try {
        execSync(`tar -xf "${downloadPath}" -C "${stockfishDir}"`, { stdio: "inherit" });
        // Remove tar file
        await import("fs/promises").then(m => m.unlink(downloadPath));
        
        // Find the extracted binary (might have a different name)
        const fs = await import("fs/promises");
        const files = await fs.readdir(stockfishDir);
        const binaryFile = files.find(f => 
          !f.includes(".tar") && 
          !f.includes(".txt") && 
          f !== "stockfish" &&
          (f.startsWith("stockfish") || f.includes("x86-64"))
        );
        
        if (binaryFile) {
          const extractedPath = join(stockfishDir, binaryFile);
          // Rename to standard name if needed
          if (binaryFile !== "stockfish" && platform !== "windows") {
            await fs.rename(extractedPath, outputPath);
            console.log(`[Stockfish Downloader] Renamed ${binaryFile} to stockfish`);
          } else if (platform === "windows" && binaryFile !== "stockfish.exe") {
            await fs.rename(extractedPath, outputPath);
            console.log(`[Stockfish Downloader] Renamed ${binaryFile} to stockfish.exe`);
          }
        } else {
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

