/**
 * Multiplayer Debug Crawler
 *
 * Purpose:
 * - Quickly reproduce the multiplayer flow with rich diagnostics
 * - Shorter rounds for faster iteration
 * - Collect front-end console logs, screenshots, and a compact debug report
 *
 * Run:
 *   npx tsx scripts/debug-multiplayer-crawler.ts
 *
 * Prerequisites:
 *   1) npm run dev:all (or .\\start-dev.ps1)
 *   2) npx playwright install chromium
 */

import { chromium, Browser, BrowserContext, Page, ConsoleMessage, Request } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

type LogLevel = 'log' | 'debug' | 'info' | 'warn' | 'error';

interface DebugLog {
  level: LogLevel;
  source: 'page' | 'network';
  player: string;
  text: string;
  timestamp: number;
}

interface DebugReport {
  roomId: string | null;
  createdViaApi: boolean;
  screenshotsDir: string;
  logs: DebugLog[];
  meta: Record<string, unknown>;
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = 'test-screenshots-multiplayer-debug';

// Faster rounds for debugging
const DEBUG_ROUND_TIME_SECONDS = 10;
const DEBUG_MAX_ROUNDS = 3;

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

async function createDebugRoom(): Promise<string> {
  const body = {
    name: 'Debug Multiplayer Room',
    isPublic: true,
    maxPlayers: 6,
    roundTime: DEBUG_ROUND_TIME_SECONDS,
    maxRounds: DEBUG_MAX_ROUNDS,
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

async function captureConsole(page: Page, player: string, logs: DebugLog[]) {
  page.on('console', (msg: ConsoleMessage) => {
    const level = (msg.type() as LogLevel) || 'log';
    const text = msg.text();
    // Only capture our high-signal namespaces to keep logs readable
    if (
      text.includes('[Server]') ||
      text.includes('[GameRoom') ||
      text.includes('[GameContext]') ||
      text.includes('[Room]') ||
      text.includes('[Canvas]')
    ) {
      logs.push({ level, source: 'page', player, text, timestamp: now() });
      // Mirror to runner console
      console.log(`[${player}] ${text}`);
    }
  });
}

async function captureNetwork(page: Page, player: string, logs: DebugLog[]) {
  page.on('request', (req: Request) => {
    const url = req.url();
    if (url.startsWith(BACKEND_URL)) {
      logs.push({
        level: 'debug',
        source: 'network',
        player,
        text: `REQUEST ${req.method()} ${url}`,
        timestamp: now(),
      });
    }
  });
}

async function fillLobbyAndCreateRoom(host: { page: Page; name: string }, roomName: string): Promise<string | null> {
  // Wait for lobby UI
  await host.page.waitForSelector('input[placeholder*="name" i]', { timeout: 5000 });
  const nameInput = host.page.locator('input[placeholder*="Enter your name" i]').first();
  await nameInput.fill(host.name);

  const roomNameInput = host.page.locator('input[placeholder*="Room name" i]').first();
  await roomNameInput.fill(roomName);

  const createButton = host.page.locator('button:has-text("Create Room")').last();
  await createButton.click();
  await host.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
  const url = host.page.url();
  const match = url.match(/\/room\/([A-Z0-9]+)/);
  return match ? match[1] : null;
}

async function joinRoomViaLobby(player: { page: Page; name: string }, roomId: string): Promise<void> {
  await player.page.goto(BASE_URL);
  await player.page.waitForLoadState('networkidle');
  await player.page.waitForTimeout(500);
  const nameInput = player.page.locator('input[placeholder*="Enter your name" i]').first();
  await nameInput.fill(player.name);
  const roomIdInput = player.page.locator('input[placeholder*="Enter room ID" i]').first();
  await roomIdInput.fill(roomId);
  const joinButton = player.page.locator('button:has-text("Join Room")').last();
  await joinButton.click();
  await player.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
}

async function runCrawler() {
  console.log('🧪 Starting Multiplayer Debug Crawler');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend:  ${BACKEND_URL}`);

  ensureDirs();
  await healthcheckBackend();

  // Fast room creation via API for short rounds
  let roomId: string | null = null;
  let createdViaApi = false;

  let browser: Browser | null = null;
  const logs: DebugLog[] = [];

  try {
    browser = await chromium.launch({ headless: false, slowMo: 50 });

    // Create players
    const hostContext: BrowserContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await captureConsole(hostPage, 'Host', logs);
    await captureNetwork(hostPage, 'Host', logs);

    const p2Context: BrowserContext = await browser.newContext();
    const p2Page = await p2Context.newPage();
    await captureConsole(p2Page, 'Player2', logs);
    await captureNetwork(p2Page, 'Player2', logs);

    // Create room quickly via API so rounds are shorter
    console.log('🏠 Creating debug room via API (short rounds)...');
    roomId = await createDebugRoom();
    createdViaApi = true;
    console.log(`✅ Room created via API: ${roomId}`);

    // Navigate to lobby and join for Host (still required to emit join-room)
    await hostPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await hostPage.waitForTimeout(500);
    await joinRoomViaLobby({ page: hostPage, name: 'DebugHost' }, roomId);
    await hostPage.waitForTimeout(800);
    await hostPage.screenshot({ path: join(SCREENSHOT_DIR, '01-host-joined.png'), fullPage: true });

    // Player 2 joins
    await joinRoomViaLobby({ page: p2Page, name: 'DebugP2' }, roomId);
    await p2Page.waitForTimeout(800);
    await p2Page.screenshot({ path: join(SCREENSHOT_DIR, '02-p2-joined.png'), fullPage: true });

    // Player2 set ready
    const p2ReadyButton = p2Page.locator('button:has-text("Ready Up")');
    await p2ReadyButton.click();
    await p2Page.waitForTimeout(500);
    await p2Page.screenshot({ path: join(SCREENSHOT_DIR, '03-p2-ready.png'), fullPage: true });

    // Host set ready
    const hostReadyButton = hostPage.locator('button:has-text("Ready Up")');
    await hostReadyButton.click();
    await hostPage.waitForTimeout(500);
    await hostPage.screenshot({ path: join(SCREENSHOT_DIR, '04-host-ready.png'), fullPage: true });

    // Start game as host
    const startButton = hostPage.locator('button:has-text("Start Game")');
    await startButton.click();
    await hostPage.waitForTimeout(1500);
    await hostPage.screenshot({ path: join(SCREENSHOT_DIR, '05-game-started.png'), fullPage: true });

    // Wait for round 1 display
    await hostPage.waitForTimeout(1500);
    await hostPage.screenshot({ path: join(SCREENSHOT_DIR, '06-round-1.png'), fullPage: true });

    // Wait for round to end and next to begin (short rounds)
    const totalWaitPerRound = (DEBUG_ROUND_TIME_SECONDS + 4) * 1000; // includes 3s intermission
    console.log(`⏳ Waiting ~${Math.round(totalWaitPerRound / 1000)}s for round to complete...`);
    await hostPage.waitForTimeout(totalWaitPerRound);
    await hostPage.screenshot({ path: join(SCREENSHOT_DIR, '07-round-2-or-end.png'), fullPage: true });

    // Attempt a guess as Player2 to exercise guess path and scoring
    // This will be "wrong-guess" but gives us more signal
    const guessInputSelector = 'input[placeholder*="Type your guess" i], textarea';
    const guessVisible = await p2Page.locator(guessInputSelector).count();
    if (guessVisible > 0) {
      try {
        await p2Page.locator(guessInputSelector).first().fill('test-guess');
        await p2Page.keyboard.press('Enter');
        await p2Page.waitForTimeout(500);
      } catch {}
    }
    await p2Page.screenshot({ path: join(SCREENSHOT_DIR, '08-p2-guessed.png'), fullPage: true });

    // Final small wait to flush logs
    await hostPage.waitForTimeout(1500);

    const report: DebugReport = {
      roomId,
      createdViaApi,
      screenshotsDir: SCREENSHOT_DIR,
      logs,
      meta: {
        baseUrl: BASE_URL,
        backendUrl: BACKEND_URL,
        debugRoundTimeSeconds: DEBUG_ROUND_TIME_SECONDS,
        debugMaxRounds: DEBUG_MAX_ROUNDS,
        timestamp: new Date().toISOString(),
      },
    };
    const reportPath = 'test-results-multiplayer-debug.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Debug report saved to ${reportPath}`);
    console.log(`📸 Screenshots saved to ${SCREENSHOT_DIR}/`);
  } catch (error) {
    console.error('❌ Debug crawler failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runCrawler()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));


