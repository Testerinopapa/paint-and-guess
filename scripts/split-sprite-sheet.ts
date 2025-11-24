/**
 * Split Sprite Sheet Script
 * 
 * Splits horizontal sprite sheets into individual frame images.
 * Matches the structure used by the Character sprite pack (Idle-Body-01.png, etc.)
 * 
 * Usage:
 *   tsx scripts/split-sprite-sheet.ts <sprite-sheet-path> <output-dir> <frame-width> [frame-count]
 * 
 * Example:
 *   tsx scripts/split-sprite-sheet.ts public/FreeNinja/01-Ninja/Hit/yellowNinja-hit.png public/FreeNinja/01-Ninja/Hit 100
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect sprite starts and calculate frame boundaries based on known sprite dimensions
 * Sprite width: 5 units, Gap width: 19 units, Total per frame: 24 units
 * When sprite starts, jump forward 0.5 units to avoid cutting at edge
 */
async function findSpriteStarts(
  spriteSheetPath: string,
  width: number,
  height: number,
  spriteWidthUnits: number = 5,
  gapWidthUnits: number = 19
): Promise<{ spriteStarts: number[]; unitSize: number }> {
  try {
    // Get the entire sprite sheet as raw data
    const { data, info } = await sharp(spriteSheetPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sheetWidth = info.width;
    const spriteStarts: number[] = [];
    
    // First, detect the first sprite start to calculate unit size
    let firstSpriteStart = -1;
    let inSprite = false;
    
    for (let x = 0; x < sheetWidth; x++) {
      let transparentPixels = 0;
      let totalPixels = 0;

      for (let y = 0; y < height; y++) {
        const idx = (y * sheetWidth + x) * 4;
        const alpha = data[idx + 3];
        totalPixels++;
        if (alpha <= 10) {
          transparentPixels++;
        }
      }

      const transparentRatio = transparentPixels / totalPixels;
      const isEmpty = transparentRatio >= 0.95;

      if (!isEmpty && !inSprite) {
        // Sprite starts here
        firstSpriteStart = x;
        inSprite = true;
        spriteStarts.push(x);
      } else if (isEmpty && inSprite) {
        // Sprite ends, we're in a gap
        inSprite = false;
      }
    }

    // Calculate unit size based on first sprite
    // If we know the gap between first and second sprite is 19 units,
    // we can calculate the unit size
    if (spriteStarts.length >= 2) {
      const distanceBetweenSprites = spriteStarts[1] - spriteStarts[0];
      // Distance = sprite width (5 units) + gap (19 units) = 24 units
      const unitSize = distanceBetweenSprites / (spriteWidthUnits + gapWidthUnits);
      return { spriteStarts, unitSize };
    }

    // Fallback: estimate unit size from expected frame width
    const totalUnitsPerFrame = spriteWidthUnits + gapWidthUnits; // 24 units
    const estimatedUnitSize = width / (12 * totalUnitsPerFrame); // Assuming 12 frames
    return { spriteStarts, unitSize: estimatedUnitSize };
  } catch (error) {
    console.warn('Failed to detect sprite starts:', error);
    return { spriteStarts: [], unitSize: 1 };
  }
}

/**
 * Detect sprite boundaries in a frame area of the sprite sheet
 * Scans the entire frame area to find the leftmost and rightmost non-transparent pixels
 * Returns the actual sprite boundaries to prevent cutting through sprites
 */
async function detectSpriteBounds(
  spriteSheetPath: string,
  left: number,
  width: number,
  height: number
): Promise<{ leftBound: number; rightBound: number; hasContent: boolean }> {
  try {
    // Get full image metadata first
    const fullMetadata = await sharp(spriteSheetPath).metadata();
    const fullWidth = fullMetadata.width!;
    
    // Ensure we don't exceed image bounds
    const extractLeft = Math.max(0, Math.min(left, fullWidth - 1));
    const extractWidth = Math.min(width, fullWidth - extractLeft);
    
    if (extractWidth <= 0) {
      return {
        leftBound: left,
        rightBound: left + width,
        hasContent: false,
      };
    }

    // Extract the entire frame area to analyze
    const { data, info } = await sharp(spriteSheetPath)
      .extract({
        left: extractLeft,
        top: 0,
        width: extractWidth,
        height: height,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const frameWidth = info.width;
    let leftBound = frameWidth;
    let rightBound = -1;
    let hasContent = false;

    // Scan the entire frame for non-transparent pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const idx = (y * frameWidth + x) * 4;
        const alpha = data[idx + 3];
        
        if (alpha > 10) { // Non-transparent pixel (threshold for nearly transparent)
          hasContent = true;
          if (x < leftBound) leftBound = x;
          if (x > rightBound) rightBound = x;
        }
      }
    }

    // Convert back to absolute positions in the sprite sheet
    const absoluteLeft = extractLeft + (leftBound < frameWidth ? leftBound : 0);
    const absoluteRight = extractLeft + (rightBound >= 0 ? rightBound : frameWidth - 1);

    return {
      leftBound: absoluteLeft,
      rightBound: absoluteRight,
      hasContent,
    };
  } catch (error) {
    // If detection fails, return safe defaults (use the provided boundaries)
    return {
      leftBound: left,
      rightBound: left + width,
      hasContent: true,
    };
  }
}

interface SplitOptions {
  spriteSheetPath: string;
  outputDir: string;
  frameWidth: number;
  frameCount?: number; // If not provided, will calculate from image width
  framePrefix?: string; // e.g., "Hit-Body" -> "Hit-Body-01.png"
  padding?: number; // Number of digits for frame number (default: 2)
}

async function splitSpriteSheet(options: SplitOptions) {
  const {
    spriteSheetPath,
    outputDir,
    frameWidth,
    frameCount,
    framePrefix = 'frame',
    padding = 2,
  } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  // Load the sprite sheet image
  const image = sharp(spriteSheetPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  const sheetWidth = metadata.width;
  const sheetHeight = metadata.height;
  const calculatedFrameCount = Math.floor(sheetWidth / frameWidth);
  const finalFrameCount = frameCount || calculatedFrameCount;
  
  // Calculate actual frame width to avoid rounding errors
  // If frame count is specified, use exact division; otherwise use provided frame width
  // Use exact division (no floor) to ensure perfect alignment
  const actualFrameWidth = frameCount 
    ? sheetWidth / frameCount 
    : frameWidth;

  console.log(`📊 Sprite Sheet Info:`);
  console.log(`   Dimensions: ${sheetWidth}x${sheetHeight}px`);
  console.log(`   Frame Width: ${actualFrameWidth}px (requested: ${frameWidth}px)`);
  console.log(`   Frame Count: ${finalFrameCount}`);
  console.log(`   Output Directory: ${outputDir}`);

  // Detect sprite starts and calculate frame boundaries based on known dimensions
  // Sprite: 5 units, Gap: 19 units, Total: 24 units per frame
  console.log(`\n🔍 Detecting sprite starts (sprite: 5 units, gap: 19 units)...`);
  const { spriteStarts, unitSize } = await findSpriteStarts(spriteSheetPath, sheetWidth, sheetHeight, 5, 19);
  console.log(`   Found ${spriteStarts.length} sprite starts at positions: ${spriteStarts.slice(0, 12).join(', ')}`);
  console.log(`   Calculated unit size: ${unitSize.toFixed(2)}px per unit`);
  
  const spriteWidthPx = 5 * unitSize;
  const gapWidthPx = 19 * unitSize;
  const totalFrameWidthPx = spriteWidthPx + gapWidthPx;
  console.log(`   Sprite width: ${spriteWidthPx.toFixed(2)}px, Gap: ${gapWidthPx.toFixed(2)}px, Total per frame: ${totalFrameWidthPx.toFixed(2)}px`);

  // Split into frames using detected sprite starts
  // Start extraction before sprite begins to ensure empty space at the beginning
  // Each sprite is 5 units, gap is 19 units
  const emptySpaceBeforePx = unitSize * 2; // Add 2 units of empty space before each sprite
  
  for (let i = 0; i < finalFrameCount && i < spriteStarts.length; i++) {
    const spriteStart = spriteStarts[i];
    
    // Start extraction before the sprite begins to include empty space
    // Go back by emptySpaceBeforePx, but don't go before 0 or into previous frame
    let left = Math.max(0, Math.round(spriteStart - emptySpaceBeforePx));
    
    // For frames after the first, ensure we don't overlap with previous frame
    if (i > 0) {
      const prevSpriteStart = spriteStarts[i - 1];
      const prevFrameEnd = Math.round(prevSpriteStart + spriteWidthPx);
      left = Math.max(left, prevFrameEnd);
    }
    
    // Calculate right boundary: include full sprite width plus some padding
    // The frame should contain: empty space + sprite (5 units) + some padding
    let right = Math.round(spriteStart + spriteWidthPx + (unitSize * 1)); // 1 unit padding after sprite
    
    // For the last frame, extend to end of sprite sheet
    if (i === finalFrameCount - 1) {
      right = sheetWidth;
    } else if (i < spriteStarts.length - 1) {
      // For other frames, stop before the next sprite starts (leave gap)
      const nextSpriteStart = spriteStarts[i + 1];
      right = Math.min(right, Math.round(nextSpriteStart - (unitSize * 1))); // 1 unit before next sprite
    }
    
    let extractWidth = right - left;
    
    const frameNumber = String(i + 1).padStart(padding, '0');
    const outputPath = path.join(outputDir, `${framePrefix}-${frameNumber}.png`);

    // Ensure we don't exceed image bounds
    if (left >= sheetWidth || extractWidth <= 0) {
      console.warn(`   ⚠️  Skipping frame ${i + 1}: would exceed image bounds (left: ${left}, width: ${extractWidth})`);
      continue;
    }

    // Debug output
    if (i === 0 || i === 2 || i === 8 || i === 9 || i === 10 || i === 11) {
      const emptySpaceBefore = spriteStart - left;
      console.log(`   🔍 Frame ${i + 1}: spriteStart=${spriteStart}, left=${left} (${emptySpaceBefore.toFixed(1)}px empty before), width=${extractWidth}, right=${right}`);
    }

    // Clone the image for each extraction to avoid conflicts
    await sharp(spriteSheetPath)
      .extract({
        left,
        top: 0,
        width: extractWidth,
        height: sheetHeight,
      })
      .toFile(outputPath);

    console.log(`   ✅ Extracted frame ${i + 1}/${finalFrameCount}: ${path.basename(outputPath)}`);
  }

  console.log(`\n✨ Successfully split sprite sheet into ${finalFrameCount} frames!`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: tsx scripts/split-sprite-sheet.ts <sprite-sheet-path> <output-dir> <frame-width> [frame-count] [frame-prefix]');
  console.error('');
  console.error('Example:');
  console.error('  tsx scripts/split-sprite-sheet.ts public/FreeNinja/01-Ninja/Hit/yellowNinja-hit.png public/FreeNinja/01-Ninja/Hit 100');
  console.error('  tsx scripts/split-sprite-sheet.ts public/FreeNinja/01-Ninja/Idle/yellowNinja-idle.png public/FreeNinja/01-Ninja/Idle 100 8 "Idle-Body"');
  process.exit(1);
}

const [spriteSheetPath, outputDir, frameWidthStr, frameCountStr, framePrefix] = args;
const frameWidth = parseInt(frameWidthStr, 10);
const frameCount = frameCountStr ? parseInt(frameCountStr, 10) : undefined;

if (isNaN(frameWidth)) {
  console.error(`Error: Invalid frame width: ${frameWidthStr}`);
  process.exit(1);
}

if (frameCount !== undefined && isNaN(frameCount)) {
  console.error(`Error: Invalid frame count: ${frameCountStr}`);
  process.exit(1);
}

// Resolve paths relative to project root
// Get the project root by finding the directory containing package.json
// Start from the scripts directory and go up
function findProjectRoot(): string {
  let currentDir = path.dirname(__dirname); // Go up from scripts/ to project root
  const packageJsonPath = path.join(currentDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return currentDir;
  }
  // Fallback to process.cwd()
  return process.cwd();
}

const projectRoot = findProjectRoot();
const resolvedSpritePath = path.isAbsolute(spriteSheetPath)
  ? spriteSheetPath
  : path.resolve(projectRoot, spriteSheetPath);
const resolvedOutputDir = path.isAbsolute(outputDir)
  ? outputDir
  : path.resolve(projectRoot, outputDir);

if (!fs.existsSync(resolvedSpritePath)) {
  console.error(`Error: Sprite sheet not found: ${resolvedSpritePath}`);
  process.exit(1);
}

splitSpriteSheet({
  spriteSheetPath: resolvedSpritePath,
  outputDir: resolvedOutputDir,
  frameWidth,
  frameCount,
  framePrefix,
}).catch((error) => {
  console.error('Error splitting sprite sheet:', error);
  process.exit(1);
});

