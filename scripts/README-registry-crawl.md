# Game Registry Crawler

Comprehensive crawler that exercises and explores the game registry system end-to-end.

## Overview

This crawler systematically tests and explores:

1. **Backend API Crawl** - Tests registry API endpoints and cache behavior
2. **Frontend Registry Loading** - Validates frontend can load and parse registry
3. **Full Page Screenshot** - Captures the All Games page state
4. **Game Cards Interaction** - Clicks through game cards and tests interactions
5. **Registry Metadata Display** - Verifies registry source/timestamp information
6. **Feature Flag Filtering** - Tests feature flag and targeting rule filtering
7. **Cache Behavior Verification** - Validates frontend caching works correctly
8. **Game Routes Navigation** - Navigates to each game's route and verifies pages load

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Start the development servers:**
   ```bash
   # Option 1: Use the convenience script
   npm run dev:all
   
   # Option 2: Start manually
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Optional: Enable debug logging:**
   ```bash
   # PowerShell
   $env:LOG_LEVEL="debug"; cd backend; npm run dev
   $env:VITE_GAME_REGISTRY_DEBUG="true"; npm run dev
   
   # Bash
   LOG_LEVEL=debug cd backend && npm run dev
   VITE_GAME_REGISTRY_DEBUG=true npm run dev
   ```

## Running the Crawler

### Direct execution:

```bash
npx tsx scripts/crawl-game-registry.ts
```

### With custom URLs:

```bash
TEST_URL=http://localhost:8080 BACKEND_URL=http://localhost:3001 npx tsx scripts/crawl-game-registry.ts
```

## Crawl Steps

### 1. Backend API Crawl
- Tests `/api/games` endpoint
- Verifies response structure
- Tests force refresh (`?refresh=true`)
- Measures cache performance
- Extracts all game entries

### 2. Frontend Registry Loading
- Loads the All Games page (`/`)
- Waits for registry to fetch
- Extracts game card information
- Captures registry-related console logs
- Builds game inventory for subsequent crawls

### 3. Full Page Screenshot
- Captures complete All Games page
- Saves to `test-screenshots-registry-crawl/game-hub-full.png`
- Documents initial state

### 4. Game Cards Interaction
- Scrolls through game cards
- Takes screenshots of individual cards
- Clicks "Play now" buttons on enabled games
- Tests navigation behavior
- Verifies disabled state handling

### 5. Registry Metadata Display
- Checks for registry source information
- Verifies timestamp display
- Tests error message rendering
- Validates metadata UI elements

### 6. Feature Flag Filtering
- Analyzes feature flag logs
- Counts visible vs disabled games
- Checks for "Unavailable" messages
- Validates targeting rule filtering

### 7. Cache Behavior Verification
- Tests first load (uncached)
- Tests second load (cached)
- Compares request counts
- Measures load times
- Validates cache effectiveness

### 8. Game Routes Navigation
- Navigates to each enabled game's route
- Takes screenshots of game pages
- Verifies pages load correctly
- Tests route accessibility
- Documents navigation success/failures

## Output

The crawler generates:

1. **Console Output** - Real-time progress and results
2. **`test-results-registry-crawl.json`** - Complete crawl results with:
   - Summary statistics
   - All discovered games
   - Detailed results for each crawl step
   - Screenshot paths
   - Error details

3. **`test-screenshots-registry-crawl/`** - Screenshots:
   - `game-hub-full.png` - Full page screenshot
   - `game-card-{n}.png` - Individual game card screenshots
   - `route-{gameId}.png` - Game route page screenshots

4. **`test-screenshots-registry-crawl/console-logs.txt`** - All captured console logs
5. **`test-screenshots-registry-crawl/network-logs.txt`** - All network requests/responses

### Example Output:

```
🚀 Starting Game Registry Crawler...

Frontend URL: http://localhost:8080
Backend URL: http://localhost:3001

🔍 Checking backend health...
✅ Backend is running

🌐 Launching browser...

🔍 Crawling: Backend API Crawl
  ✅ Found 3 games
  ✅ Cache duration: 12ms

🔍 Crawling: Frontend Registry Loading
  ✅ Loaded 3 games
  ✅ Captured 15 registry logs

🔍 Crawling: Full Page Screenshot
  ✅ Screenshot saved: test-screenshots-registry-crawl/game-hub-full.png

...

📊 Crawl Results Summary
============================================================
✅ 1. Backend API Crawl (245ms)
✅ 2. Frontend Registry Loading (3124ms)
✅ 3. Full Page Screenshot (3245ms)
...
============================================================
Total: 8/8 crawls passed
Games found: 3
Console logs: 47
Network logs: 12
============================================================
```

## Configuration

The crawler uses these constants:

- **BASE_URL** - Frontend URL (default: `http://localhost:8080`)
- **BACKEND_URL** - Backend URL (default: `http://localhost:3001`)
- **SCREENSHOT_DIR** - Screenshot directory (default: `test-screenshots-registry-crawl`)

## Troubleshooting

### Backend Not Running
```
❌ Backend is not running! Please start it with: npm run dev:all
```
**Solution**: Start the backend server first.

### No Games Found
- Check that the registry file exists: `backend/data/game-registry.json`
- Verify backend is serving registry: `curl http://localhost:3001/api/games`
- Check browser console for errors

### Navigation Failures
- Verify game routes are properly configured
- Check that game pages exist and are accessible
- Review screenshots in `test-screenshots-registry-crawl/`

### Cache Tests Failing
- Cache TTL is 60 seconds - ensure crawls run within this window
- Check network logs for cache hits/misses
- Verify React Query is configured correctly

## Differences from test-game-registry.ts

This crawler is more **exploratory** than the test script:

- ✅ Actually navigates to game routes
- ✅ Interacts with UI elements
- ✅ Takes more comprehensive screenshots
- ✅ Builds a game inventory as it crawls
- ✅ More detailed logging and documentation
- ✅ Tests end-to-end user flows

The test script (`test-game-registry.ts`) focuses on **validation**, while this crawler focuses on **exploration and discovery**.

## Integration with CI/CD

The crawler exits with code 0 on success, 1 on failure:

```bash
npx tsx scripts/crawl-game-registry.ts
echo $? # Should be 0 if all crawls pass
```

## Related Documentation

- Test script: `scripts/test-game-registry.ts`
- Backend registry: `backend/src/gameRegistry.js`
- Frontend registry: `src/games/registry.ts`
- Registry schema: `src/games/registry/schema.ts`
- Feature flags: `src/lib/featureFlags.ts`
- All Games page: `src/pages/AllGames.tsx`

