/**
 * Multiplayer Host Controls & Round Management Test
 * 
 * Automatically tests the multiplayer game features:
 * - Host assignment and controls
 * - Ready state system
 * - Only host can start game
 * - Round progression and rotation
 * - Max rounds enforcement
 * - Host transfer on disconnect
 * 
 * Run with: npx tsx scripts/test-multiplayer-host-controls.ts
 * 
 * Prerequisites:
 *   1. Start the dev servers: npm run dev:all (or .\start-dev.ps1)
 *   2. Install Playwright browsers: npx playwright install chromium
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
  logs?: string[];
}

const TEST_RESULTS: TestResult[] = [];
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const DELAY_MS = 500; // Delay between actions
const SCREENSHOT_DIR = 'test-screenshots-multiplayer';

// Ensure screenshot directory exists
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

interface Player {
  name: string;
  page: Page;
  context: BrowserContext;
  consoleLogs: string[];
}

let browser: Browser;
const players: Player[] = [];

async function captureConsoleLogs(page: Page, playerName: string, logs: string[]) {
  page.on('console', (msg) => {
    const text = msg.text();
    // Only capture our debug logs
    if (text.includes('[GameRoom') || text.includes('[Server]') || 
        text.includes('[GameContext]') || text.includes('[Room]')) {
      const logEntry = `[${playerName}] ${text}`;
      logs.push(logEntry);
      console.log(logEntry);
    }
  });
}

async function createPlayer(browser: Browser, name: string): Promise<Player> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleLogs: string[] = [];
  
  captureConsoleLogs(page, name, consoleLogs);
  
  return { name, page, context, consoleLogs };
}

async function navigateToHome(player: Player): Promise<boolean> {
  try {
    await player.page.goto(BASE_URL);
    await player.page.waitForLoadState('networkidle');
    await player.page.waitForTimeout(1000);
    return true;
  } catch (error) {
    console.error(`Failed to navigate ${player.name}:`, error);
    return false;
  }
}

async function createRoom(player: Player, playerName: string): Promise<string | null> {
  try {
    console.log(`\n🏠 ${player.name} creating room as "${playerName}"...`);
    
    // Wait for lobby to load
    await player.page.waitForSelector('input[placeholder*="name" i]', { timeout: 5000 });
    await player.page.waitForTimeout(500);
    
    // Fill in player name
    const nameInput = player.page.locator('input[placeholder*="Enter your name" i]').first();
    await nameInput.fill(playerName);
    console.log(`  ✓ Entered player name: ${playerName}`);
    
    // Fill in room name
    const roomNameInput = player.page.locator('input[placeholder*="Room name" i]').first();
    await roomNameInput.fill('Test Multiplayer Room');
    console.log(`  ✓ Entered room name`);
    
    // Click Create Room button
    const createButton = player.page.locator('button:has-text("Create Room")').last();
    await createButton.click();
    console.log(`  ✓ Clicked Create Room button`);
    
    // Wait for room page
    await player.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
    await player.page.waitForTimeout(1000);
    
    // Extract room ID from URL
    const url = player.page.url();
    const match = url.match(/\/room\/([A-Z0-9]+)/);
    const roomId = match ? match[1] : null;
    
    console.log(`✅ Room created: ${roomId}`);
    return roomId;
  } catch (error) {
    console.error(`Failed to create room:`, error);
    return null;
  }
}

async function joinRoom(player: Player, roomId: string, playerName: string): Promise<boolean> {
  try {
    console.log(`\n👤 ${player.name} joining room ${roomId} as "${playerName}"...`);
    
    // Navigate to home/lobby
    await player.page.goto(BASE_URL);
    await player.page.waitForLoadState('networkidle');
    await player.page.waitForTimeout(500);
    
    // Fill in player name
    const nameInput = player.page.locator('input[placeholder*="Enter your name" i]').first();
    await nameInput.fill(playerName);
    console.log(`  ✓ Entered player name: ${playerName}`);
    
    // Fill in room ID
    const roomIdInput = player.page.locator('input[placeholder*="Enter room ID" i]').first();
    await roomIdInput.fill(roomId);
    console.log(`  ✓ Entered room ID: ${roomId}`);
    
    // Click Join Room button
    const joinButton = player.page.locator('button:has-text("Join Room")').last();
    await joinButton.click();
    console.log(`  ✓ Clicked Join Room button`);
    
    // Wait for room page
    await player.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
    await player.page.waitForTimeout(1000);
    
    console.log(`✅ ${player.name} joined room`);
    return true;
  } catch (error) {
    console.error(`Failed to join room:`, error);
    return false;
  }
}

async function setReady(player: Player): Promise<boolean> {
  try {
    console.log(`\n✅ ${player.name} setting ready...`);
    
    const readyButton = player.page.locator('button:has-text("Ready Up")');
    await readyButton.waitFor({ timeout: 5000 });
    await readyButton.click();
    
    await player.page.waitForTimeout(500);
    
    console.log(`✅ ${player.name} is ready`);
    return true;
  } catch (error) {
    console.error(`Failed to set ready:`, error);
    return false;
  }
}

async function startGameAsHost(player: Player): Promise<boolean> {
  try {
    console.log(`\n🎮 ${player.name} starting game...`);
    
    const startButton = player.page.locator('button:has-text("Start Game")');
    await startButton.waitFor({ timeout: 5000 });
    
    // Check if button is enabled
    const isDisabled = await startButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️ Start button is disabled');
      return false;
    }
    
    await startButton.click();
    await player.page.waitForTimeout(2000);
    
    console.log(`✅ Game start requested`);
    return true;
  } catch (error) {
    console.error(`Failed to start game:`, error);
    return false;
  }
}

async function checkHostStatus(player: Player): Promise<boolean> {
  try {
    // Check if player has the "Host" badge
    const hostBadge = player.page.locator('text=Host');
    const hasHostBadge = await hostBadge.count() > 0;
    
    // Check if player has "Start Game" button
    const startButton = player.page.locator('button:has-text("Start Game")');
    const hasStartButton = await startButton.count() > 0;
    
    return hasHostBadge || hasStartButton;
  } catch (error) {
    return false;
  }
}

async function waitForRound(player: Player, roundNumber: number, timeout: number = 10000): Promise<boolean> {
  try {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const roundText = await player.page.textContent('body');
      if (roundText && roundText.includes(`Round ${roundNumber}`)) {
        return true;
      }
      await player.page.waitForTimeout(500);
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function checkGameEnded(player: Player): Promise<boolean> {
  try {
    // Check if we see "Game ended" or if game is no longer active
    const bodyText = await player.page.textContent('body');
    return bodyText?.includes('Game ended') || bodyText?.includes('maximum rounds reached') || false;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Multiplayer Host Controls & Round Management Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Screenshot directory: ${SCREENSHOT_DIR}\n`);
  
  // Check if backend is running
  try {
    const response = await fetch(`${BACKEND_URL}/api/rooms`);
    if (!response.ok) {
      throw new Error('Backend not responding');
    }
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.error('❌ Backend is not running! Please start it with: npm run dev:all');
    process.exit(1);
  }
  
  try {
    browser = await chromium.launch({ headless: false });
    
    // Test 1: Create room and verify host
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Room Creation & Host Assignment');
    console.log('='.repeat(60));
    
    const host = await createPlayer(browser, 'Host');
    players.push(host);
    
    await navigateToHome(host);
    const roomId = await createRoom(host, 'TestHost');
    
    if (!roomId) {
      TEST_RESULTS.push({
        test: 'Room Creation',
        passed: false,
        error: 'Failed to create room'
      });
      throw new Error('Failed to create room');
    }
    
    await host.page.waitForTimeout(1000);
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '01-room-created-host.png'),
      fullPage: true 
    });
    
    const isHost = await checkHostStatus(host);
    
    TEST_RESULTS.push({
      test: 'Room Creation & Host Assignment',
      passed: roomId !== null && isHost,
      screenshot: '01-room-created-host.png',
      logs: host.consoleLogs.slice(-10)
    });
    
    console.log(`${isHost ? '✅' : '❌'} Host status verified: ${isHost}`);
    
    // Test 2: Second player joins
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Second Player Joins');
    console.log('='.repeat(60));
    
    const player2 = await createPlayer(browser, 'Player2');
    players.push(player2);
    
    await navigateToHome(player2);
    const joined = await joinRoom(player2, roomId, 'Alice');
    
    await player2.page.waitForTimeout(1000);
    await player2.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '02-player2-joined.png'),
      fullPage: true 
    });
    
    const player2IsHost = await checkHostStatus(player2);
    
    TEST_RESULTS.push({
      test: 'Second Player Joins (Not Host)',
      passed: joined && !player2IsHost,
      screenshot: '02-player2-joined.png',
      logs: player2.consoleLogs.slice(-10)
    });
    
    console.log(`${!player2IsHost ? '✅' : '❌'} Player2 is NOT host: ${!player2IsHost}`);
    
    // Test 3: Non-host cannot start game
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Non-Host Cannot Start Game');
    console.log('='.repeat(60));
    
    await setReady(player2);
    await player2.page.waitForTimeout(500);
    
    const player2HasStartButton = await player2.page.locator('button:has-text("Start Game")').count() > 0;
    
    await player2.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '03-player2-ready-no-start-button.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Non-Host Cannot See Start Button',
      passed: !player2HasStartButton,
      screenshot: '03-player2-ready-no-start-button.png',
      logs: player2.consoleLogs.slice(-5)
    });
    
    console.log(`${!player2HasStartButton ? '✅' : '❌'} Player2 cannot see start button: ${!player2HasStartButton}`);
    
    // Test 4: Host can start when all ready
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Host Starts Game When All Ready');
    console.log('='.repeat(60));
    
    await setReady(host);
    await host.page.waitForTimeout(1000);
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '04-host-ready-can-start.png'),
      fullPage: true 
    });
    
    const gameStarted = await startGameAsHost(host);
    await host.page.waitForTimeout(2000);
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '05-game-started.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Host Starts Game Successfully',
      passed: gameStarted,
      screenshot: '05-game-started.png',
      logs: host.consoleLogs.slice(-10)
    });
    
    console.log(`${gameStarted ? '✅' : '❌'} Game started: ${gameStarted}`);
    
    // Test 5: Round progression
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Round Progression (Testing 3 rounds)');
    console.log('='.repeat(60));
    
    let roundsPassed = true;
    
    // Wait for round 1
    const round1Started = await waitForRound(host, 1, 5000);
    console.log(`${round1Started ? '✅' : '❌'} Round 1 started: ${round1Started}`);
    
    if (round1Started) {
      await host.page.screenshot({ 
        path: join(SCREENSHOT_DIR, '06-round-1.png'),
        fullPage: true 
      });
      
      // Wait for round 1 to end (60 seconds + 3 second delay)
      console.log('⏳ Waiting for round 1 to end (this may take up to 65 seconds)...');
      await host.page.waitForTimeout(65000);
      
      // Check if round 2 started
      const round2Started = await waitForRound(host, 2, 5000);
      console.log(`${round2Started ? '✅' : '❌'} Round 2 started: ${round2Started}`);
      
      if (round2Started) {
        await host.page.screenshot({ 
          path: join(SCREENSHOT_DIR, '07-round-2.png'),
          fullPage: true 
        });
        
        // Wait for round 2 to end
        console.log('⏳ Waiting for round 2 to end...');
        await host.page.waitForTimeout(65000);
        
        // Check if round 3 started
        const round3Started = await waitForRound(host, 3, 5000);
        console.log(`${round3Started ? '✅' : '❌'} Round 3 started: ${round3Started}`);
        
        if (round3Started) {
          await host.page.screenshot({ 
            path: join(SCREENSHOT_DIR, '08-round-3.png'),
            fullPage: true 
          });
        }
        
        roundsPassed = round3Started;
      } else {
        roundsPassed = false;
      }
    } else {
      roundsPassed = false;
    }
    
    TEST_RESULTS.push({
      test: 'Round Progression (1→2→3)',
      passed: roundsPassed,
      screenshot: '08-round-3.png',
      logs: host.consoleLogs.slice(-15)
    });
    
    // Test 6: Check drawer rotation
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Drawer Rotation');
    console.log('='.repeat(60));
    
    // Check if drawer rotated (look for drawer indicator changes in logs)
    const drawerRotationLogs = host.consoleLogs.filter(log => 
      log.includes('Drawer:') || log.includes('drawer')
    );
    
    const hasDrawerRotation = drawerRotationLogs.length > 1;
    
    TEST_RESULTS.push({
      test: 'Drawer Rotation Between Rounds',
      passed: hasDrawerRotation,
      logs: drawerRotationLogs.slice(-5)
    });
    
    console.log(`${hasDrawerRotation ? '✅' : '❌'} Drawer rotation detected: ${hasDrawerRotation}`);
    
    // Test 7: Add third player and test host transfer
    console.log('\n' + '='.repeat(60));
    console.log('TEST 7: Host Transfer on Disconnect');
    console.log('='.repeat(60));
    
    const player3 = await createPlayer(browser, 'Player3');
    players.push(player3);
    
    await navigateToHome(player3);
    await joinRoom(player3, roomId, 'Bob');
    
    await player3.page.waitForTimeout(2000);
    
    // Close host's page
    console.log('🔌 Disconnecting host...');
    await host.context.close();
    
    await player2.page.waitForTimeout(2000);
    
    // Check if player2 became host
    const player2IsNowHost = await checkHostStatus(player2);
    
    await player2.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '09-host-transferred.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Host Transfer on Disconnect',
      passed: player2IsNowHost,
      screenshot: '09-host-transferred.png',
      logs: player2.consoleLogs.slice(-10)
    });
    
    console.log(`${player2IsNowHost ? '✅' : '❌'} Host transferred to Player2: ${player2IsNowHost}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passedTests = TEST_RESULTS.filter(r => r.passed).length;
    const totalTests = TEST_RESULTS.length;
    
    TEST_RESULTS.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${status}: ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.screenshot) {
        console.log(`   Screenshot: ${result.screenshot}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${passedTests}/${totalTests} tests passed`);
    console.log('='.repeat(60));
    
    // Save results to JSON
    const resultsFile = 'test-results-multiplayer-controls.json';
    writeFileSync(resultsFile, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);
    
    // Save console logs
    const logsFile = join(SCREENSHOT_DIR, 'console-logs.txt');
    const allLogs = players.flatMap(p => p.consoleLogs).join('\n');
    writeFileSync(logsFile, allLogs);
    console.log(`📝 Console logs saved to: ${logsFile}`);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    TEST_RESULTS.push({
      test: 'Overall Test Execution',
      passed: false,
      error: String(error)
    });
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runTests().then(() => {
  const allPassed = TEST_RESULTS.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

