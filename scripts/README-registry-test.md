# Game Registry Implementation Test

This test suite validates the game registry functionality implemented across the backend and frontend.

## Overview

The test crawler exercises the following features:

1. **Backend API Endpoint** - Verifies `/api/games/registry` endpoint works correctly
2. **Schema Validation** - Tests registry data structure and validation
3. **Frontend Registry Loading** - Validates frontend can load and display registry
4. **Cache Behavior** - Tests registry caching and TTL functionality
5. **Feature Flag Filtering** - Verifies games are filtered based on feature flags
6. **Fallback Behavior** - Tests fallback to bundled registry when backend is unavailable
7. **Game Hub UI** - Validates the All Games page displays correctly

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
   # or on Windows PowerShell
   .\start-dev.ps1
   
   # Option 2: Start manually
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Enable debug logging (recommended):**
   ```bash
   # PowerShell
   $env:LOG_LEVEL="debug"; cd backend; npm run dev
   
   # Bash
   LOG_LEVEL=debug cd backend && npm run dev
   ```

5. **Ensure game registry file exists:**
   ```bash
   # The registry file should be at:
   backend/data/game-registry.json
   ```

## Running the Tests

### Using npm script (recommended):

```bash
npm run test:registry
```

### Direct execution:

```bash
npx tsx scripts/test-game-registry.ts
```

### Environment Variables

You can customize the test behavior with environment variables:

```bash
# Custom URLs
TEST_URL=http://localhost:8080 BACKEND_URL=http://localhost:3001 npm run test:registry
```

## Test Scenarios

### Test 1: Backend API Endpoint
- Tests the `/api/games/registry` endpoint
- Verifies response structure and content
- Tests force refresh parameter (`?refresh=true`)
- Validates cache behavior (second request should be faster)

### Test 2: Schema Validation
- Validates registry JSON structure
- Checks required fields: `updatedAt`, `source`, `entries`
- Validates each game entry structure
- Verifies status enum values are valid

### Test 3: Frontend Registry Loading
- Loads the All Games page
- Verifies registry is fetched from backend
- Checks for registry-related console logs
- Validates games are displayed on the page

### Test 4: Cache Behavior
- Tests frontend registry caching
- Verifies cache TTL (60 seconds)
- Checks that cached responses are faster
- Validates cache invalidation on reload

### Test 5: Feature Flag Filtering
- Tests feature flag system integration
- Verifies games with disabled flags are filtered
- Checks feature flag logs in console
- Validates visible games count

### Test 6: Fallback Behavior
- Tests fallback to bundled registry
- Verifies error handling when backend is unavailable
- Checks fallback logs in console
- Validates games are still displayed using fallback

### Test 7: Game Hub UI
- Takes screenshot of the All Games page
- Verifies key UI elements are present
- Checks for registry metadata display
- Validates game cards are rendered

## Configuration

The test uses these constants:

- **Cache TTL**: 60,000ms (60 seconds)
- **Request Timeout**: 5,000ms (5 seconds)
- **Test Delays**: 500-2000ms (for UI rendering)

These match the implementation in:
- `backend/src/gameRegistry.js` - Backend cache TTL
- `src/games/registry.ts` - Frontend cache TTL and timeout

## Output

The test generates:

1. **Screenshots** - Saved to `test-screenshots-registry/`
   - `game-hub-ui.png` - Screenshot of the All Games page

2. **Test Results** - `test-results-registry.json`
   - Detailed results for each test
   - Pass/fail status
   - Logs and details
   - Duration for each test

3. **Console Logs** - `test-screenshots-registry/console-logs.txt`
   - All captured console logs
   - Filtered for registry-related messages

4. **Network Logs** - `test-screenshots-registry/network-logs.txt`
   - All network requests/responses
   - Registry API calls with response details

## Troubleshooting

### Backend Not Running
```
❌ Backend is not running! Please start it with: npm run dev:all
```
**Solution**: Start the backend server first.

### Registry File Missing
```
Error: ENOENT: no such file or directory, open 'backend/data/game-registry.json'
```
**Solution**: Ensure the registry file exists. The backend will use fallback if missing, but tests expect the file.

### No Registry Logs Detected
- Ensure `LOG_LEVEL=debug` is set in the backend
- Check that the frontend is making registry requests (check browser console)
- Verify the registry endpoint is accessible: `curl http://localhost:3001/api/games/registry`

### Cache Tests Failing
- Cache TTL is 60 seconds - ensure tests run within this window
- Check network logs to verify cache hits/misses
- Verify cache timestamps in debug logs

### Schema Validation Errors
- Check the registry JSON structure matches the schema
- Verify all required fields are present
- Ensure status values are valid enum values
- Check backend logs for Zod validation errors

## Expected Behavior

### Successful Test Run
- All 7 tests should pass
- Registry API should return valid JSON
- Frontend should load and display games
- Cache should work correctly
- Feature flags should filter games appropriately
- Fallback should work when backend is unavailable

### Debug Mode
With `LOG_LEVEL=debug`, you should see:
- `[GameRegistry] loadGameRegistry called` - Every registry load
- `[GameRegistry] Returning cached registry` - Cache hits
- `[HTTP] Game registry request` - Every API request
- `[Registry] Requesting registry from API` - Frontend requests
- `[FeatureFlags] isFeatureEnabled(...)` - Feature flag checks

## Integration with CI/CD

The test exits with code 0 on success, 1 on failure:

```bash
npx tsx scripts/test-game-registry.ts
echo $? # Should be 0 if all tests pass
```

## Related Documentation

- Backend registry: `backend/src/gameRegistry.js`
- Frontend registry: `src/games/registry.ts`
- Registry schema: `src/games/registry/schema.ts`
- Feature flags: `src/lib/featureFlags.ts`
- All Games page: `src/pages/AllGames.tsx`
- Backend server: `backend/src/server.js`

