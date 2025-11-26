/**
 * Canvas Synchronization Debug Test
 * 
 * Tests the Paint & Guess canvas system:
 * - Creates a room with drawer and guesser
 * - Draws for 5 seconds with each color
 * - Measures latency between drawer and guesser canvases
 * - Monitors for unexpected RoundSummary popups
 * 
 * Run with: npx tsx scripts/test-canvas-sync-debug.ts
 * 
 * Prerequisites:
 *   1. Start the backend: cd backend && npm run dev
 *   2. Start the frontend: npm run dev
 *   3. Install Playwright browsers: npx playwright install chromium
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

interface LatencyMeasurement {
  timestamp: number;
  drawerTime: number;
  guesserTime: number | null;
  latencyMs: number | null;
  color: string;
  pointCount: number;
}

interface RoundSummaryEvent {
  timestamp: number;
  phase: string;
  roundNumber: number;
  isGameActive: boolean;
  playerCount: number;
  context: string;
}

interface CanvasState {
  timestamp: number;
  objectCount: number;
  objects: Array<{
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    stroke?: string;
    strokeWidth?: number;
    path?: any;
  }>;
  roundNumber: number;
  phase: string;
  // Debug fields (optional)
  fabricCanvasFound?: boolean;
  hasRawContent?: boolean;
  nonTransparentPixels?: number;
}

interface StrokeTracking {
  strokeId: string;
  drawerTimestamp: number;
  guesserTimestamp: number | null;
  color: string;
  pointCount: number;
  drawerObjectCount: number;
  guesserObjectCount: number;
  roundNumber: number;
  status: 'sent' | 'received' | 'missing' | 'lost';
}

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const SCREENSHOT_DIR = 'test-screenshots-canvas-sync';
const DRAW_DURATION_MS = 5000; // 5 seconds per color
const TEST_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#000000'];

// Metrics collection
const latencyMeasurements: LatencyMeasurement[] = [];
const roundSummaryEvents: RoundSummaryEvent[] = [];
const canvasStateHistory: { drawer: CanvasState[]; guesser: CanvasState[] } = {
  drawer: [],
  guesser: [],
};
const strokeTracking: StrokeTracking[] = [];
let drawingStartTime = 0;
let currentRoundNumber = 1;

// Ensure screenshot directory exists
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

async function createRoom(page: Page): Promise<string | null> {
  try {
    console.log('  Creating room...');
    
    // Navigate to Paint & Guess lobby
    await page.goto(`${BASE_URL}/games/paint-and-guess`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take screenshot of lobby
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'lobby-initial.png') });
    
    // Find and fill player name first (it's at the top)
    const playerNameInput = page.locator('input[placeholder*="Enter your name"]').first();
    if (await playerNameInput.isVisible({ timeout: 5000 })) {
      await playerNameInput.fill('Drawer');
      console.log('    Filled player name');
    } else {
      console.log('    Player name input not found, trying alternative');
      const altPlayerInput = page.locator('input').first();
      await altPlayerInput.fill('Drawer');
    }
    
    // Find and fill room name (in the Create Room card)
    const roomNameInput = page.locator('input[placeholder*="Room name"]').first();
    if (await roomNameInput.isVisible({ timeout: 3000 })) {
      await roomNameInput.fill(`TestRoom${Date.now().toString().slice(-4)}`);
      console.log('    Filled room name');
    }
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'lobby-filled.png') });
    
    // Click create room button
    const createButton = page.locator('button:has-text("Create Room")').first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      console.log('    Clicking Create Room button');
      await createButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('    Create Room button not found');
      return null;
    }
    
    // Wait for navigation to room page
    await page.waitForURL(/room\//, { timeout: 10000 });
    
    // Extract room ID from URL
    const url = page.url();
    console.log(`    Current URL: ${url}`);
    const roomIdMatch = url.match(/room\/([^/?]+)/);
    if (roomIdMatch) {
      console.log(`  ✅ Room created: ${roomIdMatch[1]}`);
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'room-created.png') });
      return roomIdMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('  Failed to create room:', error);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'create-room-error.png') }).catch(() => {});
    return null;
  }
}

async function joinRoom(page: Page, roomId: string, playerName: string): Promise<boolean> {
  try {
    console.log(`  ${playerName} joining room ${roomId}...`);
    
    // Navigate to lobby first
    await page.goto(`${BASE_URL}/games/paint-and-guess`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Fill player name
    const playerNameInput = page.locator('input[placeholder*="Enter your name"]').first();
    if (await playerNameInput.isVisible({ timeout: 5000 })) {
      await playerNameInput.fill(playerName);
      console.log(`    ${playerName}: Filled player name`);
    }
    
    // Fill room ID in join section
    const roomIdInput = page.locator('input[placeholder*="Enter room ID"]').first();
    if (await roomIdInput.isVisible({ timeout: 3000 })) {
      await roomIdInput.fill(roomId);
      console.log(`    ${playerName}: Filled room ID`);
    }
    
    await page.screenshot({ path: join(SCREENSHOT_DIR, `join-${playerName}-filled.png`) });
    
    // Click join button
    const joinButton = page.locator('button:has-text("Join Room")').first();
    if (await joinButton.isVisible({ timeout: 3000 })) {
      console.log(`    ${playerName}: Clicking Join Room button`);
      await joinButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Wait for navigation to room page
    await page.waitForURL(/room\//, { timeout: 10000 });
    
    // Wait for room UI to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, `join-${playerName}-success.png`) });
    
    console.log(`  ✅ ${playerName} joined successfully`);
    return true;
  } catch (error) {
    console.error(`  ${playerName} failed to join:`, error);
    await page.screenshot({ path: join(SCREENSHOT_DIR, `join-${playerName}-error.png`) }).catch(() => {});
    return false;
  }
}

async function setupCanvasDebugging(page: Page, label: string): Promise<void> {
  // Inject comprehensive canvas debugging using addScriptTag to avoid serialization issues
  await page.addScriptTag({
    content: `
      (function() {
        const pageLabel = ${JSON.stringify(label)};
        
        // Initialize debug log
        if (!window.__canvasDebugLog) {
          window.__canvasDebugLog = [];
        }
        if (!window.__lastObjectCount) {
          window.__lastObjectCount = 0;
        }
        
        // Store label for later use
        window.__debugLabel = pageLabel;
        
        // Helper function to log (defined at top level to avoid closure issues)
        function addLogEntry(message, data) {
          const entry = {
            timestamp: Date.now(),
            label: window.__debugLabel,
            message: message,
            data: data ? JSON.parse(JSON.stringify(data)) : null,
          };
          window.__canvasDebugLog.push(entry);
          
          // Keep only last 500 entries
          const log = window.__canvasDebugLog;
          if (log.length > 500) {
            log.shift();
          }
        }
        
        // Monitor canvas object changes
        function monitorCanvas() {
          try {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;
            
            const fabricCanvas = canvas.__canvas;
            if (!fabricCanvas || typeof fabricCanvas.getObjects !== 'function') return;
            
            const objects = fabricCanvas.getObjects();
            const currentCount = objects.length;
            const lastCount = window.__lastObjectCount || 0;
            
            if (currentCount !== lastCount) {
              const diff = currentCount - lastCount;
              addLogEntry('Canvas object count changed: ' + lastCount + ' → ' + currentCount + ' (' + (diff > 0 ? '+' : '') + diff + ')', {
                previousCount: lastCount,
                currentCount: currentCount,
                diff: diff,
                objectTypes: objects.map(function(obj) { return obj.type || 'unknown'; }),
              });
              window.__lastObjectCount = currentCount;
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Monitor every 200ms
        setInterval(monitorCanvas, 200);
        
        // Monitor drawing events
        window.addEventListener('drawing-event', function(event) {
          const detail = event.detail || {};
          addLogEntry('Drawing event received', {
            type: detail.type || 'unknown',
            pathId: detail.pathId || null,
            pointCount: (detail.data && detail.data.path && detail.data.path.length) || detail.pointCount || 0,
          });
        });
        
        // Monitor canvas clear events
        window.addEventListener('canvas-cleared', function() {
          addLogEntry('Canvas cleared event received', null);
          window.__lastObjectCount = 0;
        });
        
        // Monitor round events
        window.addEventListener('round-started', function() {
          addLogEntry('Round started event received', null);
          window.__lastObjectCount = 0;
        });
        
        window.addEventListener('round-ended', function() {
          addLogEntry('Round ended event received', null);
        });
        
        addLogEntry('Canvas debugging initialized', null);
      })();
    `,
  });
}

async function setupRoundSummaryMonitor(page: Page, label: string): Promise<void> {
  // Inject monitoring script into the page
  await page.evaluate((pageLabel) => {
    // Store events on window for later retrieval
    (window as any).__roundSummaryEvents = (window as any).__roundSummaryEvents || [];
    
    // Create a MutationObserver to watch for RoundSummary overlay
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Check if this is a RoundSummary overlay
            const isRoundSummary = 
              node.classList.contains('fixed') ||
              node.querySelector('.fixed.inset-0') ||
              node.textContent?.includes('Round') && node.textContent?.includes('Complete') ||
              node.textContent?.includes('Game Over');
            
            if (isRoundSummary) {
              const event = {
                timestamp: Date.now(),
                pageLabel,
                elementText: node.textContent?.substring(0, 100),
                className: node.className,
              };
              (window as any).__roundSummaryEvents.push(event);
              console.log(`🚨 [${pageLabel}] RoundSummary detected:`, event);
            }
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also monitor game state changes
    const originalDispatchEvent = window.dispatchEvent.bind(window);
    window.dispatchEvent = function(event: Event) {
      if (event.type === 'round-ended' || event.type === 'game-ended') {
        (window as any).__roundSummaryEvents.push({
          timestamp: Date.now(),
          pageLabel,
          eventType: event.type,
          detail: (event as CustomEvent).detail,
        });
        console.log(`🚨 [${pageLabel}] ${event.type} event dispatched`);
      }
      return originalDispatchEvent(event);
    };
  }, label);
}

async function setupLatencyMonitor(page: Page, isDrawer: boolean): Promise<void> {
  await page.evaluate((drawer) => {
    (window as any).__canvasEvents = (window as any).__canvasEvents || [];
    (window as any).__canvasStateHistory = (window as any).__canvasStateHistory || [];
    (window as any).__isDrawer = drawer;
    
    // Add our own listener to track drawing events without overriding window.addEventListener
    // This is safer and won't interfere with React's event handling
    window.addEventListener('drawing-event', function(event: Event) {
      const receiveTime = Date.now();
      const customEvent = event as CustomEvent;
      (window as any).__canvasEvents.push({
        timestamp: receiveTime,
        type: customEvent.detail?.type,
        pathId: customEvent.detail?.pathId,
        pointCount: customEvent.detail?.data?.path?.length || 0,
        color: customEvent.detail?.data?.stroke || customEvent.detail?.color,
        strokeWidth: customEvent.detail?.data?.strokeWidth || customEvent.detail?.width,
      });
    });
    
    // Monitor canvas state changes
    const canvasStateInterval = setInterval(() => {
      try {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        
        const fabricCanvas = (canvas as any).__canvas;
        if (!fabricCanvas || typeof fabricCanvas.getObjects !== 'function') return;
        
        const objects = fabricCanvas.getObjects();
        const state = {
          timestamp: Date.now(),
          objectCount: objects.length,
          objects: objects.map((obj: any) => ({
            type: obj.type,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            path: obj.path ? JSON.stringify(obj.path).substring(0, 100) : null,
          })),
        };
        
        (window as any).__canvasStateHistory.push(state);
        
        // Keep only last 100 states
        if ((window as any).__canvasStateHistory.length > 100) {
          (window as any).__canvasStateHistory.shift();
        }
      } catch (e) {
        // Ignore errors
      }
    }, 500); // Check every 500ms
    
    // Store interval ID for cleanup
    (window as any).__canvasStateInterval = canvasStateInterval;
    
    console.log(`[${drawer ? 'Drawer' : 'Guesser'}] Latency monitor installed`);
  }, isDrawer);
}

async function getDetailedCanvasState(page: Page, label: string): Promise<CanvasState | null> {
  try {
    const state = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        return null;
      }
      
      // Try to access Fabric.js canvas instance - use successful pattern from avatar test
      let fabricCanvas: any = null;
      const canvasAny = canvas as any;
      
      // Method 1: Direct property (Fabric.js v5/v6 pattern)
      if (canvasAny.__canvas) {
        fabricCanvas = canvasAny.__canvas;
      }
      // Method 2: Window global (some setups)
      else if ((window as any).fabric?.Canvas?.activeInstance) {
        fabricCanvas = (window as any).fabric.Canvas.activeInstance;
      }
      // Method 3: Try other common property names
      else if (canvasAny.fabricCanvas) {
        fabricCanvas = canvasAny.fabricCanvas;
      }
      else if (canvasAny._fabricCanvas) {
        fabricCanvas = canvasAny._fabricCanvas;
      }
      // Method 4: Try accessing via all properties (including non-enumerable)
      else {
        // Try common property names
        const possibleNames = ['__canvas', 'fabricCanvas', '_fabricCanvas', 'canvas', 'fabric'];
        for (const name of possibleNames) {
          try {
            const candidate = canvasAny[name];
            if (candidate && typeof candidate.getObjects === 'function') {
              fabricCanvas = candidate;
              break;
            }
          } catch (e) {
            // Property might not be accessible
          }
        }
      }
      
      // Try to get objects from Fabric.js canvas
      let fabricObjectCount = 0;
      let fabricObjects: any[] = [];
      
      if (fabricCanvas && typeof fabricCanvas.getObjects === 'function') {
        try {
          const objects = fabricCanvas.getObjects();
          fabricObjectCount = objects.length;
          fabricObjects = objects.map((obj: any) => ({
            type: obj.type || 'unknown',
            left: obj.left || 0,
            top: obj.top || 0,
            width: obj.width || 0,
            height: obj.height || 0,
            stroke: obj.stroke || null,
            strokeWidth: obj.strokeWidth || null,
            path: obj.path ? (Array.isArray(obj.path) ? obj.path.length : 'path') : null,
          }));
        } catch (e) {
          // Error getting objects
        }
      }
      
      // Fallback: Check raw canvas pixel data (like avatar test does)
      // This helps verify if drawing is happening even if Fabric.js isn't accessible
      const ctx = canvas.getContext('2d');
      let nonTransparentPixels = 0;
      let hasRawContent = false;
      
      if (ctx) {
        try {
          // Sample a portion of the canvas to check for content
          const sampleSize = Math.min(canvas.width, canvas.height, 200);
          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const pixels = imageData.data;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) {
              nonTransparentPixels++;
            }
          }
          // Threshold: if we have more than 100 non-transparent pixels, there's content
          hasRawContent = nonTransparentPixels > 100;
        } catch (e) {
          // Might fail due to CORS or other issues
        }
      }
      
      // Return state - prefer Fabric.js objects, but include pixel data as fallback
      return {
        timestamp: Date.now(),
        objectCount: fabricObjectCount > 0 ? fabricObjectCount : (hasRawContent ? -1 : 0), // -1 indicates content detected via pixels
        objects: fabricObjects,
        roundNumber: 0,
        phase: 'unknown',
        // Additional debug info
        fabricCanvasFound: !!fabricCanvas,
        hasRawContent,
        nonTransparentPixels,
      } as any;
    });
    
    if (state) {
      state.roundNumber = currentRoundNumber;
    }
    
    return state;
  } catch (error) {
    console.error(`  Error getting canvas state for ${label}:`, error);
    return null;
  }
}

async function getReadyAndStartGame(
  drawerPage: Page, 
  guesserPage: Page,
  drawerConsoleErrors: string[],
  guesserConsoleErrors: string[]
): Promise<boolean> {
  try {
    console.log('  Setting players ready...');
    
    // Take screenshots before ready
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, 'before-ready-drawer.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, 'before-ready-guesser.png') });
    
    // Click ready on both pages
    for (const [page, label] of [[drawerPage, 'Drawer'] as const, [guesserPage, 'Guesser'] as const]) {
      const readyButton = page.locator('button:has-text("Ready"), button:has-text("I\'m Ready")').first();
      if (await readyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`    ${label}: Clicking ready button`);
        await readyButton.click();
        await page.waitForTimeout(500);
      } else {
        console.log(`    ${label}: Ready button not found, checking page state...`);
        // Debug: check what buttons are available
        const allButtons = await page.locator('button').all();
        const buttonTexts = await Promise.all(
          allButtons.slice(0, 10).map(async btn => {
            try {
              return await btn.textContent();
            } catch {
              return null;
            }
          })
        );
        console.log(`    ${label}: Available buttons: ${buttonTexts.filter(Boolean).join(', ')}`);
      }
    }
    
    await drawerPage.waitForTimeout(1000);
    
    // Take screenshots after ready
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, 'after-ready-drawer.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, 'after-ready-guesser.png') });
    
    // Start game (host only)
    console.log('  Starting game...');
    const startButton = drawerPage.locator('button:has-text("Start Game"), button:has-text("Start")').first();
    if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('    Clicking Start Game button');
      await startButton.click();
      await drawerPage.waitForTimeout(3000);
    } else {
      console.log('    Start Game button not found');
      // Debug: check page state
      const pageState = await drawerPage.evaluate(() => {
        return {
          url: window.location.href,
          hasCanvas: !!document.querySelector('canvas'),
          bodyText: document.body.textContent?.substring(0, 200),
        };
      });
      console.log('    Drawer page state:', pageState);
    }
    
    // Take screenshots after start click
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, 'after-start-click-drawer.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, 'after-start-click-guesser.png') });
    
    // Wait for game to start (canvas should appear)
    console.log('  Waiting for canvas to appear...');
    
    // Check for errors first
    const drawerReactErrors = await drawerPage.evaluate(() => {
      return (window as any).__reactErrors || [];
    });
    const guesserReactErrors = await guesserPage.evaluate(() => {
      return (window as any).__reactErrors || [];
    });
    
    if (drawerReactErrors.length > 0) {
      console.log(`    ⚠️ Drawer has ${drawerReactErrors.length} React errors:`);
      drawerReactErrors.forEach((err: any, i: number) => {
        console.log(`      ${i + 1}. ${err.message}`);
        if (err.stack) console.log(`         ${err.stack.substring(0, 200)}...`);
      });
    }
    if (guesserReactErrors.length > 0) {
      console.log(`    ⚠️ Guesser has ${guesserReactErrors.length} React errors:`);
      guesserReactErrors.forEach((err: any, i: number) => {
        console.log(`      ${i + 1}. ${err.message}`);
        if (err.stack) console.log(`         ${err.stack.substring(0, 200)}...`);
      });
    }
    
    if (drawerConsoleErrors.length > 0) {
      console.log(`    ⚠️ Drawer has ${drawerConsoleErrors.length} console errors`);
    }
    if (guesserConsoleErrors.length > 0) {
      console.log(`    ⚠️ Guesser has ${guesserConsoleErrors.length} console errors`);
    }
    
    // Try to wait for canvas with longer timeout and better error handling
    try {
      await drawerPage.waitForSelector('canvas', { timeout: 15000, state: 'attached' });
      console.log('    Drawer canvas found');
    } catch (e) {
      console.error('    Drawer canvas not found after 15s');
      // Debug: check what's on the page
      const drawerDebug = await drawerPage.evaluate(() => {
        return {
          hasCanvas: !!document.querySelector('canvas'),
          canvasCount: document.querySelectorAll('canvas').length,
          bodyHTML: document.body.innerHTML.substring(0, 500),
        };
      });
      console.log('    Drawer debug:', drawerDebug);
      throw e;
    }
    
    try {
      await guesserPage.waitForSelector('canvas', { timeout: 15000, state: 'attached' });
      console.log('    Guesser canvas found');
    } catch (e) {
      console.error('    Guesser canvas not found after 15s');
      // Debug: check what's on the page
      const guesserDebug = await guesserPage.evaluate(() => {
        return {
          hasCanvas: !!document.querySelector('canvas'),
          canvasCount: document.querySelectorAll('canvas').length,
          bodyHTML: document.body.innerHTML.substring(0, 500),
        };
      });
      console.log('    Guesser debug:', guesserDebug);
      throw e;
    }
    
    // Wait a bit more for canvas to be fully initialized
    await drawerPage.waitForTimeout(1000);
    await guesserPage.waitForTimeout(1000);
    
    console.log('  ✅ Game started!');
    return true;
  } catch (error) {
    console.error('  ❌ Failed to start game:', error);
    
    // Take error screenshots
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, 'error-start-game-drawer.png') }).catch(() => {});
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, 'error-start-game-guesser.png') }).catch(() => {});
    
    return false;
  }
}

async function drawWithColor(
  drawerPage: Page, 
  guesserPage: Page, 
  color: string, 
  durationMs: number
): Promise<void> {
  console.log(`\n  Drawing with color ${color} for ${durationMs / 1000}s...`);
  
  // Screenshot before drawing
  await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, `drawer-before-${color.replace('#', '')}.png`) });
  await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, `guesser-before-${color.replace('#', '')}.png`) });
  
  // Try to change color in the color palette
  try {
    // Look for color palette buttons
    const colorButton = drawerPage.locator(`button[style*="${color}"], div[style*="${color}"]`).first();
    if (await colorButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await colorButton.click();
    } else {
      // Try color input
      const colorInput = drawerPage.locator('input[type="color"]').first();
      if (await colorInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await colorInput.evaluate((el: HTMLInputElement, val: string) => {
          el.value = val;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, color);
      }
    }
  } catch (e) {
    console.log(`    Could not change color, using default`);
  }
  
  await drawerPage.waitForTimeout(200);
  
  // Get canvas bounds
  const canvas = drawerPage.locator('canvas').first();
  const box = await canvas.boundingBox();
  
  if (!box) {
    console.error('    Canvas not found!');
    return;
  }
  
  // Record start time
  const startTime = Date.now();
  drawingStartTime = startTime;
  
  // Draw continuously for the specified duration
  let strokeCount = 0;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const radius = Math.min(box.width, box.height) * 0.3;
  
  while (Date.now() - startTime < durationMs) {
    strokeCount++;
    
    // Inject timestamp before drawing
    const drawStartTimestamp = Date.now();
    await drawerPage.evaluate((ts) => {
      (window as any).__lastDrawStartTime = ts;
    }, drawStartTimestamp);
    
    // Verify canvas is in drawing mode before attempting to draw
    const canvasReady = await drawerPage.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { ready: false, reason: 'No canvas element' };
      
      const fabricCanvas = (canvas as any).__canvas;
      if (!fabricCanvas) return { ready: false, reason: 'No Fabric.js canvas' };
      
      const isDrawingMode = fabricCanvas.isDrawingMode;
      const objectCount = fabricCanvas.getObjects().length;
      
      return {
        ready: isDrawingMode === true,
        isDrawingMode,
        objectCount,
        reason: isDrawingMode ? 'Ready' : 'Canvas not in drawing mode',
      };
    });
    
    if (!canvasReady.ready && strokeCount === 1) {
      console.log(`    ⚠️ Canvas not ready for drawing: ${canvasReady.reason}`);
      console.log(`       isDrawingMode: ${canvasReady.isDrawingMode}, current objects: ${canvasReady.objectCount}`);
    }
    
    // Get canvas element and its bounding box for accurate coordinates
    const canvasElement = drawerPage.locator('canvas').first();
    const canvasBox = await canvasElement.boundingBox();
    if (!canvasBox) {
      console.error('    ❌ Cannot get canvas bounding box');
      return;
    }
    
    // Calculate coordinates using successful pattern from drawable avatar test
    // Draw from center outward in different directions
    const angle = (strokeCount * 30) * (Math.PI / 180);
    const centerX = canvasBox.x + canvasBox.width * 0.5;
    const centerY = canvasBox.y + canvasBox.height * 0.5;
    const radius = Math.min(canvasBox.width, canvasBox.height) * 0.3;
    
    const startX = centerX + Math.cos(angle) * 20;
    const startY = centerY + Math.sin(angle) * 20;
    const endX = centerX + Math.cos(angle) * radius;
    const endY = centerY + Math.sin(angle) * radius;
    
    // Draw using successful pattern: move to start, wait, down, wait, move with steps, wait, up, wait
    await drawerPage.mouse.move(startX, startY);
    await drawerPage.waitForTimeout(100); // Wait before starting (successful pattern)
    
    await drawerPage.mouse.down();
    await drawerPage.waitForTimeout(50); // Wait after mouse down (successful pattern)
    
    // Use steps parameter for smoother drawing (key difference from before)
    await drawerPage.mouse.move(endX, endY, { steps: 10 });
    await drawerPage.waitForTimeout(50); // Wait before mouse up (successful pattern)
    
    await drawerPage.mouse.up();
    await drawerPage.waitForTimeout(500); // Wait for path:created event (successful pattern uses 500ms)
    
    // Check if a path was actually created on the drawer canvas (using successful pattern)
    const drawerCheck = await drawerPage.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { created: false, count: 0, error: 'Canvas not found' };
      
      // Try to access Fabric.js canvas instance (successful pattern)
      const fabricCanvas = (canvas as any).__canvas || (window as any).fabric?.Canvas?.activeInstance;
      
      if (!fabricCanvas || typeof fabricCanvas.getObjects !== 'function') {
        return { created: false, count: 0, error: 'Fabric canvas not accessible' };
      }
      
      try {
        const objects = fabricCanvas.getObjects();
        const count = objects.length;
        return { 
          created: count > 0, 
          count,
          objectTypes: objects.map((obj: any) => obj.type || 'unknown'),
        };
      } catch (e) {
        return { created: false, count: 0, error: `Error getting objects: ${e}` };
      }
    });
    
    if (!drawerCheck.created && strokeCount <= 3) {
      console.log(`    ⚠️ Stroke ${strokeCount}: No path created on drawer canvas`);
      console.log(`       Object count: ${drawerCheck.count}, Error: ${drawerCheck.error || 'none'}`);
      if (drawerCheck.objectTypes) {
        console.log(`       Existing object types: ${drawerCheck.objectTypes.join(', ')}`);
      }
    }
    
    // Wait for path-complete event to process (enlivenObjects is async)
    // Using successful pattern: already waited 500ms after mouse.up(), now wait a bit more for sync
    await drawerPage.waitForTimeout(300);
    await guesserPage.waitForTimeout(300);
    
    // Wait for objects to appear on guesser canvas (path-complete is async)
    // Give it a few attempts with reasonable delays
    let attempts = 0;
    let guesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
    while (guesserState && guesserState.objectCount === 0 && attempts < 5) {
      await guesserPage.waitForTimeout(200); // Longer delay between attempts
      guesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
      attempts++;
    }
    
    // Get detailed canvas states
    const drawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
    if (!guesserState) {
      guesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
    }
    
    if (drawerState) {
      canvasStateHistory.drawer.push(drawerState);
    }
    if (guesserState) {
      canvasStateHistory.guesser.push(guesserState);
    }
    
    // Record stroke tracking
    const strokeId = `stroke-${drawStartTimestamp}-${strokeCount}`;
    // Handle pixel-based detection: -1 means content detected via pixels but Fabric.js not accessible
    const guesserObjectCount = guesserState?.objectCount === -1 ? 1 : (guesserState?.objectCount || 0);
    const drawerObjectCount = drawerState?.objectCount === -1 ? 1 : (drawerState?.objectCount || 0);
    const pointCount = 10; // Number of steps in the mouse movement
    
    // Log detection method if pixel-based
    if (strokeCount <= 3) {
      if (drawerState?.hasRawContent && drawerState?.objectCount === -1) {
        console.log(`    ℹ️ Drawer: Content detected via pixel analysis (Fabric.js not accessible)`);
      }
      if (guesserState?.hasRawContent && guesserState?.objectCount === -1) {
        console.log(`    ℹ️ Guesser: Content detected via pixel analysis (Fabric.js not accessible)`);
      }
      if (drawerState?.fabricCanvasFound === false) {
        console.log(`    ⚠️ Drawer: Fabric.js canvas not found, using pixel-based detection`);
      }
      if (guesserState?.fabricCanvasFound === false) {
        console.log(`    ⚠️ Guesser: Fabric.js canvas not found, using pixel-based detection`);
      }
    }
    
    strokeTracking.push({
      strokeId,
      drawerTimestamp: drawStartTimestamp,
      guesserTimestamp: guesserState?.timestamp || null,
      color,
      pointCount,
      drawerObjectCount,
      guesserObjectCount,
      roundNumber: currentRoundNumber,
      status: guesserState && (guesserState.objectCount >= drawerObjectCount || (guesserState.objectCount === -1 && drawerObjectCount > 0)) ? 'received' : 
              guesserState && guesserState.objectCount < drawerObjectCount && guesserState.objectCount !== -1 ? 'missing' : 'sent',
    });
    
    // Record latency measurement
    const latency = guesserState ? (guesserState.timestamp - drawStartTimestamp) : null;
    if (latency !== null && guesserState) {
      latencyMeasurements.push({
        timestamp: drawStartTimestamp,
        drawerTime: drawStartTimestamp,
        guesserTime: guesserState.timestamp,
        latencyMs: latency,
        color,
        pointCount,
      });
    }
    
    // Log every 5 strokes with detailed info
    if (strokeCount % 5 === 0) {
      const drawerCount = drawerState?.objectCount === -1 ? 'pixels' : drawerObjectCount.toString();
      const guesserCount = guesserState?.objectCount === -1 ? 'pixels' : guesserObjectCount.toString();
      const objectDiff = drawerObjectCount - guesserObjectCount;
      const statusIcon = objectDiff === 0 ? '✅' : objectDiff > 0 ? '⚠️' : '❌';
      console.log(`    ${statusIcon} Stroke ${strokeCount}: latency ${latency !== null ? `~${latency}ms` : 'N/A'}, ` +
                  `Drawer: ${drawerCount} objects, Guesser: ${guesserCount} objects ` +
                  `${objectDiff !== 0 ? `(diff: ${objectDiff > 0 ? '+' : ''}${objectDiff})` : ''}`);
      
      if (objectDiff > 0 && guesserState?.objectCount !== -1) {
        console.log(`      ⚠️ Guesser is missing ${objectDiff} object(s)!`);
      }
    }
    
    // Check for unexpected RoundSummary
    const roundSummaryVisible = await guesserPage.locator('.fixed.inset-0:has-text("Round"), .fixed.inset-0:has-text("Game Over")').isVisible({ timeout: 100 }).catch(() => false);
    if (roundSummaryVisible) {
      console.log(`    🚨 UNEXPECTED: RoundSummary appeared during drawing!`);
      roundSummaryEvents.push({
        timestamp: Date.now(),
        phase: 'drawing',
        roundNumber: 0,
        isGameActive: true,
        playerCount: 2,
        context: `During color ${color} drawing at stroke ${strokeCount}`,
      });
      
      // Take screenshot
      await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, `unexpected-round-summary-${Date.now()}.png`) });
    }
    
    // Small delay between strokes
    await drawerPage.waitForTimeout(100);
  }
  
  const endTime = Date.now();
  console.log(`    Completed ${strokeCount} strokes in ${(endTime - startTime) / 1000}s`);
  
  // Wait a bit for final synchronization
  await drawerPage.waitForTimeout(500);
  await guesserPage.waitForTimeout(500);
  
  // Get final detailed canvas states
  const finalDrawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
  const finalGuesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
  
  if (finalDrawerState) canvasStateHistory.drawer.push(finalDrawerState);
  if (finalGuesserState) canvasStateHistory.guesser.push(finalGuesserState);
  
  // Screenshot after drawing
  await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, `drawer-after-${color.replace('#', '')}.png`) });
  await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, `guesser-after-${color.replace('#', '')}.png`) });
  
  // Detailed comparison
  console.log(`\n    📊 Final Canvas State Comparison:`);
  const drawerCountDisplay = finalDrawerState?.objectCount === -1 
    ? `pixel-based detection (${finalDrawerState.nonTransparentPixels || 0} non-transparent pixels)`
    : `${finalDrawerState?.objectCount || 0} objects`;
  const guesserCountDisplay = finalGuesserState?.objectCount === -1 
    ? `pixel-based detection (${finalGuesserState.nonTransparentPixels || 0} non-transparent pixels)`
    : `${finalGuesserState?.objectCount || 0} objects`;
  console.log(`      Drawer: ${drawerCountDisplay}`);
  console.log(`      Guesser: ${guesserCountDisplay}`);
  
  if (finalDrawerState && finalGuesserState) {
    const drawerCount = finalDrawerState.objectCount === -1 ? 1 : finalDrawerState.objectCount;
    const guesserCount = finalGuesserState.objectCount === -1 ? 1 : finalGuesserState.objectCount;
    const objectDiff = drawerCount - guesserCount;
    if (objectDiff !== 0) {
      console.log(`      ⚠️ MISMATCH: Drawer has ${objectDiff > 0 ? '+' : ''}${objectDiff} more objects`);
      
      // Show object details
      if (finalDrawerState.objects.length > 0) {
        console.log(`\n      Drawer objects (first 5):`);
        finalDrawerState.objects.slice(0, 5).forEach((obj, i) => {
          console.log(`        ${i + 1}. ${obj.type} at (${obj.left.toFixed(0)}, ${obj.top.toFixed(0)}), ` +
                      `stroke: ${obj.stroke || 'none'}, width: ${obj.strokeWidth || 'N/A'}`);
        });
      }
      
      if (finalGuesserState.objects.length > 0) {
        console.log(`\n      Guesser objects (first 5):`);
        finalGuesserState.objects.slice(0, 5).forEach((obj, i) => {
          console.log(`        ${i + 1}. ${obj.type} at (${obj.left.toFixed(0)}, ${obj.top.toFixed(0)}), ` +
                      `stroke: ${obj.stroke || 'none'}, width: ${obj.strokeWidth || 'N/A'}`);
        });
      }
    } else {
      console.log(`      ✅ Object counts match!`);
    }
  }
  
  // Analyze stroke tracking for this color
  const colorStrokes = strokeTracking.filter(s => s.color === color && s.roundNumber === currentRoundNumber);
  const receivedStrokes = colorStrokes.filter(s => s.status === 'received');
  const missingStrokes = colorStrokes.filter(s => s.status === 'missing');
  
  if (missingStrokes.length > 0) {
    console.log(`\n    ⚠️ Stroke Loss Analysis for ${color}:`);
    console.log(`      Total strokes: ${colorStrokes.length}`);
    console.log(`      Received: ${receivedStrokes.length} (${(receivedStrokes.length / colorStrokes.length * 100).toFixed(1)}%)`);
    console.log(`      Missing: ${missingStrokes.length} (${(missingStrokes.length / colorStrokes.length * 100).toFixed(1)}%)`);
  }
}

async function trackRoundTransition(
  drawerPage: Page,
  guesserPage: Page,
  roundNumber: number
): Promise<void> {
  console.log(`\n  🔄 Tracking Round ${roundNumber} Transition...`);
  
  // Get canvas states before transition
  const beforeDrawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
  const beforeGuesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
  
  console.log(`    Before transition:`);
  console.log(`      Drawer: ${beforeDrawerState?.objectCount || 0} objects`);
  console.log(`      Guesser: ${beforeGuesserState?.objectCount || 0} objects`);
  
  // Wait for round transition (if any)
  await drawerPage.waitForTimeout(2000);
  await guesserPage.waitForTimeout(2000);
  
  // Get canvas states after transition
  const afterDrawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
  const afterGuesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
  
  console.log(`    After transition:`);
  console.log(`      Drawer: ${afterDrawerState?.objectCount || 0} objects`);
  console.log(`      Guesser: ${afterGuesserState?.objectCount || 0} objects`);
  
  // Check if canvas was cleared
  const drawerCleared = (beforeDrawerState?.objectCount || 0) > 0 && (afterDrawerState?.objectCount || 0) === 0;
  const guesserCleared = (beforeGuesserState?.objectCount || 0) > 0 && (afterGuesserState?.objectCount || 0) === 0;
  
  if (drawerCleared && !guesserCleared) {
    console.log(`    ⚠️ Drawer canvas cleared but guesser still has ${afterGuesserState?.objectCount} objects!`);
  } else if (!drawerCleared && guesserCleared) {
    console.log(`    ⚠️ Guesser canvas cleared but drawer still has ${afterDrawerState?.objectCount} objects!`);
  } else if (drawerCleared && guesserCleared) {
    console.log(`    ✅ Both canvases cleared properly`);
  } else {
    console.log(`    ℹ️ Canvas state: Drawer ${afterDrawerState?.objectCount || 0}, Guesser ${afterGuesserState?.objectCount || 0}`);
  }
  
  // Store states
  if (beforeDrawerState) canvasStateHistory.drawer.push(beforeDrawerState);
  if (beforeGuesserState) canvasStateHistory.guesser.push(beforeGuesserState);
  if (afterDrawerState) canvasStateHistory.drawer.push(afterDrawerState);
  if (afterGuesserState) canvasStateHistory.guesser.push(afterGuesserState);
  
  // Screenshot
  await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, `round-${roundNumber}-drawer.png`) });
  await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, `round-${roundNumber}-guesser.png`) });
}

async function checkForRoundSummaryPopups(page: Page, label: string): Promise<RoundSummaryEvent[]> {
  const events: RoundSummaryEvent[] = [];
  
  // Check if RoundSummary is currently visible
  const roundSummarySelectors = [
    '.fixed.inset-0:has-text("Round")',
    '.fixed.inset-0:has-text("Complete")',
    '.fixed.inset-0:has-text("Game Over")',
    'div:has(> div:has-text("Round") > div:has-text("Complete"))',
  ];
  
  for (const selector of roundSummarySelectors) {
    const isVisible = await page.locator(selector).isVisible({ timeout: 100 }).catch(() => false);
    if (isVisible) {
      // Get more details
      const details = await page.evaluate(() => {
        const overlay = document.querySelector('.fixed.inset-0');
        return {
          text: overlay?.textContent?.substring(0, 200),
          className: overlay?.className,
        };
      });
      
      events.push({
        timestamp: Date.now(),
        phase: 'unexpected',
        roundNumber: 0,
        isGameActive: true,
        playerCount: 2,
        context: `${label}: ${details.text}`,
      });
      
      console.log(`  🚨 [${label}] RoundSummary detected: ${details.text?.substring(0, 50)}...`);
    }
  }
  
  // Also get events collected by the monitor
  const monitoredEvents = await page.evaluate(() => {
    return (window as any).__roundSummaryEvents || [];
  });
  
  events.push(...monitoredEvents.map((e: any) => ({
    ...e,
    context: `${label} monitor: ${e.elementText || e.eventType}`,
  })));
  
  return events;
}

async function runCanvasSyncTest() {
  console.log('🧪 Canvas Synchronization Debug Test\n');
  console.log(`📍 Testing URL: ${BASE_URL}`);
  console.log(`🎨 Colors to test: ${TEST_COLORS.join(', ')}`);
  console.log(`⏱️ Draw duration per color: ${DRAW_DURATION_MS / 1000}s\n`);
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });
  
  let drawerContext: BrowserContext | null = null;
  let guesserContext: BrowserContext | null = null;
  let drawerPage: Page | null = null;
  let guesserPage: Page | null = null;
  
  try {
    // Create two browser contexts (simulates two different users)
    drawerContext = await browser.newContext();
    guesserContext = await browser.newContext();
    
    // Enable canvas sync debugging BEFORE creating pages (so it's available when components mount)
    await drawerContext.addInitScript(() => {
      (window as any).__DEBUG_CANVAS_SYNC__ = true;
    });
    await guesserContext.addInitScript(() => {
      (window as any).__DEBUG_CANVAS_SYNC__ = true;
    });
    
    drawerPage = await drawerContext.newPage();
    guesserPage = await guesserContext.newPage();
    
    // Set up console logging - capture all console messages
    const drawerConsoleErrors: string[] = [];
    const guesserConsoleErrors: string[] = [];
    
    drawerPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log(`  [Drawer Console Error] ${text}`);
        drawerConsoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        console.log(`  [Drawer Console Warning] ${text}`);
      }
    });
    
    guesserPage.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log(`  [Guesser Console Error] ${text}`);
        guesserConsoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        console.log(`  [Guesser Console Warning] ${text}`);
      }
    });
    
    // Capture page errors
    drawerPage.on('pageerror', error => {
      console.log(`  [Drawer Page Error] ${error.message}`);
      console.log(`  [Drawer Page Error Stack] ${error.stack}`);
      drawerConsoleErrors.push(`Page Error: ${error.message}\n${error.stack}`);
    });
    
    guesserPage.on('pageerror', error => {
      console.log(`  [Guesser Page Error] ${error.message}`);
      console.log(`  [Guesser Page Error Stack] ${error.stack}`);
      guesserConsoleErrors.push(`Page Error: ${error.message}\n${error.stack}`);
    });
    
    // Inject error capture for React errors
    await drawerPage.evaluate(() => {
      (window as any).__reactErrors = [];
      const originalError = window.onerror;
      window.onerror = function(msg, url, line, col, error) {
        (window as any).__reactErrors.push({
          message: msg,
          url,
          line,
          col,
          stack: error?.stack,
        });
        if (originalError) return originalError(msg, url, line, col, error);
        return false;
      };
    });
    
    await guesserPage.evaluate(() => {
      (window as any).__reactErrors = [];
      const originalError = window.onerror;
      window.onerror = function(msg, url, line, col, error) {
        (window as any).__reactErrors.push({
          message: msg,
          url,
          line,
          col,
          stack: error?.stack,
        });
        if (originalError) return originalError(msg, url, line, col, error);
        return false;
      };
    });
    
    // Step 1: Create room
    console.log('1. Creating room...');
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, '01-initial.png') });
    
    const roomId = await createRoom(drawerPage);
    if (!roomId) {
      throw new Error('Failed to create room');
    }
    
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, '02-room-created.png') });
    
    // Step 2: Join room with guesser
    console.log('\n2. Joining room with guesser...');
    const joined = await joinRoom(guesserPage, roomId, 'Guesser');
    if (!joined) {
      throw new Error('Guesser failed to join room');
    }
    
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, '03-drawer-waiting.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, '03-guesser-joined.png') });
    
    // Step 3: Set up monitors
    console.log('\n3. Setting up monitors...');
    
    // Verify debug flag is set (it should be from addInitScript, but double-check)
    const drawerDebugEnabled = await drawerPage.evaluate(() => {
      return !!(window as any).__DEBUG_CANVAS_SYNC__;
    });
    const guesserDebugEnabled = await guesserPage.evaluate(() => {
      return !!(window as any).__DEBUG_CANVAS_SYNC__;
    });
    
    if (!drawerDebugEnabled || !guesserDebugEnabled) {
      console.log('    ⚠️ Debug flag not set, setting it now...');
      await drawerPage.evaluate(() => {
        (window as any).__DEBUG_CANVAS_SYNC__ = true;
      });
      await guesserPage.evaluate(() => {
        (window as any).__DEBUG_CANVAS_SYNC__ = true;
      });
    }
    
    // Verify debug object exists
    const drawerDebugExists = await drawerPage.evaluate(() => {
      return !!(window as any).__canvasSyncDebug;
    });
    const guesserDebugExists = await guesserPage.evaluate(() => {
      return !!(window as any).__canvasSyncDebug;
    });
    
    console.log(`    ✅ Canvas sync debugging: Drawer=${drawerDebugEnabled && drawerDebugExists}, Guesser=${guesserDebugEnabled && guesserDebugExists}`);
    
    await setupRoundSummaryMonitor(drawerPage, 'Drawer');
    await setupRoundSummaryMonitor(guesserPage, 'Guesser');
    await setupLatencyMonitor(drawerPage, true);
    await setupLatencyMonitor(guesserPage, false);
    await setupCanvasDebugging(drawerPage, 'Drawer');
    await setupCanvasDebugging(guesserPage, 'Guesser');
    
    // Step 4: Start game
    console.log('\n4. Starting game...');
    const gameStarted = await getReadyAndStartGame(drawerPage, guesserPage, drawerConsoleErrors, guesserConsoleErrors);
    if (!gameStarted) {
      throw new Error('Failed to start game');
    }
    
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, '04-game-started-drawer.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, '04-game-started-guesser.png') });
    
    // Check for unexpected RoundSummary immediately after game start
    console.log('\n5. Checking for unexpected RoundSummary after game start...');
    await drawerPage.waitForTimeout(1000);
    
    const initialEvents = [
      ...await checkForRoundSummaryPopups(drawerPage, 'Drawer'),
      ...await checkForRoundSummaryPopups(guesserPage, 'Guesser'),
    ];
    
    if (initialEvents.length > 0) {
      console.log(`  🚨 Found ${initialEvents.length} unexpected RoundSummary events before drawing!`);
      roundSummaryEvents.push(...initialEvents);
    } else {
      console.log('  ✅ No unexpected RoundSummary events');
    }
    
    // Step 5: Draw with each color
    console.log('\n6. Starting drawing tests...');
    
    // Get initial canvas state
    const initialDrawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
    const initialGuesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
    if (initialDrawerState) canvasStateHistory.drawer.push(initialDrawerState);
    if (initialGuesserState) canvasStateHistory.guesser.push(initialGuesserState);
    
    console.log(`  Initial canvas state - Drawer: ${initialDrawerState?.objectCount || 0}, Guesser: ${initialGuesserState?.objectCount || 0}`);
    
    for (let i = 0; i < TEST_COLORS.length; i++) {
      const color = TEST_COLORS[i];
      console.log(`\n--- Color ${i + 1}/${TEST_COLORS.length}: ${color} (Round ${currentRoundNumber}) ---`);
      
      // Get canvas state before drawing this color
      const beforeColorDrawer = await getDetailedCanvasState(drawerPage, 'Drawer');
      const beforeColorGuesser = await getDetailedCanvasState(guesserPage, 'Guesser');
      console.log(`  Before ${color}: Drawer ${beforeColorDrawer?.objectCount || 0} objects, Guesser ${beforeColorGuesser?.objectCount || 0} objects`);
      
      await drawWithColor(drawerPage, guesserPage, color, DRAW_DURATION_MS);
      
      // Get canvas state after drawing this color
      await drawerPage.waitForTimeout(500);
      await guesserPage.waitForTimeout(500);
      const afterColorDrawer = await getDetailedCanvasState(drawerPage, 'Drawer');
      const afterColorGuesser = await getDetailedCanvasState(guesserPage, 'Guesser');
      console.log(`  After ${color}: Drawer ${afterColorDrawer?.objectCount || 0} objects, Guesser ${afterColorGuesser?.objectCount || 0} objects`);
      
      // Check for RoundSummary after each color
      const colorEvents = [
        ...await checkForRoundSummaryPopups(drawerPage, 'Drawer'),
        ...await checkForRoundSummaryPopups(guesserPage, 'Guesser'),
      ];
      
      if (colorEvents.length > 0) {
        console.log(`  🚨 Found ${colorEvents.length} RoundSummary events after drawing ${color}!`);
        roundSummaryEvents.push(...colorEvents);
        
        // Track round transition if RoundSummary appeared
        await trackRoundTransition(drawerPage, guesserPage, currentRoundNumber);
        currentRoundNumber++;
      }
      
      // Brief pause between colors
      await drawerPage.waitForTimeout(500);
    }
    
    // Final round transition check
    console.log('\n7. Checking final canvas state...');
    await trackRoundTransition(drawerPage, guesserPage, currentRoundNumber);
    
    // Final screenshots
    console.log('\n8. Taking final screenshots...');
    await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, '99-final-drawer.png') });
    await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, '99-final-guesser.png') });
    
    // Get final canvas states
    const finalDrawerState = await getDetailedCanvasState(drawerPage, 'Drawer');
    const finalGuesserState = await getDetailedCanvasState(guesserPage, 'Guesser');
    if (finalDrawerState) canvasStateHistory.drawer.push(finalDrawerState);
    if (finalGuesserState) canvasStateHistory.guesser.push(finalGuesserState);
    
    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results');
    console.log('='.repeat(60));
    
    // Latency statistics
    const validLatencies = latencyMeasurements.filter(m => m.latencyMs !== null && m.latencyMs >= 0);
    if (validLatencies.length > 0) {
      const latencies = validLatencies.map(m => m.latencyMs!);
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const sortedLatencies = [...latencies].sort((a, b) => a - b);
      const medianLatency = sortedLatencies[Math.floor(sortedLatencies.length / 2)];
      const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
      
      console.log('\n📏 Latency Statistics:');
      console.log(`   Total measurements: ${validLatencies.length}`);
      console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`   Median: ${medianLatency}ms`);
      console.log(`   Min: ${minLatency}ms`);
      console.log(`   Max: ${maxLatency}ms`);
      console.log(`   95th percentile: ${p95Latency}ms`);
      
      // Latency by color
      console.log('\n   By color:');
      for (const color of TEST_COLORS) {
        const colorLatencies = validLatencies.filter(m => m.color === color).map(m => m.latencyMs!);
        if (colorLatencies.length > 0) {
          const avg = colorLatencies.reduce((a, b) => a + b, 0) / colorLatencies.length;
          console.log(`   ${color}: avg ${avg.toFixed(2)}ms (${colorLatencies.length} samples)`);
        }
      }
    } else {
      console.log('\n⚠️ No valid latency measurements collected');
    }
    
    // RoundSummary events
    console.log('\n🚨 RoundSummary Events:');
    if (roundSummaryEvents.length > 0) {
      console.log(`   Found ${roundSummaryEvents.length} events:`);
      roundSummaryEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${new Date(event.timestamp).toISOString()}: ${event.context}`);
      });
    } else {
      console.log('   ✅ No unexpected RoundSummary events detected');
    }
    
    // Canvas state analysis
    console.log('\n📊 Canvas State Analysis:');
    console.log(`   Drawer state snapshots: ${canvasStateHistory.drawer.length}`);
    console.log(`   Guesser state snapshots: ${canvasStateHistory.guesser.length}`);
    
    // Analyze object count trends
    if (canvasStateHistory.drawer.length > 0 && canvasStateHistory.guesser.length > 0) {
      const drawerMax = Math.max(...canvasStateHistory.drawer.map(s => s.objectCount));
      const guesserMax = Math.max(...canvasStateHistory.guesser.map(s => s.objectCount));
      const drawerMin = Math.min(...canvasStateHistory.drawer.map(s => s.objectCount));
      const guesserMin = Math.min(...canvasStateHistory.guesser.map(s => s.objectCount));
      
      console.log(`\n   Object Count Ranges:`);
      console.log(`     Drawer: ${drawerMin} - ${drawerMax} objects`);
      console.log(`     Guesser: ${guesserMin} - ${guesserMax} objects`);
      
      // Find mismatches
      const mismatches = canvasStateHistory.drawer
        .map((drawerState, i) => {
          const guesserState = canvasStateHistory.guesser[i];
          if (!guesserState) return null;
          const diff = drawerState.objectCount - guesserState.objectCount;
          return diff !== 0 ? { 
            timestamp: drawerState.timestamp, 
            diff, 
            drawer: drawerState.objectCount, 
            guesser: guesserState.objectCount 
          } : null;
        })
        .filter((m): m is { timestamp: number; diff: number; drawer: number; guesser: number } => m !== null);
      
      if (mismatches.length > 0) {
        console.log(`\n   ⚠️ Found ${mismatches.length} object count mismatches:`);
        mismatches.slice(0, 10).forEach((mismatch: any, i) => {
          console.log(`     ${i + 1}. ${new Date(mismatch.timestamp).toISOString()}: Drawer ${mismatch.drawer} vs Guesser ${mismatch.guesser} (diff: ${mismatch.diff > 0 ? '+' : ''}${mismatch.diff})`);
        });
        if (mismatches.length > 10) {
          console.log(`     ... and ${mismatches.length - 10} more`);
        }
      } else {
        console.log(`   ✅ No object count mismatches detected`);
      }
    }
    
    // Stroke tracking analysis
    console.log('\n📈 Stroke Tracking Analysis:');
    const totalStrokes = strokeTracking.length;
    const receivedStrokes = strokeTracking.filter(s => s.status === 'received').length;
    const missingStrokes = strokeTracking.filter(s => s.status === 'missing').length;
    const lostStrokes = strokeTracking.filter(s => s.status === 'lost').length;
    
    console.log(`   Total strokes tracked: ${totalStrokes}`);
    console.log(`   Received: ${receivedStrokes} (${totalStrokes > 0 ? (receivedStrokes / totalStrokes * 100).toFixed(1) : 0}%)`);
    console.log(`   Missing: ${missingStrokes} (${totalStrokes > 0 ? (missingStrokes / totalStrokes * 100).toFixed(1) : 0}%)`);
    console.log(`   Lost: ${lostStrokes} (${totalStrokes > 0 ? (lostStrokes / totalStrokes * 100).toFixed(1) : 0}%)`);
    
    // Analyze by round
    const rounds = [...new Set(strokeTracking.map(s => s.roundNumber))].sort();
    if (rounds.length > 1) {
      console.log(`\n   By Round:`);
      for (const round of rounds) {
        const roundStrokes = strokeTracking.filter(s => s.roundNumber === round);
        const roundReceived = roundStrokes.filter(s => s.status === 'received').length;
        const roundMissing = roundStrokes.filter(s => s.status === 'missing').length;
        console.log(`     Round ${round}: ${roundReceived}/${roundStrokes.length} received (${roundMissing} missing)`);
      }
    }
    
    // Analyze by color
    console.log(`\n   By Color:`);
    for (const color of TEST_COLORS) {
      const colorStrokes = strokeTracking.filter(s => s.color === color);
      const colorReceived = colorStrokes.filter(s => s.status === 'received').length;
      const colorMissing = colorStrokes.filter(s => s.status === 'missing').length;
      if (colorStrokes.length > 0) {
        console.log(`     ${color}: ${colorReceived}/${colorStrokes.length} received (${colorMissing} missing)`);
      }
    }
    
    // Save results
    const results = {
      summary: {
        testUrl: BASE_URL,
        drawDurationMs: DRAW_DURATION_MS,
        colorsTest: TEST_COLORS,
        timestamp: new Date().toISOString(),
        screenshotDir: resolve(SCREENSHOT_DIR),
        totalRounds: currentRoundNumber,
      },
      latency: {
        measurements: latencyMeasurements,
        statistics: validLatencies.length > 0 ? {
          count: validLatencies.length,
          avg: validLatencies.reduce((a, b) => a + (b.latencyMs || 0), 0) / validLatencies.length,
          min: Math.min(...validLatencies.map(m => m.latencyMs!)),
          max: Math.max(...validLatencies.map(m => m.latencyMs!)),
        } : null,
      },
      roundSummaryEvents,
      canvasStateHistory: {
        drawer: canvasStateHistory.drawer,
        guesser: canvasStateHistory.guesser,
      },
      strokeTracking: {
        strokes: strokeTracking,
        summary: {
          total: strokeTracking.length,
          received: strokeTracking.filter(s => s.status === 'received').length,
          missing: strokeTracking.filter(s => s.status === 'missing').length,
          lost: strokeTracking.filter(s => s.status === 'lost').length,
        },
        byRound: rounds.reduce((acc, round) => {
          const roundStrokes = strokeTracking.filter(s => s.roundNumber === round);
          acc[round] = {
            total: roundStrokes.length,
            received: roundStrokes.filter(s => s.status === 'received').length,
            missing: roundStrokes.filter(s => s.status === 'missing').length,
          };
          return acc;
        }, {} as Record<number, any>),
        byColor: TEST_COLORS.reduce((acc, color) => {
          const colorStrokes = strokeTracking.filter(s => s.color === color);
          acc[color] = {
            total: colorStrokes.length,
            received: colorStrokes.filter(s => s.status === 'received').length,
            missing: colorStrokes.filter(s => s.status === 'missing').length,
          };
          return acc;
        }, {} as Record<string, any>),
      },
    };
    
    const resultsPath = 'test-results-canvas-sync.json';
    
    // Get debug logs
    const drawerDebugLog = await drawerPage.evaluate(() => {
      return (window as any).__canvasDebugLog || [];
    });
    const guesserDebugLog = await guesserPage.evaluate(() => {
      return (window as any).__canvasDebugLog || [];
    });
    
    // Get canvas sync debug data (from our new debugging system)
    const drawerSyncDebug = await drawerPage.evaluate(() => {
      const debug = (window as any).__canvasSyncDebug;
      if (!debug) return null;
      return {
        pathDebugInfo: debug.getPathDebugInfo(),
        canvasState: debug.compareCanvases(null), // Will need to pass canvas
      };
    });
    
    const guesserSyncDebug = await guesserPage.evaluate(() => {
      const debug = (window as any).__canvasSyncDebug;
      if (!debug) return null;
      const canvas = document.querySelector('canvas');
      const fabricCanvas = canvas ? (canvas as any).__canvas : null;
      return {
        pathDebugInfo: debug.getPathDebugInfo(),
        canvasState: debug.compareCanvases(fabricCanvas),
      };
    });
    
    console.log(`\n🔍 Debug Logs:`);
    console.log(`   Drawer: ${drawerDebugLog.length} log entries`);
    console.log(`   Guesser: ${guesserDebugLog.length} log entries`);
    
    // Show key events from guesser's debug log
    if (guesserDebugLog.length > 0) {
      console.log(`\n   Key Guesser Events (last 20):`);
      guesserDebugLog.slice(-20).forEach((entry: any, i: number) => {
        const time = new Date(entry.timestamp).toISOString().split('T')[1].split('.')[0];
        console.log(`     ${time}: ${entry.message}`);
        if (entry.data && entry.data.diff !== undefined) {
          console.log(`       Object count: ${entry.data.previousCount} → ${entry.data.currentCount} (${entry.data.diff > 0 ? '+' : ''}${entry.data.diff})`);
        }
      });
    }
    
    // Analyze canvas sync debug data
    if (guesserSyncDebug && guesserSyncDebug.pathDebugInfo) {
      console.log(`\n🔬 Canvas Sync Debug Analysis:`);
      
      const pathDebugArray = Array.isArray(guesserSyncDebug.pathDebugInfo) 
        ? guesserSyncDebug.pathDebugInfo 
        : [guesserSyncDebug.pathDebugInfo];
      
      if (pathDebugArray.length > 0) {
        console.log(`   Found ${pathDebugArray.length} path(s) tracked:`);
        
        pathDebugArray.forEach((pathInfo: any, i: number) => {
          if (!pathInfo || !pathInfo.pathId) return;
          
          console.log(`\n   Path ${i + 1} (${pathInfo.pathId}):`);
          console.log(`     Duration: ${pathInfo.completeTime ? (pathInfo.completeTime - pathInfo.startTime) + 'ms' : 'incomplete'}`);
          console.log(`     Updates received: ${pathInfo.updateCount}`);
          console.log(`     Last update points: ${pathInfo.lastUpdatePointCount}`);
          console.log(`     Complete points: ${pathInfo.completePointCount || 'N/A'}`);
          console.log(`     Ignored updates: ${pathInfo.ignoredUpdates}`);
          console.log(`     Finalized: ${pathInfo.finalized ? 'Yes' : 'No'}`);
          
          // Check for point count issues
          if (pathInfo.completePointCount && pathInfo.lastUpdatePointCount) {
            const pointDiff = pathInfo.completePointCount - pathInfo.lastUpdatePointCount;
            if (pointDiff < 0) {
              console.log(`     ⚠️ WARNING: path-complete has ${Math.abs(pointDiff)} FEWER points than last update!`);
            } else if (pointDiff > 0) {
              console.log(`     ✓ path-complete has ${pointDiff} more points (expected)`);
            } else {
              console.log(`     ⚠️ path-complete has same point count as last update (might be missing final points)`);
            }
          }
          
          // Check for race conditions
          if (pathInfo.ignoredUpdates > 0) {
            console.log(`     ⚠️ ${pathInfo.ignoredUpdates} path-update events were ignored (arrived after path-complete)`);
          }
          
          // Show event sequence
          if (pathInfo.events && pathInfo.events.length > 0) {
            const eventTypes = pathInfo.events.map((e: any) => `${e.type}#${e.sequence}`).join(' → ');
            console.log(`     Event sequence: ${eventTypes}`);
            
            // Check for out-of-order events
            const pathCompleteIndex = pathInfo.events.findIndex((e: any) => e.type === 'path-complete');
            if (pathCompleteIndex >= 0) {
              const updatesAfterComplete = pathInfo.events.slice(pathCompleteIndex + 1).filter((e: any) => e.type === 'path-update');
              if (updatesAfterComplete.length > 0) {
                console.log(`     ⚠️ ${updatesAfterComplete.length} path-update events arrived AFTER path-complete!`);
              }
            }
          }
        });
        
        // Summary statistics
        const totalIgnored = pathDebugArray.reduce((sum: number, p: any) => sum + (p.ignoredUpdates || 0), 0);
        const totalPointIssues = pathDebugArray.filter((p: any) => 
          p.completePointCount && p.lastUpdatePointCount && p.completePointCount < p.lastUpdatePointCount
        ).length;
        
        if (totalIgnored > 0 || totalPointIssues > 0) {
          console.log(`\n   ⚠️ Summary Issues:`);
          if (totalIgnored > 0) {
            console.log(`     - ${totalIgnored} total ignored path-update events (race conditions)`);
          }
          if (totalPointIssues > 0) {
            console.log(`     - ${totalPointIssues} path(s) with point count issues`);
          }
        } else {
          console.log(`\n   ✅ No synchronization issues detected in debug data`);
        }
      } else {
        console.log(`   No path debug info available`);
      }
    }
    
    // Get canvas events for analysis
    const drawerCanvasEvents = await drawerPage.evaluate(() => {
      return (window as any).__canvasEvents || [];
    });
    const guesserCanvasEvents = await guesserPage.evaluate(() => {
      return (window as any).__canvasEvents || [];
    });
    
    // Analyze event flow
    if (drawerCanvasEvents.length > 0 || guesserCanvasEvents.length > 0) {
      console.log(`\n📡 Canvas Event Flow Analysis:`);
      console.log(`   Drawer sent: ${drawerCanvasEvents.length} events`);
      console.log(`   Guesser received: ${guesserCanvasEvents.length} events`);
      
      // Group by pathId
      const drawerByPath = drawerCanvasEvents.reduce((acc: any, e: any) => {
        if (!e.pathId) return acc;
        if (!acc[e.pathId]) acc[e.pathId] = [];
        acc[e.pathId].push(e);
        return acc;
      }, {});
      
      const guesserByPath = guesserCanvasEvents.reduce((acc: any, e: any) => {
        if (!e.pathId) return acc;
        if (!acc[e.pathId]) acc[e.pathId] = [];
        acc[e.pathId].push(e);
        return acc;
      }, {});
      
      const allPathIds = new Set([...Object.keys(drawerByPath), ...Object.keys(guesserByPath)]);
      
      if (allPathIds.size > 0) {
        console.log(`\n   Event flow by path:`);
        allPathIds.forEach((pathId) => {
          const drawerEvents = drawerByPath[pathId] || [];
          const guesserEvents = guesserByPath[pathId] || [];
          
          const drawerUpdates = drawerEvents.filter((e: any) => e.type === 'path-update').length;
          const drawerCompletes = drawerEvents.filter((e: any) => e.type === 'path-complete').length;
          const guesserUpdates = guesserEvents.filter((e: any) => e.type === 'path-update').length;
          const guesserCompletes = guesserEvents.filter((e: any) => e.type === 'path-complete').length;
          
          const updateDiff = drawerUpdates - guesserUpdates;
          const completeDiff = drawerCompletes - guesserCompletes;
          
          let status = '✅';
          if (updateDiff > 0 || completeDiff > 0) {
            status = '⚠️';
          }
          
          console.log(`     ${status} ${pathId.substring(0, 8)}...: ` +
                     `Updates: ${drawerUpdates}→${guesserUpdates} ` +
                     `(${updateDiff > 0 ? '+' : ''}${updateDiff}), ` +
                     `Completes: ${drawerCompletes}→${guesserCompletes} ` +
                     `(${completeDiff > 0 ? '+' : ''}${completeDiff})`);
          
          // Check point counts
          if (drawerEvents.length > 0 && guesserEvents.length > 0) {
            const lastDrawerUpdate = drawerEvents.filter((e: any) => e.type === 'path-update').pop();
            const lastGuesserUpdate = guesserEvents.filter((e: any) => e.type === 'path-update').pop();
            const drawerComplete = drawerEvents.find((e: any) => e.type === 'path-complete');
            const guesserComplete = guesserEvents.find((e: any) => e.type === 'path-complete');
            
            if (lastDrawerUpdate && lastGuesserUpdate) {
              const pointDiff = lastDrawerUpdate.pointCount - lastGuesserUpdate.pointCount;
              if (pointDiff !== 0) {
                console.log(`       ⚠️ Last update point count mismatch: ${lastDrawerUpdate.pointCount} vs ${lastGuesserUpdate.pointCount} (diff: ${pointDiff > 0 ? '+' : ''}${pointDiff})`);
              }
            }
            
            if (drawerComplete && guesserComplete) {
              // Extract point count from complete events (they contain full path data)
              const drawerCompletePoints = drawerComplete.pointCount || 0;
              const guesserCompletePoints = guesserComplete.pointCount || 0;
              if (drawerCompletePoints !== guesserCompletePoints) {
                console.log(`       ⚠️ Complete event point count mismatch: ${drawerCompletePoints} vs ${guesserCompletePoints}`);
              }
            }
          }
        });
      }
    }
    
    // Add all debug data to results
    (results as any).debugLogs = {
      drawer: drawerDebugLog,
      guesser: guesserDebugLog,
    };
    
    (results as any).canvasSyncDebug = {
      drawer: drawerSyncDebug,
      guesser: guesserSyncDebug,
    };
    
    (results as any).canvasEvents = {
      drawer: drawerCanvasEvents,
      guesser: guesserCanvasEvents,
    };
    
    // Write results with all debug data
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Results saved to ${resultsPath}`);
    console.log(`📸 Screenshots saved to ${SCREENSHOT_DIR}/`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (drawerPage) {
      await drawerPage.screenshot({ path: join(SCREENSHOT_DIR, 'error-drawer.png') }).catch(() => {});
    }
    if (guesserPage) {
      await guesserPage.screenshot({ path: join(SCREENSHOT_DIR, 'error-guesser.png') }).catch(() => {});
    }
    
    throw error;
  } finally {
    // Cleanup
    if (drawerContext) await drawerContext.close();
    if (guesserContext) await guesserContext.close();
    await browser.close();
  }
}

// Run the test
runCanvasSyncTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

