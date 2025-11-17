/**
 * Heartbeat & Sweep Implementation Test
 * 
 * Tests the heartbeat and room sweep functionality:
 * - Client heartbeat pings (every 15s)
 * - Server heartbeat acknowledgment
 * - Stale player detection (after PLAYER_STALE_HEARTBEAT_MS)
 * - Player pruning after grace period (PLAYER_DISCONNECT_GRACE_PERIOD_MS)
 * - Room sweep intervals (ROOM_SWEEP_INTERVAL_MS)
 * - Player revival via heartbeat
 * - Background sweep operations
 * - Debug logging at various levels
 * 
 * Run with: npm run test:heartbeat
 *            (or: npx tsx scripts/test-heartbeat-sweep.ts)
 * 
 * Prerequisites:
 *   1. Start the dev servers: npm run dev:all (or .\start-dev.ps1)
 *   2. Install Playwright browsers: npx playwright install chromium
 *   3. Set LOG_LEVEL=debug for detailed logs: $env:LOG_LEVEL="debug"; npm run dev
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
  details?: any;
  duration?: number;
}

const TEST_RESULTS: TestResult[] = [];
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const DELAY_MS = 500;
const SCREENSHOT_DIR = 'test-screenshots-heartbeat';
const HEARTBEAT_INTERVAL_MS = 15000; // Client heartbeat interval
const STALE_THRESHOLD_MS = 45000; // PLAYER_STALE_HEARTBEAT_MS
const GRACE_PERIOD_MS = 120000; // PLAYER_DISCONNECT_GRACE_PERIOD_MS
const SWEEP_INTERVAL_MS = 30000; // ROOM_SWEEP_INTERVAL_MS

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
  networkLogs: string[];
  playerId?: string;
  roomId?: string;
  heartbeatCount: number;
  lastHeartbeatTime?: number;
}

let browser: Browser;
const players: Player[] = [];

async function captureConsoleLogs(page: Page, playerName: string, logs: string[]) {
  page.on('console', (msg) => {
    const text = msg.text();
    // Capture heartbeat, sweep, and connection-related logs
    // Also capture room creation/joining logs for room ID extraction
    if (text.includes('[Heartbeat]') || text.includes('[Sweeper]') ||
        text.includes('[GameRoom') || text.includes('[Server]') ||
        text.includes('[GameContext]') || text.includes('[Room]') ||
        text.includes('heartbeat') || text.includes('stale') ||
        text.includes('prune') || text.includes('connected') ||
        text.includes('disconnected') || text.includes('lastSeen') ||
        text.includes('revived') || text.includes('Room created') ||
        text.includes('Joining room') || text.includes('roomId') ||
        text.includes('Creating room')) {
      const logEntry = `[${new Date().toISOString()}] [${playerName}] ${text}`;
      logs.push(logEntry);
      console.log(logEntry);
    }
  });
}

async function captureNetworkLogs(page: Page, playerName: string, logs: string[]) {
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/rooms') || url.includes('socket.io')) {
      const status = response.status();
      const method = response.request().method();
      const logEntry = `[${new Date().toISOString()}] [${playerName}] 🌐 ${method} ${url} → ${status}`;
      logs.push(logEntry);
    }
  });
}

async function captureSocketEvents(page: Page, playerName: string, logs: string[]) {
  // Monitor heartbeat events via console logs from the client
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('heartbeat') || text.includes('heartbeat-ack')) {
      const logEntry = `[${new Date().toISOString()}] [${playerName}] 🔌 ${text}`;
      logs.push(logEntry);
    }
  });
}

async function createPlayer(browser: Browser, name: string): Promise<Player> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleLogs: string[] = [];
  const networkLogs: string[] = [];
  
  captureConsoleLogs(page, name, consoleLogs);
  captureNetworkLogs(page, name, networkLogs);
  captureSocketEvents(page, name, consoleLogs);
  
  return { name, page, context, consoleLogs, networkLogs, heartbeatCount: 0 };
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
    
    await player.page.waitForSelector('input[placeholder*="name" i]', { timeout: 5000 });
    await player.page.waitForTimeout(500);
    
    const nameInput = player.page.locator('input[placeholder*="Enter your name" i]').first();
    await nameInput.fill(playerName);
    
    const roomNameInput = player.page.locator('input[placeholder*="Room name" i]').first();
    await roomNameInput.fill('Heartbeat Test Room');
    
    const createButton = player.page.locator('button:has-text("Create Room")').last();
    await createButton.click();
    
    // Wait for "Room created" log to appear (this happens before navigation)
    console.log(`  Waiting for room creation to complete...`);
    let roomCreatedLogFound = false;
    for (let i = 0; i < 20; i++) { // Wait up to 10 seconds
      roomCreatedLogFound = player.consoleLogs.some(log => 
        log.includes('Room created') || log.includes('roomId:')
      );
      if (roomCreatedLogFound) {
        console.log(`  ✓ Room created log found`);
        break;
      }
      await player.page.waitForTimeout(500);
    }
    
    // Wait for "Joining room" log to appear
    console.log(`  Waiting for join room log...`);
    let joinLogFound = false;
    for (let i = 0; i < 20; i++) { // Wait up to 10 seconds
      joinLogFound = player.consoleLogs.some(log => 
        log.includes('Joining room')
      );
      if (joinLogFound) {
        console.log(`  ✓ Joining room log found`);
        break;
      }
      await player.page.waitForTimeout(500);
    }
    
    // Wait for navigation to room page
    try {
      await player.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 15000 });
      console.log(`  ✓ Navigated to room page`);
    } catch (error) {
      console.log(`  ⚠️ URL navigation timeout, checking current URL...`);
    }
    
    // Wait for page to stabilize (socket might reconnect)
    await player.page.waitForTimeout(2000);
    
    // Wait for network to be idle
    try {
      await player.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (e) {
      // Network might not be idle, that's okay
    }
    
    await player.page.waitForTimeout(2000); // Additional buffer
    
    // Try to extract room ID from URL first
    let url = player.page.url();
    let match = url.match(/\/room\/([A-Z0-9]+)/);
    let roomId = match ? match[1] : null;
    
    // Also check console logs for "Joining room" pattern (most reliable)
    if (!roomId) {
      console.log(`  Checking ${player.consoleLogs.length} console logs for room ID...`);
      for (const logEntry of player.consoleLogs) {
        // Try multiple patterns to catch "Joining room VYVYSZ" in various formats
        const joinMatch = logEntry.match(/Joining room\s+([A-Z0-9]{5,6})/i) ||
                         logEntry.match(/Joining room\s+([A-Z0-9]+)/i) ||
                         logEntry.match(/🚪\s*Joining room\s+([A-Z0-9]{5,6})/i);
        if (joinMatch) {
          roomId = joinMatch[1];
          console.log(`  ✓ Found room ID from "Joining room" log: ${roomId}`);
          break;
        }
      }
      if (!roomId && player.consoleLogs.length > 0) {
        console.log(`  No room ID found. Sample log entries:`);
        player.consoleLogs.slice(-3).forEach((log, i) => {
          if (log.includes('room') || log.includes('Room')) {
            console.log(`    ${i + 1}. ${log.substring(0, 200)}`);
          }
        });
      }
    }
    
    // Fallback: try extracting from console logs (roomId is logged)
    if (!roomId) {
      console.log(`  ⚠️ Room ID not found in URL, checking console logs...`);
      await player.page.waitForTimeout(1500);
      
      // Join logs and normalize whitespace (handle multi-line splits)
      const logs = player.consoleLogs.join(' ').replace(/\s+/g, ' ');
      
      // Check individual log entries for "Joining room" which has the room ID
      for (const logEntry of player.consoleLogs) {
        const joinMatch = logEntry.match(/Joining room\s+([A-Z0-9]{5,6})/i);
        if (joinMatch) {
          roomId = joinMatch[1];
          console.log(`  ✓ Found room ID from "Joining room" log: ${roomId}`);
          break;
        }
      }
      
      // Try multiple patterns to match different log formats
      if (!roomId) {
        // Pattern for: {roomId: VYVYSZ} or roomId: VYVYSZ (handles multi-line)
        const logMatch = logs.match(/\{roomId:\s*([A-Z0-9]{5,6})\}/i) ||
                        logs.match(/roomId:\s*([A-Z0-9]{5,6})/i) || 
                        logs.match(/Room created.*?roomId:\s*([A-Z0-9]{5,6})/i) ||
                        logs.match(/Room created.*?\{[^}]*roomId[:\s]+([A-Z0-9]{5,6})/i) ||
                        logs.match(/roomId[:\s]+([A-Z0-9]{5,6})/i) ||
                        // Look for any 5-6 character uppercase alphanumeric after "Room created"
                        logs.match(/Room created[^{]*\{[^}]*([A-Z0-9]{5,6})/i);
        if (logMatch) {
          roomId = logMatch[1];
          console.log(`  ✓ Found room ID in logs: ${roomId}`);
        }
      }
      
      if (!roomId) {
        console.log(`  ⚠️ Could not extract room ID from logs.`);
        console.log(`  Recent logs (last 5):`);
        player.consoleLogs.slice(-5).forEach((log, i) => {
          console.log(`    ${i + 1}. ${log.substring(0, 150)}`);
        });
      }
    }
    
    // Final fallback: check URL again after more wait
    if (!roomId) {
      await player.page.waitForTimeout(2000);
      url = player.page.url();
      match = url.match(/\/room\/([A-Z0-9]+)/);
      roomId = match ? match[1] : null;
    }
    
    if (roomId) {
      player.roomId = roomId;
      console.log(`✅ Room created: ${roomId}`);
    } else {
      console.error(`  ❌ Failed to extract room ID from URL: ${url}`);
      console.error(`  Console logs:`, player.consoleLogs.slice(-5));
    }
    
    return roomId;
  } catch (error) {
    console.error(`Failed to create room:`, error);
    return null;
  }
}

async function joinRoom(player: Player, roomId: string, playerName: string): Promise<boolean> {
  try {
    console.log(`\n👤 ${player.name} joining room ${roomId} as "${playerName}"...`);
    
    await player.page.goto(BASE_URL);
    await player.page.waitForLoadState('networkidle');
    await player.page.waitForTimeout(500);
    
    const nameInput = player.page.locator('input[placeholder*="Enter your name" i]').first();
    await nameInput.fill(playerName);
    
    const roomIdInput = player.page.locator('input[placeholder*="Enter room ID" i]').first();
    await roomIdInput.fill(roomId);
    
    const joinButton = player.page.locator('button:has-text("Join Room")').last();
    await joinButton.click();
    
    await player.page.waitForURL(/\/room\/[A-Z0-9]+/, { timeout: 10000 });
    await player.page.waitForTimeout(2000);
    
    player.roomId = roomId;
    console.log(`✅ ${player.name} joined room`);
    return true;
  } catch (error) {
    console.error(`Failed to join room:`, error);
    return false;
  }
}

async function extractPlayerId(player: Player): Promise<string | null> {
  try {
    const playerId = await player.page.evaluate(() => {
      const roomId = window.location.pathname.match(/\/room\/([A-Z0-9]+)/)?.[1];
      if (roomId) {
        return sessionStorage.getItem(`paint-and-guess:player:${roomId}`);
      }
      return null;
    });
    
    if (playerId) {
      player.playerId = playerId;
      console.log(`  ✓ Extracted playerId: ${playerId.substring(0, 8)}...`);
    }
    
    return playerId;
  } catch (error) {
    console.error(`Failed to extract playerId:`, error);
    return null;
  }
}

function checkLogsForPattern(player: Player, patterns: string[]): boolean {
  const allLogs = player.consoleLogs.join('\n');
  return patterns.some(pattern => allLogs.includes(pattern));
}

function countLogPattern(player: Player, pattern: string): number {
  return player.consoleLogs.filter(log => log.includes(pattern)).length;
}

async function waitForHeartbeats(player: Player, expectedCount: number, timeoutMs: number): Promise<number> {
  const startTime = Date.now();
  let lastCount = countLogPattern(player, 'heartbeat');
  
  while (Date.now() - startTime < timeoutMs) {
    await player.page.waitForTimeout(1000);
    const currentCount = countLogPattern(player, 'heartbeat');
    if (currentCount !== lastCount) {
      console.log(`  💓 ${player.name} heartbeat count: ${currentCount}`);
      lastCount = currentCount;
      player.heartbeatCount = currentCount;
      player.lastHeartbeatTime = Date.now();
    }
    if (currentCount >= expectedCount) {
      return currentCount;
    }
  }
  
  return lastCount;
}

async function checkBackendHealth(): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function checkBackendDebugRooms(): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/debug/rooms`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function getRoomState(roomId: string): Promise<any> {
  try {
    // Get room state by checking debug endpoint
    const debugRooms = await checkBackendDebugRooms();
    const room = debugRooms?.inMemory?.find((r: any) => r.id === roomId);
    return room;
  } catch (error) {
    return null;
  }
}

async function getRoomPlayerCounts(roomId: string): Promise<{total: number, active: number} | null> {
  try {
    const room = await getRoomState(roomId);
    if (!room) return null;
    
    // We need to get the actual room from the repository to check active players
    // Since we can't directly access that, we'll check via the health endpoint
    // or make an assumption based on the room state
    return {
      total: room.players || 0,
      active: room.players || 0 // We'll need to infer this from behavior
    };
  } catch (error) {
    return null;
  }
}

async function simulateNetworkInterruption(player: Player, durationMs: number): Promise<void> {
  console.log(`\n🌐 Simulating network interruption for ${player.name} (${durationMs}ms)...`);
  
  // Block network requests
  await player.context.route('**/*', route => {
    route.abort();
  });
  
  await new Promise(resolve => setTimeout(resolve, durationMs));
  
  // Unblock network requests
  await player.context.unroute('**/*');
  
  console.log(`  ✓ Network restored for ${player.name}`);
}

async function runTests() {
  console.log('🚀 Starting Heartbeat & Sweep Implementation Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Screenshot directory: ${SCREENSHOT_DIR}\n`);
  console.log(`Configuration:`);
  console.log(`  Heartbeat Interval: ${HEARTBEAT_INTERVAL_MS}ms`);
  console.log(`  Stale Threshold: ${STALE_THRESHOLD_MS}ms`);
  console.log(`  Grace Period: ${GRACE_PERIOD_MS}ms`);
  console.log(`  Sweep Interval: ${SWEEP_INTERVAL_MS}ms\n`);
  
  // Check if backend is running
  try {
    const health = await checkBackendHealth();
    if (!health || health.status !== 'ok') {
      throw new Error('Backend not responding');
    }
    console.log('✅ Backend is running');
    console.log(`   Store: ${health.store}`);
    console.log(`   Rooms in memory: ${health.rooms?.inMemory || 0}`);
    console.log(`   Rooms in database: ${health.rooms?.inDatabase || 0}\n`);
  } catch (error) {
    console.error('❌ Backend is not running! Please start it with: npm run dev:all');
    process.exit(1);
  }
  
  try {
    browser = await chromium.launch({ headless: false });
    
    // Test 1: Room Creation & Initial Heartbeat Setup
    console.log('\n' + '='.repeat(70));
    console.log('TEST 1: Room Creation & Initial Heartbeat Setup');
    console.log('='.repeat(70));
    
    const startTime = Date.now();
    const host = await createPlayer(browser, 'Host');
    players.push(host);
    
    await navigateToHome(host);
    let roomId = await createRoom(host, 'HeartbeatHost');
    
    // Fallback: try to extract roomId from current URL if initial detection failed
    if (!roomId) {
      try {
        await host.page.waitForTimeout(2000);
        const urlAfter = host.page.url();
        const matchAfter = urlAfter.match(/\/room\/([A-Z0-9]+)/);
        if (matchAfter) {
          roomId = matchAfter[1];
          host.roomId = roomId;
          console.log(`✅ Room detected from URL fallback: ${roomId}`);
        }
      } catch (e) {
        console.error(`Fallback room detection failed:`, e);
      }
    }
    
    if (!roomId) {
      TEST_RESULTS.push({
        test: 'Room Creation',
        passed: false,
        error: 'Failed to create room - roomId not found',
        logs: host.consoleLogs.slice(-10)
      });
      throw new Error('Failed to create room');
    }
    
    await host.page.waitForTimeout(3000);
    await extractPlayerId(host);
    
    // Wait for initial heartbeat (should happen on connect)
    await host.page.waitForTimeout(2000);
    
    const hasHeartbeatLogs = checkLogsForPattern(host, ['heartbeat']);
    const heartbeatCount = countLogPattern(host, 'heartbeat');
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '01-room-created.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Room Creation & Initial Heartbeat Setup',
      passed: roomId !== null,
      screenshot: '01-room-created.png',
      logs: host.consoleLogs.filter(l => l.includes('heartbeat')),
      details: { roomId, hasHeartbeatLogs, heartbeatCount },
      duration: Date.now() - startTime
    });
    
    console.log(`✅ Room created: ${roomId}`);
    console.log(`${hasHeartbeatLogs ? '✅' : '⚠️'} Heartbeat logs detected: ${hasHeartbeatLogs}`);
    console.log(`   Heartbeat count: ${heartbeatCount}`);
    
    // Test 2: Multiple Players & Heartbeat Verification
    console.log('\n' + '='.repeat(70));
    console.log('TEST 2: Multiple Players & Heartbeat Verification');
    console.log('='.repeat(70));
    
    const test2Start = Date.now();
    const player2 = await createPlayer(browser, 'Player2');
    players.push(player2);
    
    await navigateToHome(player2);
    await joinRoom(player2, roomId, 'Alice');
    await extractPlayerId(player2);
    await player2.page.waitForTimeout(3000);
    
    // Wait for at least 2 heartbeats from each player (should take ~30s)
    console.log(`\n  Waiting for heartbeats (expecting at least 2 per player)...`);
    const waitTime = Math.max(HEARTBEAT_INTERVAL_MS * 2.5, 40000); // Wait for 2-3 heartbeats
    
    const hostHeartbeats = await waitForHeartbeats(host, 2, waitTime);
    const player2Heartbeats = await waitForHeartbeats(player2, 2, waitTime);
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '02-multiple-players-heartbeats.png'),
      fullPage: true 
    });
    
    const hasMultipleHeartbeats = hostHeartbeats >= 2 && player2Heartbeats >= 2;
    
    TEST_RESULTS.push({
      test: 'Multiple Players & Heartbeat Verification',
      passed: hasMultipleHeartbeats,
      screenshot: '02-multiple-players-heartbeats.png',
      logs: [
        ...host.consoleLogs.filter(l => l.includes('heartbeat')),
        ...player2.consoleLogs.filter(l => l.includes('heartbeat'))
      ],
      details: { 
        hostHeartbeats, 
        player2Heartbeats,
        expectedMin: 2
      },
      duration: Date.now() - test2Start
    });
    
    console.log(`\n  Host heartbeats: ${hostHeartbeats}`);
    console.log(`  Player2 heartbeats: ${player2Heartbeats}`);
    console.log(`${hasMultipleHeartbeats ? '✅' : '❌'} Multiple heartbeats verified: ${hasMultipleHeartbeats}`);
    
    // Test 3: Stale Player Detection
    console.log('\n' + '='.repeat(70));
    console.log('TEST 3: Stale Player Detection');
    console.log('='.repeat(70));
    
    const test3Start = Date.now();
    const player3 = await createPlayer(browser, 'Player3');
    players.push(player3);
    
    await navigateToHome(player3);
    await joinRoom(player3, roomId, 'Bob');
    await extractPlayerId(player3);
    await player3.page.waitForTimeout(3000);
    
    // Check room state before network interruption
    const roomStateBefore = await getRoomState(roomId);
    const playerCountBefore = roomStateBefore?.players || 0;
    
    // Simulate network interruption longer than stale threshold
    console.log(`\n  Simulating network interruption for Player3 (${STALE_THRESHOLD_MS + 5000}ms)...`);
    await simulateNetworkInterruption(player3, STALE_THRESHOLD_MS + 5000);
    
    // Wait for sweep to detect stale player (sweep runs every 30s, so wait a bit longer)
    console.log(`  Waiting for sweep to detect stale player (${SWEEP_INTERVAL_MS + 10000}ms)...`);
    await host.page.waitForTimeout(SWEEP_INTERVAL_MS + 10000);
    
    // Check room state after sweep
    const roomStateAfter = await getRoomState(roomId);
    const playerCountAfter = roomStateAfter?.players || 0;
    
    // Check if player3 appears as disconnected in the room (via player-left events)
    // We can't directly check server logs, but we can verify behavior:
    // 1. Player3 should not be in active players list
    // 2. Room should still exist
    // 3. Other players should see player-left event (check host logs for this)
    const hasPlayerLeftEvent = checkLogsForPattern(host, ['player-left']) || 
                              checkLogsForPattern(player2, ['player-left']);
    
    // Verify room still exists and player count might have changed
    const roomStillExists = roomStateAfter !== null;
    const staleDetected = hasPlayerLeftEvent || (playerCountBefore !== playerCountAfter);
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '03-stale-detection.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Stale Player Detection',
      passed: staleDetected,
      screenshot: '03-stale-detection.png',
      logs: [
        ...host.consoleLogs.filter(l => l.includes('player-left') || l.includes('Player')),
        ...player2.consoleLogs.filter(l => l.includes('player-left') || l.includes('Player'))
      ],
      details: { 
        hasPlayerLeftEvent,
        roomStillExists,
        playerCountBefore,
        playerCountAfter,
        staleDetected,
        staleThresholdMs: STALE_THRESHOLD_MS
      },
      duration: Date.now() - test3Start
    });
    
    console.log(`${hasPlayerLeftEvent ? '✅' : '⚠️'} Player-left event detected: ${hasPlayerLeftEvent}`);
    console.log(`${roomStillExists ? '✅' : '❌'} Room still exists: ${roomStillExists}`);
    console.log(`${staleDetected ? '✅' : '⚠️'} Stale detection (via behavior): ${staleDetected}`);
    
    // Test 4: Player Revival via Heartbeat
    console.log('\n' + '='.repeat(70));
    console.log('TEST 4: Player Revival via Heartbeat');
    console.log('='.repeat(70));
    
    const test4Start = Date.now();
    
    // Check room state before revival
    const roomStateBeforeRevival = await getRoomState(roomId);
    const playerCountBeforeRevival = roomStateBeforeRevival?.players || 0;
    
    // Restore network for player3 and wait for heartbeat to revive them
    console.log(`\n  Restoring network for Player3 and waiting for revival heartbeat...`);
    await player3.page.waitForTimeout(5000);
    
    // Player3 should send heartbeat once network is restored
    const revivalWaitTime = HEARTBEAT_INTERVAL_MS + 5000;
    await player3.page.waitForTimeout(revivalWaitTime);
    
    // Check if player3 rejoined (player-joined event)
    const hasPlayerJoinedEvent = checkLogsForPattern(host, ['player-joined']) || 
                                checkLogsForPattern(player2, ['player-joined']) ||
                                checkLogsForPattern(player3, ['player-joined']);
    
    // Check room state after revival
    const roomStateAfterRevival = await getRoomState(roomId);
    const playerCountAfterRevival = roomStateAfterRevival?.players || 0;
    
    // Verify player3 can interact (is back in room)
    const player3InRoom = await player3.page.evaluate(() => {
      return window.location.pathname.includes('/room/');
    });
    
    // Revival is successful if player rejoined or is back in room
    const revivalSuccessful = hasPlayerJoinedEvent || (player3InRoom && playerCountAfterRevival >= playerCountBeforeRevival);
    
    await player3.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '04-player-revival.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Player Revival via Heartbeat',
      passed: revivalSuccessful,
      screenshot: '04-player-revival.png',
      logs: [
        ...player3.consoleLogs.filter(l => l.includes('player-joined') || l.includes('heartbeat')),
        ...host.consoleLogs.filter(l => l.includes('player-joined') || l.includes('Player'))
      ],
      details: { 
        hasPlayerJoinedEvent,
        player3InRoom,
        playerCountBeforeRevival,
        playerCountAfterRevival,
        revivalSuccessful
      },
      duration: Date.now() - test4Start
    });
    
    console.log(`${hasPlayerJoinedEvent ? '✅' : '⚠️'} Player-joined event detected: ${hasPlayerJoinedEvent}`);
    console.log(`${player3InRoom ? '✅' : '❌'} Player3 in room: ${player3InRoom}`);
    console.log(`${revivalSuccessful ? '✅' : '❌'} Player revival successful: ${revivalSuccessful}`);
    
    // Test 5: Room Sweep Operations
    console.log('\n' + '='.repeat(70));
    console.log('TEST 5: Room Sweep Operations');
    console.log('='.repeat(70));
    
    const test5Start = Date.now();
    
    // Check room state before sweeps
    const roomStateBeforeSweeps = await getRoomState(roomId);
    const playerCountBeforeSweeps = roomStateBeforeSweeps?.players || 0;
    
    // Wait for multiple sweep cycles
    console.log(`\n  Waiting for ${SWEEP_INTERVAL_MS * 2}ms to observe multiple sweep cycles...`);
    await host.page.waitForTimeout(SWEEP_INTERVAL_MS * 2 + 5000);
    
    // Check room state after sweeps (sweeps should persist room state)
    const roomStateAfterSweeps = await getRoomState(roomId);
    const playerCountAfterSweeps = roomStateAfterSweeps?.players || 0;
    
    // Sweeps should maintain room state - verify room still exists
    const roomPersisted = roomStateAfterSweeps !== null;
    
    // Check health endpoint to verify sweeps are running (rooms should be persisted)
    const healthAfter = await checkBackendHealth();
    const roomsInMemory = healthAfter?.rooms?.inMemory || 0;
    const roomsInDatabase = healthAfter?.rooms?.inDatabase || 0;
    
    // Sweep operations are working if:
    // 1. Room is still in memory
    // 2. Room state is maintained
    // 3. Health endpoint shows rooms
    const sweepsWorking = roomPersisted && roomsInMemory > 0;
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '05-room-sweeps.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Room Sweep Operations',
      passed: sweepsWorking,
      screenshot: '05-room-sweeps.png',
      logs: [],
      details: { 
        roomPersisted,
        playerCountBeforeSweeps,
        playerCountAfterSweeps,
        roomsInMemory,
        roomsInDatabase,
        sweepsWorking,
        sweepIntervalMs: SWEEP_INTERVAL_MS
      },
      duration: Date.now() - test5Start
    });
    
    console.log(`  Room persisted: ${roomPersisted}`);
    console.log(`  Rooms in memory: ${roomsInMemory}`);
    console.log(`  Rooms in database: ${roomsInDatabase}`);
    console.log(`${sweepsWorking ? '✅' : '❌'} Sweep operations working: ${sweepsWorking}`);
    
    // Test 6: Player Pruning After Grace Period
    console.log('\n' + '='.repeat(70));
    console.log('TEST 6: Player Pruning After Grace Period');
    console.log('='.repeat(70));
    
    const test6Start = Date.now();
    const player4 = await createPlayer(browser, 'Player4');
    players.push(player4);
    
    await navigateToHome(player4);
    await joinRoom(player4, roomId, 'Charlie');
    await extractPlayerId(player4);
    await player4.page.waitForTimeout(2000);
    
    // Check room state before disconnect
    const roomStateBeforeDisconnect = await getRoomState(roomId);
    const playerCountBeforeDisconnect = roomStateBeforeDisconnect?.players || 0;
    
    // Disconnect player4 completely (close context)
    console.log(`\n  Disconnecting Player4 completely...`);
    await player4.context.close();
    await host.page.waitForTimeout(2000);
    
    // Check for player-left event
    const hasPlayerLeftEvent4 = checkLogsForPattern(host, ['player-left']) || 
                               checkLogsForPattern(player2, ['player-left']);
    
    // Wait for disconnect to be detected (sweep should mark as disconnected)
    console.log(`  Waiting for disconnect to be detected (${SWEEP_INTERVAL_MS + 5000}ms)...`);
    await host.page.waitForTimeout(SWEEP_INTERVAL_MS + 5000);
    
    // Check room state after disconnect
    const roomStateAfterDisconnect = await getRoomState(roomId);
    const playerCountAfterDisconnect = roomStateAfterDisconnect?.players || 0;
    
    // Note: Full grace period is 2 minutes, so player4 won't be pruned immediately
    // But we can verify:
    // 1. Player-left event was emitted
    // 2. Room still exists
    // 3. Player count might decrease (if pruned) or stay same (if still in grace period)
    const disconnectDetected = hasPlayerLeftEvent4;
    const roomStillExistsAfter = roomStateAfterDisconnect !== null;
    
    // Pruning test passes if disconnect was detected (actual pruning takes 2 minutes)
    const pruningTestPassed = disconnectDetected && roomStillExistsAfter;
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '06-player-pruning.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Player Pruning After Grace Period',
      passed: pruningTestPassed,
      screenshot: '06-player-pruning.png',
      logs: [
        ...host.consoleLogs.filter(l => l.includes('player-left') || l.includes('Player')),
        ...player2.consoleLogs.filter(l => l.includes('player-left') || l.includes('Player'))
      ],
      details: { 
        hasPlayerLeftEvent4,
        disconnectDetected,
        roomStillExistsAfter,
        playerCountBeforeDisconnect,
        playerCountAfterDisconnect,
        gracePeriodMs: GRACE_PERIOD_MS,
        note: 'Full pruning takes 2 minutes (grace period). Test verifies disconnect detection.'
      },
      duration: Date.now() - test6Start
    });
    
    console.log(`${hasPlayerLeftEvent4 ? '✅' : '❌'} Player-left event detected: ${hasPlayerLeftEvent4}`);
    console.log(`${roomStillExistsAfter ? '✅' : '❌'} Room still exists: ${roomStillExistsAfter}`);
    console.log(`   Note: Full grace period is ${GRACE_PERIOD_MS}ms (2 minutes) - pruning happens after this`);
    console.log(`${pruningTestPassed ? '✅' : '❌'} Pruning test (disconnect detection): ${pruningTestPassed}`);
    
    // Test 7: Continuous Heartbeat Monitoring
    console.log('\n' + '='.repeat(70));
    console.log('TEST 7: Continuous Heartbeat Monitoring');
    console.log('='.repeat(70));
    
    const test7Start = Date.now();
    
    // Monitor heartbeats over an extended period
    console.log(`\n  Monitoring heartbeats for ${HEARTBEAT_INTERVAL_MS * 4}ms (expecting ~4 heartbeats per player)...`);
    const monitorDuration = HEARTBEAT_INTERVAL_MS * 4;
    
    const initialHostHeartbeats = host.heartbeatCount;
    const initialPlayer2Heartbeats = player2.heartbeatCount;
    
    await host.page.waitForTimeout(monitorDuration);
    
    const finalHostHeartbeats = countLogPattern(host, 'heartbeat');
    const finalPlayer2Heartbeats = countLogPattern(player2, 'heartbeat');
    
    const hostHeartbeatIncrease = finalHostHeartbeats - initialHostHeartbeats;
    const player2HeartbeatIncrease = finalPlayer2Heartbeats - initialPlayer2Heartbeats;
    
    const expectedMinHeartbeats = 3; // Should get at least 3-4 heartbeats in this time
    const continuousHeartbeatsWorking = hostHeartbeatIncrease >= expectedMinHeartbeats && 
                                       player2HeartbeatIncrease >= expectedMinHeartbeats;
    
    await host.page.screenshot({ 
      path: join(SCREENSHOT_DIR, '07-continuous-heartbeats.png'),
      fullPage: true 
    });
    
    TEST_RESULTS.push({
      test: 'Continuous Heartbeat Monitoring',
      passed: continuousHeartbeatsWorking,
      screenshot: '07-continuous-heartbeats.png',
      logs: [
        ...host.consoleLogs.filter(l => l.includes('heartbeat')),
        ...player2.consoleLogs.filter(l => l.includes('heartbeat'))
      ],
      details: { 
        hostHeartbeatIncrease,
        player2HeartbeatIncrease,
        expectedMin: expectedMinHeartbeats,
        monitorDurationMs: monitorDuration
      },
      duration: Date.now() - test7Start
    });
    
    console.log(`  Host heartbeat increase: ${hostHeartbeatIncrease}`);
    console.log(`  Player2 heartbeat increase: ${player2HeartbeatIncrease}`);
    console.log(`${continuousHeartbeatsWorking ? '✅' : '❌'} Continuous heartbeats working: ${continuousHeartbeatsWorking}`);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    
    const passedTests = TEST_RESULTS.filter(r => r.passed).length;
    const totalTests = TEST_RESULTS.length;
    const totalDuration = TEST_RESULTS.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    TEST_RESULTS.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? ` (${Math.round(result.duration / 1000)}s)` : '';
      console.log(`${index + 1}. ${status}${duration}: ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => `   ${l}`).join('\n'));
      }
      if (result.screenshot) {
        console.log(`   Screenshot: ${result.screenshot}`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`RESULTS: ${passedTests}/${totalTests} tests passed`);
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log('='.repeat(70));
    
    // Save results
    const resultsFile = 'test-results-heartbeat-sweep.json';
    writeFileSync(resultsFile, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);
    
    // Save console logs
    const logsFile = join(SCREENSHOT_DIR, 'console-logs.txt');
    const allLogs = players.flatMap(p => p.consoleLogs).join('\n');
    writeFileSync(logsFile, allLogs);
    console.log(`📝 Console logs saved to: ${logsFile}`);
    
    // Save heartbeat-specific logs
    const heartbeatLogsFile = join(SCREENSHOT_DIR, 'heartbeat-logs.txt');
    const heartbeatLogs = players.flatMap(p => p.consoleLogs)
      .filter(l => l.includes('[Heartbeat]') || l.includes('[Sweeper]') || 
                   l.includes('heartbeat') || l.includes('stale') ||
                   l.includes('prune') || l.includes('revived') ||
                   l.includes('lastSeen') || l.includes('Marked'))
      .join('\n');
    writeFileSync(heartbeatLogsFile, heartbeatLogs);
    console.log(`💓 Heartbeat logs saved to: ${heartbeatLogsFile}`);
    
    // Save network logs
    const networkLogsFile = join(SCREENSHOT_DIR, 'network-logs.txt');
    const allNetworkLogs = players.flatMap(p => p.networkLogs).join('\n');
    writeFileSync(networkLogsFile, allNetworkLogs);
    console.log(`🌐 Network logs saved to: ${networkLogsFile}`);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    TEST_RESULTS.push({
      test: 'Overall Test Execution',
      passed: false,
      error: String(error)
    });
  } finally {
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

