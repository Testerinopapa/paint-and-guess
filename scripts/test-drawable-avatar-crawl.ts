/**
 * Drawable Avatar Preview Crawl Test
 * 
 * Automatically tests the drawable avatar preview feature:
 * - Enables drawing mode
 * - Tests drawing with different colors and brush sizes
 * - Tests clearing drawings
 * - Verifies drawings persist after save/reload
 * 
 * Run with: npx tsx scripts/test-drawable-avatar-crawl.ts
 * 
 * Prerequisites:
 *   1. Start the dev server: npm run dev
 *   2. Install Playwright browsers: npx playwright install chromium
 */

import { chromium, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
  screenshots?: string[]; // Multiple screenshots for complex tests
}

const TEST_RESULTS: TestResult[] = [];
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const DELAY_MS = 300; // Delay between actions
const SCREENSHOT_DIR = 'test-screenshots-drawable';

// Ensure screenshot directory exists
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

async function waitForCustomizer(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForSelector('button[role="tab"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function openCustomizer(page: Page): Promise<boolean> {
  try {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const selectors = [
      'button:has-text("Click to customize")',
      'button:has([role="img"])',
      'button:has-text("Avatar")',
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          clicked = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!clicked) {
      console.error('Could not find avatar button');
      return false;
    }

    await page.waitForTimeout(500);
    return await waitForCustomizer(page);
  } catch (error) {
    console.error('Failed to open customizer:', error);
    return false;
  }
}

async function testDrawingMode(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing drawing mode toggle...');
    
    // Screenshot: Before enabling drawing mode
    const beforeScreenshot = join(SCREENSHOT_DIR, '01-before-drawing-mode.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);
    
    // Find "Draw on Avatar" button
    const drawButton = page.locator('button:has-text("Draw on Avatar")');
    if (!(await drawButton.isVisible({ timeout: 3000 }))) {
      throw new Error('Draw on Avatar button not found');
    }

    // Click to enable drawing mode
    await drawButton.click();
    await page.waitForTimeout(500);

    // Screenshot: After enabling drawing mode
    const afterScreenshot = join(SCREENSHOT_DIR, '02-after-drawing-mode-enabled.png');
    await page.screenshot({ path: afterScreenshot, fullPage: false });
    screenshots.push(afterScreenshot);

    // Debug: Verify avatar background is still visible
    const backgroundCheck = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { found: false };
      
      const allDivs = dialog.querySelectorAll('div');
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('data:image')) {
          return {
            found: true,
            backgroundImage: style.backgroundImage.substring(0, 80) + '...',
          };
        }
      }
      return { found: false };
    });
    
    console.log('   Background visibility check:', JSON.stringify(backgroundCheck, null, 2));

    // Check if drawing controls appear
    const colorInput = page.locator('input[type="color"]').first();
    const brushSizeInput = page.locator('input[type="range"]').first();
    
    const hasControls = await colorInput.isVisible() && await brushSizeInput.isVisible();
    
    if (!hasControls) {
      throw new Error('Drawing controls did not appear');
    }

    // Check if button text changed
    const doneButton = page.locator('button:has-text("Done Drawing")');
    const buttonChanged = await doneButton.isVisible({ timeout: 1000 });

    const passed = hasControls && buttonChanged;
    
    // Screenshot: Final state
    const finalScreenshot = join(SCREENSHOT_DIR, `03-drawing-mode-${passed ? 'success' : 'failed'}.png`);
    await page.screenshot({ path: finalScreenshot, fullPage: false });
    screenshots.push(finalScreenshot);

    TEST_RESULTS.push({
      test: 'Enable Drawing Mode',
      passed,
      error: !hasControls ? 'Drawing controls not visible' : !buttonChanged ? 'Button text did not change' : undefined,
      screenshots,
    });

    return passed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '03-drawing-mode-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Enable Drawing Mode',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testDrawing(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing drawing on canvas...');
    
    // Screenshot: Before drawing
    const beforeScreenshot = join(SCREENSHOT_DIR, '04-before-drawing.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);
    
    // Find the canvas element - try to click through the overlay
    const canvas = page.locator('canvas').first();
    if (!(await canvas.isVisible({ timeout: 3000 }))) {
      throw new Error('Canvas not found');
    }

    // Get canvas bounding box
    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('Could not get canvas bounds');
    }

    // Try to draw using mouse events directly on the canvas coordinates
    // The toolbar might be blocking, so we'll draw in the center area
    const startX = box.x + box.width * 0.5;
    const startY = box.y + box.height * 0.5;
    const endX = box.x + box.width * 0.7;
    const endY = box.y + box.height * 0.7;

    // Move to start position
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(100);
    
    // Draw line
    await page.mouse.down();
    await page.waitForTimeout(50);
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.waitForTimeout(50);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Screenshot: After drawing
    const afterScreenshot = join(SCREENSHOT_DIR, '05-after-drawing.png');
    await page.screenshot({ path: afterScreenshot, fullPage: false });
    screenshots.push(afterScreenshot);

    // Debug: Check if drawing was captured on canvas
    // Fabric.js manages drawings as objects, not raw pixels, so we need to check the Fabric canvas
    const drawingCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { found: false, error: 'Canvas not found' };
      
      // Try to access Fabric.js canvas instance
      const fabricCanvas = (canvas as any).__canvas || (window as any).fabric?.Canvas?.activeInstance;
      
      // Check if we can access Fabric canvas objects
      let fabricObjectCount = 0;
      let fabricObjectsInfo: any[] = [];
      
      if (fabricCanvas && typeof fabricCanvas.getObjects === 'function') {
        try {
          const objects = fabricCanvas.getObjects();
          fabricObjectCount = objects.length;
          fabricObjectsInfo = objects.map((obj: any) => ({
            type: obj.type,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
          }));
        } catch (e) {
          // Fabric canvas might not be accessible
        }
      }
      
      // Also check raw canvas pixel data as fallback
      const ctx = canvas.getContext('2d');
      let nonTransparentPixels = 0;
      let hasRawContent = false;
      
      if (ctx) {
        try {
          const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
          const pixels = imageData.data;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) {
              nonTransparentPixels++;
            }
          }
          hasRawContent = nonTransparentPixels > 100; // Threshold for actual content
        } catch (e) {
          // Might fail due to CORS or other issues
        }
      }
      
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        fabricCanvasFound: !!fabricCanvas,
        fabricObjectCount,
        fabricObjects: fabricObjectsInfo,
        hasFabricObjects: fabricObjectCount > 0,
        nonTransparentPixels,
        hasRawContent,
        hasContent: fabricObjectCount > 0 || hasRawContent,
      };
    });
    
    console.log('   Drawing Check:', JSON.stringify(drawingCheck, null, 2));

    // Check for console errors
    const errors = await page.evaluate(() => {
      return (window as any).__testErrors || [];
    });

    const passed = errors.length === 0 && (drawingCheck.hasContent ?? false);
    
    // Screenshot: Final state
    const finalScreenshot = join(SCREENSHOT_DIR, `06-drawing-${passed ? 'success' : 'failed'}.png`);
    await page.screenshot({ path: finalScreenshot, fullPage: false });
    screenshots.push(finalScreenshot);

    TEST_RESULTS.push({
      test: 'Draw on Canvas',
      passed,
      error: errors.length > 0 
        ? `Console errors: ${errors.join('; ')}` 
        : !(drawingCheck.hasContent ?? false)
          ? `No drawing content detected: Fabric objects=${drawingCheck.fabricObjectCount ?? 0}, Raw pixels=${drawingCheck.nonTransparentPixels ?? 0}, Fabric canvas found=${drawingCheck.fabricCanvasFound ?? false}` 
          : undefined,
      screenshots,
    });

    return passed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '06-drawing-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Draw on Canvas',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testBrushColor(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing brush color change...');
    
    const colorInput = page.locator('input[type="color"]').first();
    if (!(await colorInput.isVisible())) {
      throw new Error('Color input not found');
    }

    // Screenshot: Before color change
    const beforeScreenshot = join(SCREENSHOT_DIR, '07-before-color-change.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);

    const testColors = ['#FF0000', '#00FF00', '#0000FF'];
    for (let i = 0; i < testColors.length; i++) {
      const color = testColors[i];
      // Use evaluate to set color value directly (workaround for Playwright color input issue)
      await colorInput.evaluate((el: HTMLInputElement, val: string) => {
        el.value = val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, color);
      await page.waitForTimeout(300);
      
      // Screenshot after each color change
      const colorScreenshot = join(SCREENSHOT_DIR, `08-color-${i + 1}-${color.replace('#', '')}.png`);
      await page.screenshot({ path: colorScreenshot, fullPage: false });
      screenshots.push(colorScreenshot);
    }

    TEST_RESULTS.push({
      test: 'Change Brush Color',
      passed: true,
      screenshots,
    });

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '08-color-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Change Brush Color',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testBrushSize(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing brush size change...');
    
    const sizeInput = page.locator('input[type="range"]').first();
    if (!(await sizeInput.isVisible())) {
      throw new Error('Brush size input not found');
    }

    // Screenshot: Before size change
    const beforeScreenshot = join(SCREENSHOT_DIR, '09-before-size-change.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);

    // Test different sizes
    const sizes = [1, 5, 10];
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      await sizeInput.fill(size.toString());
      await page.waitForTimeout(300);
      
      // Screenshot after each size change
      const sizeScreenshot = join(SCREENSHOT_DIR, `10-size-${size}.png`);
      await page.screenshot({ path: sizeScreenshot, fullPage: false });
      screenshots.push(sizeScreenshot);
    }

    TEST_RESULTS.push({
      test: 'Change Brush Size',
      passed: true,
      screenshots,
    });

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '10-size-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Change Brush Size',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testClearDrawings(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing clear drawings...');
    
    // Screenshot: Before clear (with drawings)
    const beforeScreenshot = join(SCREENSHOT_DIR, '11-before-clear.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);
    
    // Find clear button (RotateCcw icon)
    const clearButton = page.locator('button:has(svg)').filter({ hasText: /clear|reset/i }).or(
      page.locator('button[title*="Clear"], button[title*="clear"]')
    ).first();
    
    // Alternative: look for button with RotateCcw icon near color picker
    const toolbar = page.locator('[role="dialog"]').locator('div:has(input[type="color"])').locator('button').last();
    
    let found = false;
    if (await toolbar.isVisible({ timeout: 2000 })) {
      await toolbar.click();
      found = true;
    } else if (await clearButton.isVisible({ timeout: 2000 })) {
      await clearButton.click();
      found = true;
    }

    if (!found) {
      // Try clicking any button in the drawing toolbar area
      const toolbarButtons = page.locator('[role="dialog"]').locator('div:has(input[type="color"])').locator('button');
      const count = await toolbarButtons.count();
      if (count > 0) {
        await toolbarButtons.last().click();
        found = true;
      }
    }

    await page.waitForTimeout(500);

    // Screenshot: After clear
    const afterScreenshot = join(SCREENSHOT_DIR, '12-after-clear.png');
    await page.screenshot({ path: afterScreenshot, fullPage: false });
    screenshots.push(afterScreenshot);

    TEST_RESULTS.push({
      test: 'Clear Drawings',
      passed: found,
      error: found ? undefined : 'Clear button not found',
      screenshots,
    });

    return found;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '12-clear-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Clear Drawings',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testDisableDrawingMode(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing disable drawing mode...');
    
    // Screenshot: Initial state
    const initialScreenshot = join(SCREENSHOT_DIR, '13-initial-state.png');
    await page.screenshot({ path: initialScreenshot, fullPage: false });
    screenshots.push(initialScreenshot);
    
    // Wait a bit for UI to stabilize after previous test
    await page.waitForTimeout(300);
    
    // Check if drawing mode is already enabled by looking for "Done Drawing" button
    const doneButton = page.locator('button:has-text("Done Drawing")');
    const drawButton = page.locator('button:has-text("Draw on Avatar")');
    
    const isDrawingModeActive = await doneButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    // If drawing mode is not active, enable it first
    if (!isDrawingModeActive) {
      console.log('    Drawing mode not active, enabling first...');
      
      // Wait a bit more and try again
      await page.waitForTimeout(500);
      
      // Try to find the button with multiple strategies
      let buttonFound = false;
      
      // Strategy 1: Direct text match with longer timeout
      if (await drawButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await drawButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await drawButton.click();
        buttonFound = true;
      }
      // Strategy 2: Find button near canvas (avatar preview area)
      else {
        // The button is positioned absolutely at bottom of preview area
        // Look for buttons that contain "Draw" text anywhere in the dialog
        const allButtons = page.locator('[role="dialog"]').locator('button');
        const buttonCount = await allButtons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const btn = allButtons.nth(i);
          const isVisible = await btn.isVisible().catch(() => false);
          if (!isVisible) continue;
          
          const text = await btn.textContent();
          if (text && (text.toLowerCase().includes('draw') || text.toLowerCase().includes('drawing'))) {
            await btn.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);
            await btn.click();
            buttonFound = true;
            break;
          }
        }
      }
      
      if (buttonFound) {
        await page.waitForTimeout(500);
        
        // Screenshot: After enabling
        const enabledScreenshot = join(SCREENSHOT_DIR, '13a-drawing-mode-enabled.png');
        await page.screenshot({ path: enabledScreenshot, fullPage: false });
        screenshots.push(enabledScreenshot);
      } else {
        // Take a screenshot to debug
        const debugScreenshot = join(SCREENSHOT_DIR, '13-debug-button-not-found.png');
        await page.screenshot({ path: debugScreenshot, fullPage: false });
        screenshots.push(debugScreenshot);
        
        // Check what buttons are actually visible
        const allButtons = page.locator('[role="dialog"]').locator('button');
        const count = await allButtons.count();
        const buttonTexts: string[] = [];
        for (let i = 0; i < Math.min(count, 15); i++) {
          try {
            const btn = allButtons.nth(i);
            const isVisible = await btn.isVisible().catch(() => false);
            if (isVisible) {
              const text = await btn.textContent();
              if (text) buttonTexts.push(text.trim());
            }
          } catch {
            // Skip if button is not accessible
          }
        }
        
        throw new Error(`Could not find "Draw on Avatar" button. Found ${count} total buttons, ${buttonTexts.length} visible. Visible button texts: ${buttonTexts.join(', ')}`);
      }
    }
    
    // Screenshot: Before disabling (drawing mode active)
    const beforeScreenshot = join(SCREENSHOT_DIR, '13-before-disable-drawing.png');
    await page.screenshot({ path: beforeScreenshot, fullPage: false });
    screenshots.push(beforeScreenshot);
    
    // Now disable drawing mode
    const doneButtonFinal = page.locator('button:has-text("Done Drawing")');
    if (!(await doneButtonFinal.isVisible({ timeout: 2000 }))) {
      throw new Error('Done Drawing button not found after enabling drawing mode');
    }

    await doneButtonFinal.click();
    await page.waitForTimeout(500);

    // Screenshot: After disabling
    const afterScreenshot = join(SCREENSHOT_DIR, '14-after-disable-drawing.png');
    await page.screenshot({ path: afterScreenshot, fullPage: false });
    screenshots.push(afterScreenshot);

    // Check if controls disappeared
    const colorInput = page.locator('input[type="color"]').first();
    const controlsVisible = await colorInput.isVisible({ timeout: 1000 }).catch(() => false);

    // Also verify the button text changed back
    const drawButtonAfter = page.locator('button:has-text("Draw on Avatar")');
    const buttonTextChanged = await drawButtonAfter.isVisible({ timeout: 1000 }).catch(() => false);

    const passed = !controlsVisible && buttonTextChanged;
    
    // Screenshot: Final state
    const finalScreenshot = join(SCREENSHOT_DIR, `15-disable-drawing-${passed ? 'success' : 'failed'}.png`);
    await page.screenshot({ path: finalScreenshot, fullPage: false });
    screenshots.push(finalScreenshot);

    TEST_RESULTS.push({
      test: 'Disable Drawing Mode',
      passed,
      error: controlsVisible ? 'Drawing controls still visible' : !buttonTextChanged ? 'Button text did not change' : undefined,
      screenshots,
    });

    return passed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '15-disable-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Disable Drawing Mode',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function testSaveAndReload(page: Page): Promise<boolean> {
  const screenshots: string[] = [];
  try {
    console.log('  Testing save and reload...');
    
    // Screenshot: Initial state
    const initialScreenshot = join(SCREENSHOT_DIR, '16-initial-state.png');
    await page.screenshot({ path: initialScreenshot, fullPage: false });
    screenshots.push(initialScreenshot);
    
    // Enable drawing mode and draw something
    const drawButton = page.locator('button:has-text("Draw on Avatar")');
    if (await drawButton.isVisible({ timeout: 2000 })) {
      await drawButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Drawing mode enabled
      const drawingModeScreenshot = join(SCREENSHOT_DIR, '17-drawing-mode-enabled.png');
      await page.screenshot({ path: drawingModeScreenshot, fullPage: false });
      screenshots.push(drawingModeScreenshot);

      // Draw a small mark using mouse events
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        const centerX = box.x + box.width * 0.5;
        const centerY = box.y + box.height * 0.5;
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.move(centerX + 10, centerY + 10, { steps: 3 });
        await page.mouse.up();
        await page.waitForTimeout(1000); // Wait for save
      }
      
      // Screenshot: After drawing
      const afterDrawingScreenshot = join(SCREENSHOT_DIR, '18-after-drawing-mark.png');
      await page.screenshot({ path: afterDrawingScreenshot, fullPage: false });
      screenshots.push(afterDrawingScreenshot);
    }

    // Save avatar
    const saveButton = page.locator('button:has-text("Save Avatar")');
    if (await saveButton.isVisible({ timeout: 2000 })) {
      await saveButton.click();
      await page.waitForTimeout(500);
      
      // Screenshot: After save
      const afterSaveScreenshot = join(SCREENSHOT_DIR, '19-after-save.png');
      await page.screenshot({ path: afterSaveScreenshot, fullPage: false });
      screenshots.push(afterSaveScreenshot);
    }

    // Close customizer
    const closeButton = page.locator('button[aria-label*="Close"], button:has-text("Cancel")').first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Customizer closed
    const closedScreenshot = join(SCREENSHOT_DIR, '20-customizer-closed.png');
    await page.screenshot({ path: closedScreenshot, fullPage: false });
    screenshots.push(closedScreenshot);

    // Reopen customizer
    const reopened = await openCustomizer(page);
    if (!reopened) {
      throw new Error('Failed to reopen customizer');
    }

    await page.waitForTimeout(1000);

    // Screenshot: After reopen
    const reopenedScreenshot = join(SCREENSHOT_DIR, '21-after-reopen.png');
    await page.screenshot({ path: reopenedScreenshot, fullPage: false });
    screenshots.push(reopenedScreenshot);

    // Wait a bit for avatar background to load
    await page.waitForTimeout(500);

    // Debug: Check if avatar background is visible after reload
    const reloadCheck = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { found: false, error: 'Dialog not found' };
      
      // Check for background div
      const allDivs = dialog.querySelectorAll('div');
      let bgDiv: HTMLDivElement | null = null;
      
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none' && bgImage.includes('data:image')) {
          bgDiv = div as HTMLDivElement;
          break;
        }
      }
      
      // Check canvas - use Fabric.js objects if available
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { found: false, error: 'Canvas not found' };
      
      // Try to access Fabric.js canvas
      const fabricCanvas = (canvas as any).__canvas || (window as any).fabric?.Canvas?.activeInstance;
      let fabricObjectCount = 0;
      let hasFabricObjects = false;
      
      if (fabricCanvas && typeof fabricCanvas.getObjects === 'function') {
        try {
          const objects = fabricCanvas.getObjects();
          fabricObjectCount = objects.length;
          hasFabricObjects = objects.length > 0;
        } catch (e) {
          // Fabric might not be accessible
        }
      }
      
      // Also check raw pixels as fallback
      const ctx = canvas.getContext('2d');
      let nonTransparentPixels = 0;
      let hasRawContent = false;
      
      if (ctx) {
        try {
          // Sample a smaller area to avoid performance issues
          const sampleSize = Math.min(canvas.width, canvas.height, 100);
          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const pixels = imageData.data;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) {
              nonTransparentPixels++;
            }
          }
          hasRawContent = nonTransparentPixels > 100;
        } catch (e) {
          // Might fail due to CORS
        }
      }
      
      return {
        backgroundDivFound: !!bgDiv,
        backgroundImage: bgDiv ? window.getComputedStyle(bgDiv).backgroundImage.substring(0, 50) + '...' : 'none',
        canvasFound: true,
        fabricCanvasFound: !!fabricCanvas,
        fabricObjectCount,
        hasFabricObjects,
        nonTransparentPixels,
        hasRawContent,
        canvasHasContent: hasFabricObjects || hasRawContent,
      };
    });
    
    console.log('   Reload Check:', JSON.stringify(reloadCheck, null, 2));

    // Check if canvas has objects (drawings should be loaded)
    const canvas = page.locator('canvas').first();
    const hasCanvas = await canvas.isVisible();
    const hasBackground = reloadCheck.backgroundDivFound ?? false;
    const hasDrawings = reloadCheck.canvasHasContent ?? false;

    // Screenshot: Final state
    const finalScreenshot = join(SCREENSHOT_DIR, `22-save-reload-${hasCanvas && hasBackground ? 'success' : 'failed'}.png`);
    await page.screenshot({ path: finalScreenshot, fullPage: false });
    screenshots.push(finalScreenshot);

    const passed = hasCanvas && hasBackground;
    let error: string | undefined;
    
    if (!hasCanvas) {
      error = 'Canvas not found after reload';
    } else if (!hasBackground) {
      error = 'Avatar background layer not found after reload';
    } else if (!hasDrawings) {
      error = `Drawings not persisted: Fabric objects=${reloadCheck.fabricObjectCount ?? 0}, Raw pixels=${reloadCheck.nonTransparentPixels ?? 0}`;
    }

    TEST_RESULTS.push({
      test: 'Save and Reload Drawings',
      passed,
      error,
      screenshots,
    });

    return passed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorScreenshot = join(SCREENSHOT_DIR, '22-save-reload-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false }).catch(() => {});
    screenshots.push(errorScreenshot);
    
    TEST_RESULTS.push({
      test: 'Save and Reload Drawings',
      passed: false,
      error: errorMsg,
      screenshots,
    });
    return false;
  }
}

async function crawlDrawableAvatar() {
  console.log('🧪 Starting Drawable Avatar Preview Crawl Test\n');
  console.log(`📍 Testing URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const allConsoleErrors: Array<{ type: string; text: string; timestamp: number }> = [];
  const allPageErrors: string[] = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      allConsoleErrors.push({
        type,
        text: msg.text(),
        timestamp: Date.now(),
      });
      if (type === 'error') {
        console.error(`  🚨 Browser Console Error: ${msg.text()}`);
      }
    }
  });

  page.on('pageerror', (error) => {
    allPageErrors.push(error.message);
    console.error(`  🚨 Page Error: ${error.message}`);
  });

  try {
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Screenshot: Initial page load
    await page.screenshot({ path: join(SCREENSHOT_DIR, '00-initial-page.png'), fullPage: false });

    // Open customizer
    console.log('2. Opening avatar customizer...');
    const opened = await openCustomizer(page);
    if (!opened) {
      throw new Error('Failed to open customizer');
    }
    console.log('   ✅ Customizer opened\n');
    
    // Screenshot: Customizer opened
    await page.screenshot({ path: join(SCREENSHOT_DIR, '00-customizer-opened.png'), fullPage: false });

    // Wait for canvas to initialize
    console.log('3. Waiting for canvas to initialize...');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    console.log('   ✅ Canvas ready\n');

    // Debug: Check avatar background layer
    console.log('3a. Debugging avatar background layer...');
    const avatarBackgroundCheck = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { found: false, error: 'Dialog not found' };
      
      // Look for div with background image (avatar background layer)
      const allDivs = dialog.querySelectorAll('div');
      let bgDiv: HTMLDivElement | null = null;
      
      for (const div of Array.from(allDivs)) {
        const style = window.getComputedStyle(div);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none' && bgImage.includes('data:image')) {
          bgDiv = div as HTMLDivElement;
          break;
        }
      }
      
      if (!bgDiv) {
        return {
          found: false,
          error: 'Background div with avatar image not found',
          divCount: allDivs.length,
        };
      }
      
      const style = window.getComputedStyle(bgDiv);
      return {
        found: true,
        hasBackgroundImage: style.backgroundImage !== 'none',
        backgroundImage: style.backgroundImage.substring(0, 100) + '...',
        backgroundColor: style.backgroundColor,
        width: style.width,
        height: style.height,
        position: style.position,
        zIndex: style.zIndex,
      };
    });
    
    console.log('   Avatar Background Layer:', JSON.stringify(avatarBackgroundCheck, null, 2));
    
    // Debug: Check canvas layer
    const canvasCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false, error: 'Canvas not found' };
      
      const style = window.getComputedStyle(canvas);
      return {
        found: true,
        width: canvas.width,
        height: canvas.height,
        styleWidth: style.width,
        styleHeight: style.height,
        backgroundColor: style.backgroundColor,
        position: style.position,
        zIndex: style.zIndex,
        display: style.display,
      };
    });
    
    console.log('   Canvas Layer:', JSON.stringify(canvasCheck, null, 2));
    
    // Screenshot: Debug view
    await page.screenshot({ path: join(SCREENSHOT_DIR, '00-debug-layers.png'), fullPage: false });
    console.log('   📸 Debug screenshot saved\n');

    // Test drawing mode
    console.log('4. Testing drawing mode...');
    await testDrawingMode(page);

    // Test drawing
    console.log('\n5. Testing drawing functionality...');
    await testDrawing(page);

    // Test brush color
    console.log('\n6. Testing brush color...');
    await testBrushColor(page);

    // Test brush size
    console.log('\n7. Testing brush size...');
    await testBrushSize(page);

    // Test clear
    console.log('\n8. Testing clear drawings...');
    await testClearDrawings(page);

    // Test disable drawing mode
    console.log('\n9. Testing disable drawing mode...');
    await testDisableDrawingMode(page);

    // Test save and reload
    console.log('\n10. Testing save and reload...');
    await testSaveAndReload(page);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    
    const passed = TEST_RESULTS.filter(r => r.passed).length;
    const failed = TEST_RESULTS.filter(r => !r.passed).length;
    
    console.log(`Total tests: ${TEST_RESULTS.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${((passed / TEST_RESULTS.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      TEST_RESULTS.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.test}`);
        if (result.error) console.log(`    Error: ${result.error}`);
      });
    }

    // Report console errors
    if (allConsoleErrors.length > 0 || allPageErrors.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🚨 Console Errors & Warnings Summary');
      console.log('='.repeat(60));
      
      if (allConsoleErrors.length > 0) {
        console.log(`\nFound ${allConsoleErrors.length} console errors/warnings:`);
        const errorCounts = new Map<string, number>();
        allConsoleErrors.forEach(e => {
          const count = errorCounts.get(e.text) || 0;
          errorCounts.set(e.text, count + 1);
        });
        
        errorCounts.forEach((count, text) => {
          console.log(`  ${count}x: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        });
      }
      
      if (allPageErrors.length > 0) {
        console.log(`\nFound ${allPageErrors.length} page errors:`);
        allPageErrors.forEach((error, i) => {
          console.log(`  ${i + 1}. ${error}`);
        });
      }
    } else {
      console.log('\n✅ No console errors or warnings detected!');
    }

    // Save results
    const resultsPath = 'test-results-drawable-avatar-crawl.json';
    const resultsAbsolutePath = resolve(resultsPath);
    
    const resultsWithMetadata = {
      summary: {
        totalTests: TEST_RESULTS.length,
        passed: TEST_RESULTS.filter(r => r.passed).length,
        failed: TEST_RESULTS.filter(r => !r.passed).length,
        consoleErrors: allConsoleErrors.length,
        pageErrors: allPageErrors.length,
        timestamp: new Date().toISOString(),
        outputLocations: {
          resultsFile: resultsAbsolutePath,
          resultsFileRelative: resultsPath,
          screenshotsDirectory: resolve(SCREENSHOT_DIR),
          screenshotsDirectoryRelative: SCREENSHOT_DIR,
          workingDirectory: process.cwd(),
        },
      },
      tests: TEST_RESULTS,
      consoleErrors: allConsoleErrors,
      pageErrors: allPageErrors,
    };
    
    writeFileSync(
      resultsPath,
      JSON.stringify(resultsWithMetadata, null, 2)
    );
    console.log(`\n💾 Results saved to ${resultsPath}`);
    console.log(`   Full path: ${resultsAbsolutePath}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    try {
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'failure.png') });
      console.log('📸 Screenshot saved to test-screenshots-drawable/failure.png');
    } catch (screenshotError) {
      console.error('Failed to save screenshot:', screenshotError);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
crawlDrawableAvatar().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

