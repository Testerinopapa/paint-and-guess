/**
 * Four Player Game Crawler
 *
 * Purpose:
 * - Simulates 4 players playing a complete game
 * - Draws simple shapes on the canvas when a player is the drawer
 * - Outputs console logs and server logs
 * - Tests full game flow with multiple players
 *
 * Run:
 *   npx tsx scripts/four-player-game-crawler.ts
 *
 * Prerequisites:
 *   1) npm run dev:all (or .\\start-dev.ps1)
 *   2) npx playwright install chromium
 */

import { chromium, Browser, BrowserContext, Page, ConsoleMessage } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

type LogLevel = 'log' | 'debug' | 'info' | 'warn' | 'error';

interface GameLog {
  level: LogLevel;
  source: 'page' | 'server';
  player: string;
  text: string;
  timestamp: number;
}

interface GameReport {
  roomId: string | null;
  players: string[];
  logs: GameLog[];
  screenshotsDir: string;
  meta: Record<string, unknown>;
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = 'test-screenshots-four-players';

// Game settings
const ROUND_TIME_SECONDS = 30;
const MAX_ROUNDS = 3;

const PLAYERS = [
  { name: 'Alice', color: '#FF0000' },  // Red
  { name: 'Bob', color: '#00FF00' },    // Green
  { name: 'Charlie', color: '#0000FF' }, // Blue
  { name: 'Diana', color: '#FF00FF' },   // Magenta
];

function now(): number {
  return Date.now();
}

function ensureDirs() {
  try {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  } catch {}
}

async function healthcheckBackend(): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/rooms`);
  if (!res.ok) {
    throw new Error(`Backend not responding: ${res.status} ${res.statusText}`);
  }
}

async function createGameRoom(): Promise<string> {
  const body = {
    name: 'Four Player Test Room',
    isPublic: true,
    maxPlayers: 6,
    roundTime: ROUND_TIME_SECONDS,
    maxRounds: MAX_ROUNDS,
    wordPack: 'classic',
  };
  const res = await fetch(`${BACKEND_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to create room via API: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.roomId as string;
}

async function captureConsole(page: Page, player: string, logs: GameLog[]) {
  page.on('console', (msg: ConsoleMessage) => {
    const level = (msg.type() as LogLevel) || 'log';
    const text = msg.text();
    
    // Capture all console logs
    logs.push({ level, source: 'page', player, text, timestamp: now() });
    
    // Output to console with player prefix
    const prefix = `[${player}]`;
    switch (level) {
      case 'error':
        console.error(`${prefix} ${text}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${text}`);
        break;
      default:
        console.log(`${prefix} ${text}`);
    }
  });

  // Capture network requests/responses for server logs
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(BACKEND_URL) || url.includes('/api/')) {
      const method = request.method();
      logs.push({
        level: 'debug',
        source: 'server',
        player,
        text: `→ ${method} ${url}`,
        timestamp: now(),
      });
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes(BACKEND_URL) || url.includes('/api/')) {
      const status = response.status();
      logs.push({
        level: status >= 400 ? 'error' : 'debug',
        source: 'server',
        player,
        text: `← ${status} ${url}`,
        timestamp: now(),
      });
    }
  });
}

async function joinRoomViaLobby(page: Page, playerName: string, roomId: string): Promise<void> {
  // Navigate to the paint-and-guess lobby
  await page.goto(`${BASE_URL}/games/paint-and-guess`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Wait for the lobby form to be visible
  console.log(`  Waiting for lobby form to load...`);
  await page.waitForSelector('input[placeholder*="Enter your name" i], input[placeholder*="name" i]', { 
    timeout: 10000 
  });
  
  // Try multiple selector strategies
  let nameInput = page.locator('input[placeholder*="Enter your name" i]').first();
  if (await nameInput.count() === 0) {
    nameInput = page.locator('input[placeholder*="name" i]').first();
  }
  if (await nameInput.count() === 0) {
    nameInput = page.locator('input[type="text"]').first();
  }
  
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.fill(playerName);
  console.log(`  ✓ Filled name: ${playerName}`);
  
  // Find room ID input
  const roomIdInput = page.locator('input[placeholder*="Enter room ID" i], input[placeholder*="room ID" i]').first();
  await roomIdInput.waitFor({ state: 'visible', timeout: 5000 });
  await roomIdInput.fill(roomId);
  console.log(`  ✓ Filled room ID: ${roomId}`);
  
  // Click join button
  const joinButton = page.locator('button:has-text("Join Room")').first();
  await joinButton.waitFor({ state: 'visible', timeout: 5000 });
  await joinButton.click();
  console.log(`  ✓ Clicked Join Room`);
  
  // Wait for navigation to room
  await page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log(`  ✓ Successfully joined room`);
}

async function drawShape(page: Page, shape: 'circle' | 'square' | 'line' | 'triangle', color: string): Promise<void> {
  // Wait for canvas to be visible and ready
  console.log(`  Waiting for canvas to be ready...`);
  try {
    await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });
  } catch (e) {
    console.log('  ⚠️ Canvas not found, skipping draw');
    return;
  }

  // Wait a bit more for Fabric.js to initialize
  await page.waitForTimeout(1000);

  const canvas = page.locator('canvas').first();
  if (!(await canvas.count())) {
    console.log('  ⚠️ Canvas element not found, skipping draw');
    return;
  }

  // Wait for canvas to have dimensions
  let canvasBox = await canvas.boundingBox();
  let retries = 5;
  while (!canvasBox && retries > 0) {
    await page.waitForTimeout(500);
    canvasBox = await canvas.boundingBox();
    retries--;
  }

  if (!canvasBox || canvasBox.width === 0 || canvasBox.height === 0) {
    console.log('  ⚠️ Canvas bounding box invalid, skipping draw');
    return;
  }

  const centerX = canvasBox.x + canvasBox.width / 2;
  const centerY = canvasBox.y + canvasBox.height / 2;
  const radius = Math.min(canvasBox.width, canvasBox.height) / 4;

  // Select color if color picker exists
  try {
    const colorInput = page.locator('input[type="color"]').first();
    if (await colorInput.count()) {
      await colorInput.fill(color);
      await page.waitForTimeout(300);
      console.log(`  ✓ Set color to ${color}`);
    }
  } catch (e) {
    // Color picker might not be available
  }

  console.log(`  Drawing ${shape}...`);
  
  switch (shape) {
    case 'circle':
      // Draw a circle by moving mouse in circular motion
      await page.mouse.move(centerX, centerY - radius);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(50);
      for (let angle = 0; angle <= 360; angle += 15) {
        const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
        const y = centerY + radius * Math.sin((angle * Math.PI) / 180);
        await page.mouse.move(x, y, { steps: 2 });
      }
      await page.mouse.up();
      break;

    case 'square':
      // Draw a square
      const size = radius * 1.5;
      await page.mouse.move(centerX - size / 2, centerY - size / 2);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(centerX + size / 2, centerY - size / 2, { steps: 5 });
      await page.mouse.move(centerX + size / 2, centerY + size / 2, { steps: 5 });
      await page.mouse.move(centerX - size / 2, centerY + size / 2, { steps: 5 });
      await page.mouse.move(centerX - size / 2, centerY - size / 2, { steps: 5 });
      await page.mouse.up();
      break;

    case 'line':
      // Draw a diagonal line
      await page.mouse.move(centerX - radius, centerY - radius);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(centerX + radius, centerY + radius, { steps: 10 });
      await page.mouse.up();
      break;

    case 'triangle':
      // Draw a triangle
      await page.mouse.move(centerX, centerY - radius);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(centerX - radius, centerY + radius, { steps: 5 });
      await page.mouse.move(centerX + radius, centerY + radius, { steps: 5 });
      await page.mouse.move(centerX, centerY - radius, { steps: 5 });
      await page.mouse.up();
      break;
  }

  await page.waitForTimeout(800);
  console.log(`  ✓ Finished drawing ${shape}`);
}

async function makeGuess(page: Page, guess: string): Promise<void> {
  const guessInputSelector = 'input[placeholder*="Type your guess" i], textarea[placeholder*="Type your guess" i]';
  const guessInput = page.locator(guessInputSelector).first();
  
  if (await guessInput.count()) {
    await guessInput.fill(guess);
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
}

async function waitForRoundStart(page: Page, timeout = 10000): Promise<boolean> {
  try {
    // Wait for canvas to be visible or "Watch and guess" overlay
    await page.waitForSelector('canvas, [data-testid*="watch"], [class*="watch"]', { timeout });
    return true;
  } catch {
    return false;
  }
}

async function runCrawler() {
  console.log('🎮 Starting Four Player Game Crawler');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend:  ${BACKEND_URL}`);
  console.log(`Players:  ${PLAYERS.map(p => p.name).join(', ')}`);

  ensureDirs();
  await healthcheckBackend();

  let browser: Browser | null = null;
  const logs: GameLog[] = [];
  let roomId: string | null = null;

  try {
    browser = await chromium.launch({ headless: false, slowMo: 100 });

    // Create room via API
    console.log('🏠 Creating game room via API...');
    roomId = await createGameRoom();
    console.log(`✅ Room created: ${roomId}`);

    // Create browser contexts and pages for each player
    const playerPages: Array<{ page: Page; name: string; color: string }> = [];
    
    for (const player of PLAYERS) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await captureConsole(page, player.name, logs);
      playerPages.push({ page, name: player.name, color: player.color });
    }

    // All players join the room
    console.log('\n👥 All players joining room...');
    for (const player of playerPages) {
      await joinRoomViaLobby(player.page, player.name, roomId);
      console.log(`✅ ${player.name} joined`);
      await player.page.waitForTimeout(500);
    }

    // Take screenshot of all players joined
    await playerPages[0].page.screenshot({ 
      path: join(SCREENSHOT_DIR, '01-all-joined.png'), 
      fullPage: true 
    });

    // All players ready up
    console.log('\n✋ All players readying up...');
    for (const player of playerPages) {
      const readyButton = player.page.locator('button:has-text("Ready Up")');
      if (await readyButton.count()) {
        await readyButton.click();
        console.log(`✅ ${player.name} is ready`);
        await player.page.waitForTimeout(300);
      }
    }

    await playerPages[0].page.screenshot({ 
      path: join(SCREENSHOT_DIR, '02-all-ready.png'), 
      fullPage: true 
    });

    // Host (first player) starts the game
    console.log('\n🚀 Starting game...');
    const startButton = playerPages[0].page.locator('button:has-text("Start Game")');
    if (await startButton.count()) {
      await startButton.click();
      console.log('✅ Game started!');
    }

    await playerPages[0].page.waitForTimeout(2000);
    await playerPages[0].page.screenshot({ 
      path: join(SCREENSHOT_DIR, '03-game-started.png'), 
      fullPage: true 
    });

    // Play through rounds
    const shapes: Array<'circle' | 'square' | 'line' | 'triangle'> = ['circle', 'square', 'line', 'triangle'];
    let shapeIndex = 0;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      console.log(`\n🎯 Round ${round} starting...`);
      
      // Wait for round to start
      await playerPages[0].page.waitForTimeout(2000);
      
      // Find who is the drawer
      let drawerIndex = -1;
      for (let i = 0; i < playerPages.length; i++) {
        const hasCanvas = await playerPages[i].page.locator('canvas').count();
        const hasWatchOverlay = await playerPages[i].page.locator('text=/watch.*guess/i').count();
        
        if (hasCanvas && !hasWatchOverlay) {
          drawerIndex = i;
          break;
        }
      }

      if (drawerIndex >= 0) {
        const drawer = playerPages[drawerIndex];
        const shape = shapes[shapeIndex % shapes.length];
        shapeIndex++;
        
        console.log(`🎨 ${drawer.name} is drawing a ${shape}...`);
        
        // Wait for round to fully start and canvas to be ready
        await drawer.page.waitForTimeout(2000);
        
        // Verify drawer can see the canvas (not the "watch and guess" overlay)
        const watchOverlay = await drawer.page.locator('text=/watch.*guess/i').count();
        if (watchOverlay > 0) {
          console.log(`  ⚠️ ${drawer.name} sees watch overlay, might not be drawer`);
        }
        
        // Draw the shape
        await drawShape(drawer.page, shape, drawer.color);
        console.log(`✅ ${drawer.name} finished drawing`);
        
        await drawer.page.waitForTimeout(500);
        await drawer.page.screenshot({ 
          path: join(SCREENSHOT_DIR, `04-round-${round}-${drawer.name}-drawing.png`), 
          fullPage: true 
        });
      } else {
        console.log(`  ⚠️ Could not determine drawer for round ${round}`);
      }

      // Other players make guesses
      console.log(`💭 Other players making guesses...`);
      const guesses = ['circle', 'square', 'triangle', 'shape', 'drawing', 'art'];
      
      for (let i = 0; i < playerPages.length; i++) {
        if (i !== drawerIndex) {
          const guesser = playerPages[i];
          const guess = guesses[Math.floor(Math.random() * guesses.length)];
          
          await makeGuess(guesser.page, guess);
          console.log(`✅ ${guesser.name} guessed: "${guess}"`);
          await guesser.page.waitForTimeout(500);
        }
      }

      // Wait for round to end
      const roundEndTime = (ROUND_TIME_SECONDS + 5) * 1000; // Add buffer for intermission
      console.log(`⏳ Waiting ${ROUND_TIME_SECONDS + 5}s for round ${round} to complete...`);
      await playerPages[0].page.waitForTimeout(roundEndTime);
      
      await playerPages[0].page.screenshot({ 
        path: join(SCREENSHOT_DIR, `05-round-${round}-end.png`), 
        fullPage: true 
      });
    }

    console.log('\n🏁 Game completed!');
    
    // Final screenshot
    await playerPages[0].page.waitForTimeout(2000);
    await playerPages[0].page.screenshot({ 
      path: join(SCREENSHOT_DIR, '06-game-complete.png'), 
      fullPage: true 
    });

    // Generate report
    const report: GameReport = {
      roomId,
      players: PLAYERS.map(p => p.name),
      logs,
      screenshotsDir: SCREENSHOT_DIR,
      meta: {
        baseUrl: BASE_URL,
        backendUrl: BACKEND_URL,
        roundTimeSeconds: ROUND_TIME_SECONDS,
        maxRounds: MAX_ROUNDS,
        timestamp: new Date().toISOString(),
      },
    };

    const reportPath = 'test-results-four-players.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Game report saved to ${reportPath}`);
    console.log(`📸 Screenshots saved to ${SCREENSHOT_DIR}/`);
    console.log(`📊 Total logs captured: ${logs.length}`);

  } catch (error) {
    console.error('❌ Crawler failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runCrawler()
  .then(() => {
    console.log('\n✅ Crawler completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Crawler failed:', error);
    process.exit(1);
  });

