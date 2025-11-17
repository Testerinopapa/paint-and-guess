# Heartbeat & Sweep Implementation Test

This test suite validates the heartbeat and room sweep functionality implemented in the backend server.

## Overview

The test crawler exercises the following features:

1. **Client Heartbeat Pings** - Verifies clients send heartbeat pings every ~15 seconds
2. **Server Heartbeat Acknowledgment** - Confirms server receives and processes heartbeats
3. **Stale Player Detection** - Tests detection of players who stop sending heartbeats (after 45s)
4. **Player Pruning** - Validates removal of disconnected players after grace period (2 minutes)
5. **Room Sweep Operations** - Verifies background sweeps run every 30 seconds
6. **Player Revival** - Tests reconnection of stale players via heartbeat
7. **Continuous Monitoring** - Validates heartbeat persistence over extended periods

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

## Running the Tests

### Using npm script (recommended):

```bash
npm run test:heartbeat
```

### Direct execution:

```bash
npx tsx scripts/test-heartbeat-sweep.ts
```

### Environment Variables

You can customize the test behavior with environment variables:

```bash
# Custom URLs
TEST_URL=http://localhost:8080 BACKEND_URL=http://localhost:3001 npm run test:heartbeat
```

## Test Scenarios

### Test 1: Room Creation & Initial Heartbeat Setup
- Creates a room and verifies initial heartbeat is sent on connection
- Checks for heartbeat-related logs

### Test 2: Multiple Players & Heartbeat Verification
- Adds multiple players to a room
- Monitors heartbeat pings from each player
- Verifies at least 2 heartbeats per player over ~30 seconds

### Test 3: Stale Player Detection
- Simulates network interruption for a player
- Waits for sweep to detect stale player (after 45s threshold)
- Verifies stale detection logs appear

### Test 4: Player Revival via Heartbeat
- Restores network for a stale player
- Waits for heartbeat to revive the player
- Confirms revival logs appear

### Test 5: Room Sweep Operations
- Monitors background sweep cycles
- Verifies sweep logs appear at expected intervals (every 30s)
- Checks sweep activity is logged

### Test 6: Player Pruning After Grace Period
- Disconnects a player completely
- Waits for pruning logic to run
- Verifies pruning logs appear (note: full grace period is 2 minutes)

### Test 7: Continuous Heartbeat Monitoring
- Monitors heartbeats over extended period (~60 seconds)
- Verifies heartbeats continue consistently
- Checks heartbeat count increases as expected

## Configuration

The test uses these timing constants (matching backend defaults):

- **Heartbeat Interval**: 15,000ms (15 seconds)
- **Stale Threshold**: 45,000ms (45 seconds)
- **Grace Period**: 120,000ms (2 minutes)
- **Sweep Interval**: 30,000ms (30 seconds)

These match the backend environment variables:
- `PLAYER_STALE_HEARTBEAT_MS` (default: 45000)
- `PLAYER_DISCONNECT_GRACE_PERIOD_MS` (default: 120000)
- `ROOM_SWEEP_INTERVAL_MS` (default: 30000)

## Output

The test generates:

1. **Screenshots** - Saved to `test-screenshots-heartbeat/`
   - `01-room-created.png`
   - `02-multiple-players-heartbeats.png`
   - `03-stale-detection.png`
   - `04-player-revival.png`
   - `05-room-sweeps.png`
   - `06-player-pruning.png`
   - `07-continuous-heartbeats.png`

2. **Test Results** - `test-results-heartbeat-sweep.json`
   - Detailed results for each test
   - Pass/fail status
   - Logs and details

3. **Console Logs** - `test-screenshots-heartbeat/console-logs.txt`
   - All captured console logs from all players

4. **Heartbeat Logs** - `test-screenshots-heartbeat/heartbeat-logs.txt`
   - Filtered logs specific to heartbeat/sweep functionality

5. **Network Logs** - `test-screenshots-heartbeat/network-logs.txt`
   - All network requests/responses

## Troubleshooting

### Backend Not Running
```
❌ Backend is not running! Please start it with: npm run dev:all
```
**Solution**: Start the backend server first.

### No Heartbeat Logs Detected
- Ensure `LOG_LEVEL=debug` is set in the backend
- Check that the frontend is sending heartbeats (check browser console)
- Verify socket connection is established

### Stale Detection Not Working
- The stale threshold is 45 seconds - ensure network interruption lasts longer
- Sweeps run every 30 seconds - wait at least one sweep cycle
- Check backend logs for `[Sweeper]` and `[GameRoom]` messages

### Tests Taking Too Long
- Some tests intentionally wait for timing-based events (heartbeats, sweeps)
- Total test duration is typically 3-5 minutes
- You can reduce wait times in the script if needed for faster iteration

## Expected Behavior

### Successful Test Run
- All 7 tests should pass
- Heartbeat logs should appear regularly
- Sweep logs should appear every ~30 seconds
- Stale detection should trigger after network interruption
- Player revival should work when network is restored

### Debug Mode
With `LOG_LEVEL=debug`, you should see:
- `[DEBUG] [Heartbeat] Received heartbeat` - Every heartbeat received
- `[DEBUG] [Sweeper] Starting interval run` - Every sweep cycle
- `[DEBUG] [GameRoom:...] Checking for stale players` - During sweeps
- `[DEBUG] [GameRoom:...] Heartbeat from ...` - Every heartbeat processed

## Integration with CI/CD

The test exits with code 0 on success, 1 on failure:

```bash
npx tsx scripts/test-heartbeat-sweep.ts
echo $? # Should be 0 if all tests pass
```

## Related Documentation

- Backend README: `backend/README.md`
- Server implementation: `backend/src/server.js`
- GameRoom implementation: `backend/src/gameRoom.js`
- Client socket hook: `src/hooks/useSocket.ts`

