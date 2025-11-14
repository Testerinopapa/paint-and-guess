/**
 * Avatar Customizer Crawl Test
 * 
 * Automatically clicks through all avatar customization options to find bugs.
 * Tests all tabs, options, buttons, and interactions.
 * 
 * Run with: npx tsx scripts/test-avatar-crawl.ts
 * 
 * Prerequisites:
 *   1. Start the dev server: npm run dev
 *   2. Install Playwright browsers: npx playwright install chromium
 */

import { chromium, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

interface TestResult {
  category: string;
  option: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
}

const TEST_RESULTS: TestResult[] = [];
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const DELAY_MS = 150; // Delay between clicks to allow UI to update
const SCREENSHOT_DIR = 'test-screenshots';

// Ensure screenshot directory exists
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

async function waitForCustomizer(page: Page): Promise<boolean> {
  try {
    // Wait for the customizer dialog to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    // Wait for tabs to be visible
    await page.waitForSelector('button[role="tab"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function openCustomizer(page: Page): Promise<boolean> {
  try {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try multiple selectors for the avatar button
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
      console.error('Could not find avatar button with any selector');
      return false;
    }

    await page.waitForTimeout(500);
    return await waitForCustomizer(page);
  } catch (error) {
    console.error('Failed to open customizer:', error);
    return false;
  }
}

async function clickAllOptionsInTab(
  page: Page, 
  tabName: string,
  allConsoleErrors: Array<{ type: string; text: string; timestamp: number }>
): Promise<void> {
  // Switch to the tab
  const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);
  if (!(await tab.isVisible())) {
    console.log(`  ⚠️  Tab "${tabName}" not visible, skipping`);
    return;
  }
  
  await tab.click();
  await page.waitForTimeout(400);

  // Find all clickable option buttons in OptionGrid (they're in a grid layout)
  // Look for buttons inside the dialog that are not tabs or action buttons
  const dialog = page.locator('[role="dialog"]');
  
  // Get all buttons that are likely options (in grids, not action buttons)
  const optionButtons = dialog.locator(
    'button:not([role="tab"]):not([aria-label*="Close"]):not([aria-label*="Cancel"]):not([aria-label*="Save"]):not([aria-label*="Randomize"]):not([aria-label*="Reset"])'
  );
  
  const count = await optionButtons.count();
  console.log(`  Found ${count} clickable options in ${tabName} tab`);

  if (count === 0) {
    console.log(`  ⚠️  No options found in ${tabName} tab`);
    return;
  }

  const clickedOptions = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    try {
      const option = optionButtons.nth(i);
      const isVisible = await option.isVisible();
      if (!isVisible) continue;

      const optionText = (await option.textContent() || `Option ${i}`).trim();
      
      // Skip if we've already clicked this option
      if (clickedOptions.has(optionText)) continue;
      clickedOptions.add(optionText);
      
      // Skip action buttons
      if (['Randomize', 'Reset', 'Save Avatar', 'Cancel', 'Close'].includes(optionText)) {
        continue;
      }
      
      // Scroll into view if needed
      await option.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);

      // Get initial preview state and error count
      const previewBefore = await page.locator('[role="img"], img[alt*="avatar" i]').count();
      const errorCountBefore = allConsoleErrors.length;

      // Click the option
      await option.click({ timeout: 3000 });
      await page.waitForTimeout(DELAY_MS);

      // Wait a bit for any async errors to appear
      await page.waitForTimeout(200);

      // Check if avatar preview still exists (didn't crash)
      const previewAfter = await page.locator('[role="img"], img[alt*="avatar" i]').count();
      const previewExists = previewAfter > 0;

      // Check for console errors that occurred during/after this click
      const errorCountAfter = allConsoleErrors.length;
      const newErrors = allConsoleErrors
        .slice(errorCountBefore)
        .map(e => e.text);

      const passed = previewExists && newErrors.length === 0;
      let error: string | undefined;
      
      if (previewBefore > 0 && previewAfter === 0) {
        error = 'Avatar preview disappeared after click';
      } else if (newErrors.length > 0) {
        error = `Console errors: ${newErrors.join('; ')}`;
      }

      TEST_RESULTS.push({
        category: tabName,
        option: optionText,
        passed,
        error,
      });

      if (!passed) {
        console.error(`  ❌ ${optionText} - ${error || 'Failed'}`);
        const safeName = optionText.replace(/[^a-zA-Z0-9]/g, '_');
        await page.screenshot({ 
          path: join(SCREENSHOT_DIR, `error-${tabName}-${safeName}-${i}.png`),
          fullPage: false
        });
      } else {
        console.log(`  ✅ ${optionText}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      TEST_RESULTS.push({
        category: tabName,
        option: `Option ${i}`,
        passed: false,
        error: errorMsg,
      });
      console.error(`  ❌ Option ${i} - ${errorMsg}`);
    }
  }
}

async function testColorPickers(page: Page, tabName: string): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  const colorInputs = dialog.locator('input[type="color"]');
  const count = await colorInputs.count();

  if (count === 0) return;

  console.log(`  Testing ${count} color picker(s)...`);

  for (let i = 0; i < count; i++) {
    try {
      const input = colorInputs.nth(i);
      if (!(await input.isVisible())) continue;
      
      await input.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      
      // Test a few color values
      const testColors = ['#FF0000', '#00FF00', '#0000FF'];
      for (const color of testColors) {
        await input.fill(color);
        await page.waitForTimeout(DELAY_MS);
        
        // Check preview still exists
        const previewExists = await page.locator('[role="img"], img[alt*="avatar" i]').count() > 0;
        if (!previewExists) {
          console.error(`  ❌ Color picker ${i} - Preview disappeared with color ${color}`);
          TEST_RESULTS.push({
            category: tabName,
            option: `Color Picker ${i} (${color})`,
            passed: false,
            error: 'Avatar preview disappeared',
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Color input ${i} error: ${errorMsg}`);
      TEST_RESULTS.push({
        category: tabName,
        option: `Color Picker ${i}`,
        passed: false,
        error: errorMsg,
      });
    }
  }
}

async function testButtons(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  const buttons = [
    { text: 'Randomize', selector: dialog.locator('button:has-text("Randomize")') },
    { text: 'Reset', selector: dialog.locator('button:has-text("Reset")') },
  ];

  for (const btn of buttons) {
    try {
      if (await btn.selector.isVisible({ timeout: 2000 })) {
        console.log(`  Testing ${btn.text} button...`);
        const previewBefore = await page.locator('[role="img"], img[alt*="avatar" i]').count();
        
        await btn.selector.click();
        await page.waitForTimeout(800);
        
        const previewAfter = await page.locator('[role="img"], img[alt*="avatar" i]').count();
        const passed = previewAfter > 0;
        
        TEST_RESULTS.push({
          category: 'Actions',
          option: btn.text,
          passed,
          error: previewBefore > 0 && previewAfter === 0 ? 'Avatar preview disappeared' : undefined,
        });
        
        if (passed) {
          console.log(`  ✅ ${btn.text} button works`);
        } else {
          console.error(`  ❌ ${btn.text} button - Preview disappeared`);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Button ${btn.text} error: ${errorMsg}`);
      TEST_RESULTS.push({
        category: 'Actions',
        option: btn.text,
        passed: false,
        error: errorMsg,
      });
    }
  }
}

async function crawlAvatarCustomizer() {
  console.log('🧪 Starting Avatar Customizer Crawl Test\n');
  console.log(`📍 Testing URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: 50 // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors and warnings globally
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
      // Also log to our console for visibility
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
    // Navigate to the app
    console.log('1. Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Open customizer
    console.log('2. Opening avatar customizer...');
    const opened = await openCustomizer(page);
    if (!opened) {
      throw new Error('Failed to open customizer');
    }
    console.log('   ✅ Customizer opened\n');

    // Get all tabs
    const tabs = page.locator('button[role="tab"]');
    const tabCount = await tabs.count();
    const tabNames: string[] = [];
    
    for (let i = 0; i < tabCount; i++) {
      const name = await tabs.nth(i).textContent();
      if (name) tabNames.push(name.trim());
    }

    console.log(`3. Found ${tabCount} tabs: ${tabNames.join(', ')}\n`);

    // Test each tab
    for (const tabName of tabNames) {
      console.log(`\n📋 Testing ${tabName} tab...`);
      await clickAllOptionsInTab(page, tabName, allConsoleErrors);
      await testColorPickers(page, tabName);
      await page.waitForTimeout(300);
    }

    // Test action buttons
    console.log('\n4. Testing action buttons...');
    await testButtons(page);

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
        console.log(`  - ${result.category} > ${result.option}`);
        if (result.error) console.log(`    Error: ${result.error}`);
      });
    }

    // Report console errors summary
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

    // Save results to file (include console errors in metadata)
    const resultsPath = 'test-results-avatar-crawl.json';
    const resultsAbsolutePath = resolve(resultsPath);
    const screenshotsAbsolutePath = resolve(SCREENSHOT_DIR);
    
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
          screenshotsDirectory: screenshotsAbsolutePath,
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
    console.log(`   Screenshots: ${screenshotsAbsolutePath}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    try {
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'failure.png') });
      console.log('📸 Screenshot saved to test-screenshots/failure.png');
    } catch (screenshotError) {
      console.error('Failed to save screenshot:', screenshotError);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
crawlAvatarCustomizer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});