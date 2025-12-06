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

async function getLatestVersion() {
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
          resolve(release.tag_name);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
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
  
  const binaryName = PLATFORM_MAP[platform][arch];
  const outputPath = join(stockfishDir, platform === "windows" ? binaryName : "stockfish");
  
  // Check if binary already exists
  try {
    await access(outputPath);
    console.log(`[Stockfish Downloader] Binary already exists at ${outputPath}`);
    console.log(`[Stockfish Downloader] Skipping download. Delete the file to re-download.`);
    return;
  } catch {
    // File doesn't exist, proceed with download
  }
  
  // Get latest version
  console.log(`[Stockfish Downloader] Fetching latest Stockfish version...`);
  let version;
  try {
    version = await getLatestVersion();
    console.log(`[Stockfish Downloader] Latest version: ${version}`);
  } catch (error) {
    console.warn(`[Stockfish Downloader] Failed to fetch latest version, using hardcoded: ${error.message}`);
    version = "16.1"; // Fallback to known version
  }
  
  // Construct download URL
  const downloadUrl = `${STOCKFISH_DOWNLOAD_BASE}/${version}/${binaryName}`;
  
  // Ensure stockfish directory exists
  try {
    await mkdir(stockfishDir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
  
  // Download the binary
  console.log(`[Stockfish Downloader] Downloading from ${downloadUrl}...`);
  console.log(`[Stockfish Downloader] Saving to ${outputPath}...`);
  
  try {
    await downloadFile(downloadUrl, outputPath);
    console.log(`[Stockfish Downloader] Download complete!`);
    
    // Make executable on Unix systems
    if (platform !== "windows") {
      await chmod(outputPath, 0o755);
      console.log(`[Stockfish Downloader] Made binary executable`);
    }
    
    console.log(`[Stockfish Downloader] Stockfish binary ready at: ${outputPath}`);
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

