/**
 * RPG Persistence Test
 * 
 * Tests the localStorage persistence for the Chronicles of the Abyss RPG game.
 * Verifies that game state is saved and restored correctly on page reload.
 * 
 * Run with: npx tsx scripts/test-rpg-persistence.ts
 * 
 * Prerequisites:
 *   1. Start the dev servers: npm run dev:all
 *   2. Install Playwright browsers: npx playwright install chromium
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface PersistenceTestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration?: number;
}

const TEST_RESULTS: PersistenceTestResult[] = [];
const BASE_URL = 'http://localhost:8080';
const RPG_ROUTE = '/games/chronicles-of-the-abyss';
const STORAGE_KEY = 'chronicles-of-the-abyss-save';

function logTest(test: string, passed: boolean, error?: string, details?: any, duration?: number) {
  const result: PersistenceTestResult = {
    test,
    passed,
    error,
    details,
    duration,
  };
  TEST_RESULTS.push(result);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const time = duration ? ` (${duration.toFixed(2)}ms)` : '';
  console.log(`${status} ${test}${time}`);
  if (error) {
    console.error(`  Error: ${error}`);
  }
  if (details) {
    console.log(`  Details:`, JSON.stringify(details, null, 2));
  }
}

async function waitForRpgStore(page: Page): Promise<boolean> {
  try {
    // Wait for the store to be available
    await page.waitForFunction(() => {
      return typeof (window as any).__RPG_DEBUG__ !== 'undefined';
    }, { timeout: 10000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function getRpgState(page: Page) {
  return await page.evaluate(() => {
    const debug = (window as any).__RPG_DEBUG__;
    if (!debug) return null;
    return {
      character: debug.getCharacter(),
      location: debug.getLocation(),
      inventory: debug.getState()?.inventory || [],
      quests: debug.getState()?.quests || [],
      availableCommands: debug.getCommands(),
    };
  });
}

async function getLocalStorageData(page: Page, key: string) {
  return await page.evaluate((storageKey) => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, key);
}

async function clearLocalStorage(page: Page, key: string) {
  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey);
  }, key);
}

async function testInitialState(page: Page): Promise<boolean> {
  console.log('\n📋 Test 1: Verify initial state (no saved data)');
  
  try {
    await clearLocalStorage(page, STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForRpgStore(page);
    
    const state = await getRpgState(page);
    
    if (!state) {
      logTest('Initial state exists', false, 'RPG state not found');
      return false;
    }
    
    const isInitial = 
      state.character.name === 'Wanderer' &&
      state.character.level === 5 &&
      state.location === 'Ruins of Eldrath' &&
      state.inventory.length === 0;
    
    logTest('Initial state loaded', isInitial, undefined, {
      character: state.character,
      location: state.location,
      inventorySize: state.inventory.length,
    });
    
    return isInitial;
  } catch (error) {
    logTest('Initial state test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testStatePersistence(page: Page): Promise<boolean> {
  console.log('\n💾 Test 2: Verify state persistence');
  
  try {
    // Clear storage first
    await clearLocalStorage(page, STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForRpgStore(page);
    
    // Perform some actions to change state
    await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      debug.submitCommand('Attack');
      debug.submitCommand('Rest');
      debug.submitCommand('Search for Treasure');
    });
    
    // Wait a bit for state to persist
    await page.waitForTimeout(500);
    
    // Get state before reload
    const stateBefore = await getRpgState(page);
    
    // Check localStorage has data
    const storedData = await getLocalStorageData(page, STORAGE_KEY);
    
    if (!storedData) {
      logTest('State saved to localStorage', false, 'No data in localStorage');
      return false;
    }
    
    const hasVersion = storedData.state?.version === 1;
    const hasCharacter = !!storedData.state?.character;
    const hasLocation = !!storedData.state?.location;
    
    logTest('State saved to localStorage', hasVersion && hasCharacter && hasLocation, undefined, {
      version: storedData.state?.version,
      hasCharacter,
      hasLocation,
      storageSize: JSON.stringify(storedData).length,
    });
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await waitForRpgStore(page);
    
    // Wait a bit for state to restore
    await page.waitForTimeout(500);
    
    // Get state after reload
    const stateAfter = await getRpgState(page);
    
    // Compare key fields
    const stateMatches = 
      stateBefore &&
      stateAfter &&
      stateBefore.character.level === stateAfter.character.level &&
      stateBefore.character.hp === stateAfter.character.hp &&
      stateBefore.character.xp === stateAfter.character.xp &&
      stateBefore.location === stateAfter.location &&
      stateBefore.inventory.length === stateAfter.inventory.length;
    
    logTest('State restored after reload', stateMatches, undefined, {
      before: {
        level: stateBefore?.character.level,
        hp: stateBefore?.character.hp,
        xp: stateBefore?.character.xp,
        location: stateBefore?.location,
        inventorySize: stateBefore?.inventory.length,
      },
      after: {
        level: stateAfter?.character.level,
        hp: stateAfter?.character.hp,
        xp: stateAfter?.character.xp,
        location: stateAfter?.location,
        inventorySize: stateAfter?.inventory.length,
      },
    });
    
    return stateMatches || false;
  } catch (error) {
    logTest('State persistence test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testResetClearsPersistence(page: Page): Promise<boolean> {
  console.log('\n🔄 Test 3: Verify reset clears persistence');
  
  try {
    // Clear storage and reload
    await clearLocalStorage(page, STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForRpgStore(page);
    
    // Perform some actions
    await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      debug.submitCommand('Attack');
      debug.submitCommand('Rest');
    });
    
    await page.waitForTimeout(500);
    
    // Check localStorage has data
    const storedBeforeReset = await getLocalStorageData(page, STORAGE_KEY);
    
    if (!storedBeforeReset) {
      logTest('State exists before reset', false, 'No data in localStorage before reset');
      return false;
    }
    
    // Call reset
    await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      debug.reset();
    });
    
    await page.waitForTimeout(500);
    
    // Check localStorage is cleared
    const storedAfterReset = await getLocalStorageData(page, STORAGE_KEY);
    
    const isCleared = !storedAfterReset || !storedAfterReset.state;
    
    logTest('Reset clears localStorage', isCleared, undefined, {
      beforeReset: !!storedBeforeReset,
      afterReset: !!storedAfterReset,
    });
    
    return isCleared;
  } catch (error) {
    logTest('Reset clears persistence test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testPersistenceInfo(page: Page): Promise<boolean> {
  console.log('\nℹ️  Test 4: Verify persistence info utility');
  
  try {
    // Clear storage first
    await clearLocalStorage(page, STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForRpgStore(page);
    
    // Check info when no persistence exists
    const infoBefore = await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      return debug.getPersistenceInfo();
    });
    
    const noPersistenceCorrect = !infoBefore.exists;
    
    logTest('Persistence info (no data)', noPersistenceCorrect, undefined, infoBefore);
    
    // Perform some actions
    await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      debug.submitCommand('Attack');
    });
    
    await page.waitForTimeout(500);
    
    // Check info when persistence exists
    const infoAfter = await page.evaluate(() => {
      const debug = (window as any).__RPG_DEBUG__;
      return debug.getPersistenceInfo();
    });
    
    const hasPersistenceCorrect = infoAfter.exists && infoAfter.version === 1;
    
    logTest('Persistence info (with data)', hasPersistenceCorrect, undefined, infoAfter);
    
    return noPersistenceCorrect && hasPersistenceCorrect;
  } catch (error) {
    logTest('Persistence info test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function runTests() {
  console.log('🎮 RPG Persistence Test Suite');
  console.log('=============================\n');
  
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  
  try {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate to RPG game page
    console.log(`Navigating to ${BASE_URL}${RPG_ROUTE}...`);
    await page.goto(`${BASE_URL}${RPG_ROUTE}`, { waitUntil: 'networkidle' });
    
    // Wait for RPG store to be available
    console.log('Waiting for RPG store to initialize...');
    const storeReady = await waitForRpgStore(page);
    if (!storeReady) {
      console.error('❌ RPG store not available after timeout');
      return;
    }
    
    console.log('✅ RPG store ready\n');
    
    // Run tests
    const test1 = await testInitialState(page);
    const test2 = await testStatePersistence(page);
    const test3 = await testResetClearsPersistence(page);
    const test4 = await testPersistenceInfo(page);
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    const passed = TEST_RESULTS.filter(r => r.passed).length;
    const total = TEST_RESULTS.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);
    
    // Save results
    const resultsPath = 'test-results-rpg-persistence.json';
    writeFileSync(
      resultsPath,
      JSON.stringify(TEST_RESULTS, null, 2)
    );
    console.log(`\n✅ Results saved to ${resultsPath}`);
    
    // Exit with error code if any tests failed
    if (passed < total) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

// Run tests
runTests().catch(console.error);














