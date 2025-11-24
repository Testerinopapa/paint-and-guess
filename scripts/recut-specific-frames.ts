/**
 * Recut specific frames from a sprite sheet
 * 
 * Usage:
 *   tsx scripts/recut-specific-frames.ts <sprite-sheet-path> <output-dir> <frame-width> <frame-numbers>
 * 
 * Example:
 *   tsx scripts/recut-specific-frames.ts public/Knight/01-Knight/Idle/Idle.png public/Knight/01-Knight/Idle 160 "3,9,10" "Idle-Body"
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findProjectRoot(): string {
  let currentDir = path.dirname(__dirname);
  const packageJsonPath = path.join(currentDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return currentDir;
  }
  return process.cwd();
}

const projectRoot = findProjectRoot();

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: tsx scripts/recut-specific-frames.ts <sprite-sheet-path> <output-dir> <frame-width> <frame-numbers> [frame-prefix]');
  console.error('Example: tsx scripts/recut-specific-frames.ts public/Knight/01-Knight/Idle/Idle.png public/Knight/01-Knight/Idle 160 "3,9,10" "Idle-Body"');
  process.exit(1);
}

const [spriteSheetPath, outputDir, frameWidthStr, frameNumbersStr, framePrefix = 'frame'] = args;
const frameWidth = parseFloat(frameWidthStr);
const frameNumbers = frameNumbersStr.split(',').map(n => parseInt(n.trim(), 10) - 1); // Convert to 0-based

if (isNaN(frameWidth)) {
  console.error(`Error: Invalid frame width: ${frameWidthStr}`);
  process.exit(1);
}

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

if (!fs.existsSync(resolvedOutputDir)) {
  fs.mkdirSync(resolvedOutputDir, { recursive: true });
}

async function recutFrames() {
  const metadata = await sharp(resolvedSpritePath).metadata();
  const sheetWidth = metadata.width!;
  const sheetHeight = metadata.height!;

  console.log(`📊 Sprite Sheet Info:`);
  console.log(`   Dimensions: ${sheetWidth}x${sheetHeight}px`);
  console.log(`   Frame Width: ${frameWidth}px`);
  console.log(`   Frames to recut: ${frameNumbers.map(n => n + 1).join(', ')}`);
  console.log(`   Output Directory: ${resolvedOutputDir}\n`);

  for (const frameIndex of frameNumbers) {
    const left = Math.round(frameIndex * frameWidth);
    const right = Math.round((frameIndex + 1) * frameWidth);
    const extractWidth = right - left;
    const frameNumber = String(frameIndex + 1).padStart(2, '0');
    const outputPath = path.join(resolvedOutputDir, `${framePrefix}-${frameNumber}.png`);

    if (left >= sheetWidth || extractWidth <= 0) {
      console.warn(`   ⚠️  Skipping frame ${frameIndex + 1}: would exceed image bounds`);
      continue;
    }

    console.log(`   🔍 Frame ${frameIndex + 1}: left=${left}, width=${extractWidth}, right=${right}`);

    await sharp(resolvedSpritePath)
      .extract({
        left,
        top: 0,
        width: extractWidth,
        height: sheetHeight,
      })
      .toFile(outputPath);

    console.log(`   ✅ Recut frame ${frameIndex + 1}/${frameNumbers.length}: ${path.basename(outputPath)}\n`);
  }

  console.log(`✨ Successfully recut ${frameNumbers.length} frames!`);
}

recutFrames().catch((error) => {
  console.error('Error recutting frames:', error);
  process.exit(1);
});




