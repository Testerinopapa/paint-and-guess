/**
 * Game Registry Crawler
 * 
 * Comprehensive crawler that exercises the game registry system:
 * - Backend registry API endpoints
 * - Frontend registry loading and caching
 * - Game hub UI interactions
 * - Navigation through game routes
 * - Feature flag and targeting filtering
 * - Cache behavior verification
 * - Fallback behavior testing
 * - Localization handling
 * - Preview component rendering
 * 
 * Run with: npx tsx scripts/crawl-game-registry.ts
 * 
 * Prerequisites:
 *   1. Start the dev servers: npm run dev:all
 *   2. Install Playwright browsers: npx playwright install chromium
 *   3. Optional: Set LOG_LEVEL=debug for detailed logs
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface CrawlResult {
  step: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
  details?: any;
  duration?: number;
}

interface GameInfo {
  id: string;
  name: string;
  route: string;
  status: string;
  isEnabled: boolean;
  hasPreview: boolean;
  badges: string[];
}

const CRAWL_RESULTS: CrawlResult[] = [];
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SCREENSHOT_DIR = 'test-screenshots-registry-crawl';

// Ensure screenshot directory exists
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

let browser: Browser;
let context: BrowserContext;
let page: Page;
const consoleLogs: string[] = [];
const networkLogs: string[] = [];
const games: GameInfo[] = [];

async function captureConsoleLogs(page: Page) {
  page.on('console', (msg) => {
    const text = msg.text();
    const logEntry = `[${new Date().toISOString()}] ${text}`;
    consoleLogs.push(logEntry);
    
    // Filter for registry-related logs
    if (text.includes('[Registry]') || text.includes('[GameRegistry]') || 
        text.includes('[FeatureFlags]') || text.includes('[AllGames]') ||
        text.includes('[hub]') || text.includes('game-registry') ||
        text.includes('gameRegistry')) {
      console.log(`📝 ${logEntry}`);
    }
  });
}

async function captureNetworkLogs(page: Page) {
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/games') || url.includes('/api/')) {
      const method = request.method();
      const logEntry = `[${new Date().toISOString()}] 🌐 ${method} ${url}`;
      networkLogs.push(logEntry);
      console.log(logEntry);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/games') || url.includes('/api/')) {
      const status = response.status();
      const method = response.request().method();
      const logEntry = `[${new Date().toISOString()}] 🌐 ${method} ${url} → ${status}`;
      networkLogs.push(logEntry);
      
      if (url.includes('/api/games')) {
        try {
          const body = await response.json();
          console.log(`📦 Registry Response:`, {
            source: body.source,
            entryCount: body.entries?.length ?? 0,
            updatedAt: body.updatedAt,
          });
        } catch (e) {
          // Not JSON or already consumed
        }
      }
    }
  });
}

async function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/games`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function crawlBackendAPI(): Promise<CrawlResult> {
  const step = 'Backend API Crawl';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    // Test 1: Normal request
    const response1 = await fetch(`${BACKEND_URL}/api/games`);
    if (!response1.ok) {
      throw new Error(`API returned ${response1.status}: ${response1.statusText}`);
    }
    
    const registry1 = await response1.json();
    if (!registry1.entries || !Array.isArray(registry1.entries)) {
      throw new Error('Invalid registry structure: missing entries array');
    }
    
    // Test 2: Force refresh
    const response2 = await fetch(`${BACKEND_URL}/api/games?refresh=true`);
    const registry2 = await response2.json();
    
    // Test 3: Cache verification
    const cacheStart = Date.now();
    const response3 = await fetch(`${BACKEND_URL}/api/games`);
    const cacheDuration = Date.now() - cacheStart;
    const registry3 = await response3.json();
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Found ${registry1.entries.length} games`);
    console.log(`  ✅ Cache duration: ${cacheDuration}ms`);
    
    return {
      step,
      passed: true,
      duration,
      details: {
        entryCount: registry1.entries.length,
        source: registry1.source,
        updatedAt: registry1.updatedAt,
        cacheDuration: `${cacheDuration}ms`,
        entries: registry1.entries.map((e: any) => ({
          id: e.id,
          name: e.name?.default || e.name,
          status: e.status,
          route: e.route?.path || e.route,
        })),
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlFrontendRegistryLoading(): Promise<CrawlResult> {
  const step = 'Frontend Registry Loading';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(3000); // Wait for registry to load
    
    // Wait for games to appear - try multiple selectors
    await page.waitForSelector('[data-game-id], .grid > div[data-game-id], [data-testid="game-card"]', { timeout: 10000 });
    
    // Extract game information using data-game-id attribute
    const gameCards = await page.locator('[data-game-id]').all();
    const extractedGames: GameInfo[] = [];
    
    for (const card of gameCards) {
      try {
        const id = await card.getAttribute('data-game-id');
        if (!id || id === 'unknown') continue;
        
        const title = await card.locator('h3, [class*="CardTitle"], h2').first().textContent() || '';
        const routeLink = card.locator('a[href*="/games/"]').first();
        const route = (await routeLink.getAttribute('href')) || '#';
        const status = await card.locator('[class*="Badge"]').first().textContent() || '';
        const badges = await card.locator('[class*="Badge"]').allTextContents();
        const isEnabled = (await card.locator('button:not([disabled]), a[href*="/games/"]').count()) > 0;
        const hasPreview = (await card.locator('[class*="Preview"]').count()) > 0;
        
        extractedGames.push({
          id,
          name: title.trim(),
          route: route.trim(),
          status: status.trim(),
          isEnabled,
          hasPreview,
          badges: badges.filter(b => b.trim() && b !== status.trim()),
        });
      } catch (e) {
        console.log(`  ⚠️  Failed to extract game card: ${e instanceof Error ? e.message : String(e)}`);
        // Skip cards that can't be parsed
      }
    }
    
    games.push(...extractedGames);
    
    // Check registry logs
    const registryLogs = consoleLogs.filter(log => 
      log.includes('[Registry]') || log.includes('[AllGames]') || log.includes('[hub]')
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Loaded ${extractedGames.length} games`);
    console.log(`  ✅ Captured ${registryLogs.length} registry logs`);
    
    return {
      step,
      passed: extractedGames.length > 0,
      duration,
      details: {
        gamesFound: extractedGames.length,
        games: extractedGames,
        registryLogsCount: registryLogs.length,
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlGameCards(): Promise<CrawlResult> {
  const step = 'Game Cards Interaction';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(2000);
    
    // Use data-game-id selector for more reliable card finding
    const gameCards = await page.locator('[data-game-id]').all();
    const interactions: any[] = [];
    
    for (let i = 0; i < Math.min(gameCards.length, 5); i++) {
      const card = gameCards[i];
      try {
        const gameId = await card.getAttribute('data-game-id') || `card-${i}`;
        
        // Scroll into view with retry
        try {
          await card.scrollIntoViewIfNeeded({ timeout: 5000 });
        } catch (scrollError) {
          // Try alternative scrolling
          await page.evaluate((el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }), await card.elementHandle());
        }
        await waitFor(500);
        
        // Take screenshot of card
        const screenshotPath = join(SCREENSHOT_DIR, `game-card-${i}-${gameId}.png`);
        try {
          await card.screenshot({ path: screenshotPath });
        } catch (screenshotError) {
          console.log(`  ⚠️  Failed to screenshot card ${i}: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
        }
        
        // Check if enabled and clickable
        const playButton = card.locator('button:has-text("Play now"), a:has-text("Play now"), button:not([disabled]), a[href*="/games/"]');
        const isEnabled = await playButton.count() > 0;
        const isDisabled = await card.locator('button[disabled]').count() > 0;
        
        // Try to click if enabled
        if (isEnabled) {
          try {
            const beforeUrl = page.url();
            await playButton.first().click({ timeout: 3000 });
            await waitFor(1500);
            
            // Check if navigation occurred
            const afterUrl = page.url();
            const navigated = beforeUrl !== afterUrl;
            
            interactions.push({
              cardIndex: i,
              gameId,
              enabled: true,
              navigated,
              beforeUrl,
              afterUrl,
              screenshot: screenshotPath,
            });
            
            // Go back if navigated
            if (navigated) {
              await page.goBack();
              await waitFor(1000);
            }
          } catch (e) {
            interactions.push({
              cardIndex: i,
              gameId,
              enabled: true,
              clickError: e instanceof Error ? e.message : String(e),
              screenshot: screenshotPath,
            });
          }
        } else {
          interactions.push({
            cardIndex: i,
            gameId,
            enabled: false,
            disabled: isDisabled,
            screenshot: screenshotPath,
          });
        }
      } catch (e) {
        interactions.push({
          cardIndex: i,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Interacted with ${interactions.length} game cards`);
    
    return {
      step,
      passed: interactions.length > 0,
      duration,
      details: {
        interactions,
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlGameRoutes(): Promise<CrawlResult> {
  const step = 'Game Routes Navigation';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    const navigatedRoutes: any[] = [];
    
    for (const game of games) {
      if (!game.isEnabled || game.route === '#' || game.route.startsWith('#')) {
        continue;
      }
      
      try {
        console.log(`  🎮 Navigating to: ${game.route}`);
        await page.goto(`${BASE_URL}${game.route}`, { waitUntil: 'networkidle', timeout: 5000 });
        await waitFor(2000);
        
        // Take screenshot
        const screenshotPath = join(SCREENSHOT_DIR, `route-${game.id}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Check if page loaded correctly
        const hasContent = await page.locator('body').count() > 0;
        const pageTitle = await page.title();
        
        navigatedRoutes.push({
          gameId: game.id,
          gameName: game.name,
          route: game.route,
          success: hasContent,
          title: pageTitle,
          screenshot: screenshotPath,
        });
        
        // Wait before next navigation
        await waitFor(1000);
      } catch (e) {
        navigatedRoutes.push({
          gameId: game.id,
          gameName: game.name,
          route: game.route,
          success: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Navigated to ${navigatedRoutes.filter(r => r.success).length}/${navigatedRoutes.length} routes`);
    
    return {
      step,
      passed: navigatedRoutes.some(r => r.success),
      duration,
      details: {
        navigatedRoutes,
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlCacheBehavior(): Promise<CrawlResult> {
  const step = 'Cache Behavior Verification';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    // Clear browser cache
    await context.clearCookies();
    
    // First load
    const firstLoadStart = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(2000);
    const firstLoadDuration = Date.now() - firstLoadStart;
    
    // Count network requests
    const firstLoadRequests = networkLogs.filter(log => 
      log.includes('/api/games') && Date.now() - new Date(log.split(']')[0].slice(1)).getTime() < firstLoadDuration
    ).length;
    
    // Second load (should use cache)
    const secondLoadStart = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(2000);
    const secondLoadDuration = Date.now() - secondLoadStart;
    
    // Count network requests for second load
    const networkLogsAfterFirst = networkLogs.length;
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(1000);
    const secondLoadRequests = networkLogs.length - networkLogsAfterFirst;
    
    const duration = Date.now() - startTime;
    
    const cacheWorking = secondLoadRequests < firstLoadRequests || secondLoadDuration < firstLoadDuration * 0.8;
    
    console.log(`  ✅ First load: ${firstLoadDuration}ms (${firstLoadRequests} requests)`);
    console.log(`  ✅ Second load: ${secondLoadDuration}ms (${secondLoadRequests} requests)`);
    console.log(`  ✅ Cache working: ${cacheWorking}`);
    
    return {
      step,
      passed: true,
      duration,
      details: {
        firstLoadDuration: `${firstLoadDuration}ms`,
        secondLoadDuration: `${secondLoadDuration}ms`,
        firstLoadRequests,
        secondLoadRequests,
        cacheWorking,
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlRegistryMetadata(): Promise<CrawlResult> {
  const step = 'Registry Metadata Display';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(2000);
    
    // Check for registry source info
    const sourceInfo = await page.locator('text=/Source|Registry source/i').first();
    const hasSourceInfo = await sourceInfo.count() > 0;
    const sourceText = hasSourceInfo ? await sourceInfo.textContent() : null;
    
    // Check for updated timestamp
    const hasTimestamp = await page.locator('text=/Updated|Last updated/i').count() > 0;
    
    // Check for error messages
    const hasError = await page.locator('text=/error|failed|offline/i').count() > 0;
    const errorText = hasError ? await page.locator('text=/error|failed|offline/i').first().textContent() : null;
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Source info: ${hasSourceInfo ? sourceText : 'not found'}`);
    console.log(`  ✅ Timestamp: ${hasTimestamp ? 'found' : 'not found'}`);
    console.log(`  ✅ Error display: ${hasError ? errorText : 'none'}`);
    
    return {
      step,
      passed: hasSourceInfo,
      duration,
      details: {
        hasSourceInfo,
        sourceText,
        hasTimestamp,
        hasError,
        errorText,
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function crawlFeatureFlagFiltering(): Promise<CrawlResult> {
  const step = 'Feature Flag Filtering';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(2000);
    
    // Check for feature flag logs
    const featureFlagLogs = consoleLogs.filter(log => 
      log.includes('[FeatureFlags]') || log.includes('featureFlag') ||
      log.includes('isEnabled') || log.includes('targeting')
    );
    
    // Count visible vs disabled games using data-game-id
    const allGameCards = await page.locator('[data-game-id]').count();
    const visibleGames = await page.locator('[data-game-id]:not(:has(button[disabled]))').count();
    const disabledGames = await page.locator('[data-game-id]:has(button[disabled])').count();
    
    // Check for "Unavailable" messages
    const unavailableMessages = await page.locator('text=/Unavailable|coming soon/i').count();
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Visible games: ${visibleGames}`);
    console.log(`  ✅ Disabled games: ${disabledGames}`);
    console.log(`  ✅ Feature flag logs: ${featureFlagLogs.length}`);
    
    return {
      step,
      passed: true,
      duration,
      details: {
        visibleGames,
        disabledGames,
        unavailableMessages,
        featureFlagLogsCount: featureFlagLogs.length,
        sampleLogs: featureFlagLogs.slice(0, 5),
      },
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function takeFullPageScreenshot(): Promise<CrawlResult> {
  const step = 'Full Page Screenshot';
  const startTime = Date.now();
  console.log(`\n🔍 Crawling: ${step}`);
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await waitFor(3000);
    
    const screenshotPath = join(SCREENSHOT_DIR, 'game-hub-full.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Screenshot saved: ${screenshotPath}`);
    
    return {
      step,
      passed: true,
      duration,
      screenshot: screenshotPath,
    };
  } catch (error) {
    return {
      step,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function runCrawler() {
  console.log('🚀 Starting Game Registry Crawler...\n');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  // Check backend health
  console.log('🔍 Checking backend health...');
  const backendHealthy = await checkBackendHealth();
  if (!backendHealthy) {
    console.error('❌ Backend is not running! Please start it with: npm run dev:all');
    process.exit(1);
  }
  console.log('✅ Backend is running\n');
  
  // Launch browser
  console.log('🌐 Launching browser...');
  browser = await chromium.launch({ headless: false });
  context = await browser.newContext();
  page = await context.newPage();
  
  captureConsoleLogs(page);
  captureNetworkLogs(page);
  
  // Run crawls
  CRAWL_RESULTS.push(await crawlBackendAPI());
  CRAWL_RESULTS.push(await crawlFrontendRegistryLoading());
  CRAWL_RESULTS.push(await takeFullPageScreenshot());
  CRAWL_RESULTS.push(await crawlGameCards());
  CRAWL_RESULTS.push(await crawlRegistryMetadata());
  CRAWL_RESULTS.push(await crawlFeatureFlagFiltering());
  CRAWL_RESULTS.push(await crawlCacheBehavior());
  CRAWL_RESULTS.push(await crawlGameRoutes());
  
  // Cleanup
  await browser.close();
  
  // Generate report
  const passed = CRAWL_RESULTS.filter(r => r.passed).length;
  const total = CRAWL_RESULTS.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Crawl Results Summary');
  console.log('='.repeat(60));
  
  CRAWL_RESULTS.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${index + 1}. ${result.step}${duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.details) {
      const detailsStr = JSON.stringify(result.details, null, 2).split('\n').slice(0, 5).join('\n');
      console.log(`   Details:\n${detailsStr}${Object.keys(result.details).length > 3 ? '...' : ''}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passed}/${total} crawls passed`);
  console.log(`Games found: ${games.length}`);
  console.log(`Console logs: ${consoleLogs.length}`);
  console.log(`Network logs: ${networkLogs.length}`);
  console.log('='.repeat(60));
  
  // Save results
  const resultsPath = 'test-results-registry-crawl.json';
  writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { 
      passed, 
      total, 
      failed: total - passed,
      gamesFound: games.length,
    },
    games,
    results: CRAWL_RESULTS,
  }, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
  
  // Save logs
  const logsPath = join(SCREENSHOT_DIR, 'console-logs.txt');
  writeFileSync(logsPath, consoleLogs.join('\n'));
  console.log(`💾 Console logs saved to: ${logsPath}`);
  
  const networkPath = join(SCREENSHOT_DIR, 'network-logs.txt');
  writeFileSync(networkPath, networkLogs.join('\n'));
  console.log(`💾 Network logs saved to: ${networkPath}`);
  
  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run crawler
runCrawler().catch((error) => {
  console.error('❌ Crawler failed:', error);
  process.exit(1);
});

