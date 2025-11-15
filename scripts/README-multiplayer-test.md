# Multiplayer Host Controls & Round Management Test

Automated end-to-end test for the multiplayer game features introduced in commit `5498286`.

## What This Tests

### Host Controls
- ✅ First player to join becomes host
- ✅ Host badge displayed correctly
- ✅ Only host can see "Start Game" button
- ✅ Non-host players see "Waiting for host to start"
- ✅ Host transfers to next player when original host disconnects

### Ready System
- ✅ Players can toggle ready state
- ✅ Ready count tracked correctly
- ✅ Game cannot start until all players are ready
- ✅ Start button disabled when not all players ready

### Round Management
- ✅ Game starts with round 1
- ✅ Rounds progress automatically (1 → 2 → 3...)
- ✅ Round timer works correctly
- ✅ Drawer rotates between rounds
- ✅ 3-second delay between rounds
- ✅ Game ends after max rounds (6 by default)

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install chromium
   ```

2. **Start all dev servers**:
   ```bash
   npm run dev:all
   ```
   
   Or manually:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

3. **Verify servers are running**:
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3001

## Running the Test

### Quick Run
```bash
npm run test:multiplayer
```

### Manual Run
```bash
npx tsx scripts/test-multiplayer-host-controls.ts
```

## What to Expect

The test will:
1. Launch a Chromium browser (visible, not headless)
2. Create multiple browser contexts (simulating different players)
3. Create a room with Player 1 (Host)
4. Have Player 2 join
5. Test that Player 2 cannot start the game
6. Test that Host can start when all players are ready
7. Watch first 3 rounds progress
8. Verify drawer rotation
9. Test host transfer when host disconnects
10. Generate screenshots and logs

**⏱️ Test Duration:** ~3-4 minutes (includes waiting for rounds to complete)

## Output Files

### Screenshots
Location: `test-screenshots-multiplayer/`

- `01-room-created-host.png` - Host creates room
- `02-player2-joined.png` - Second player joins
- `03-player2-ready-no-start-button.png` - Non-host ready state
- `04-host-ready-can-start.png` - Host can start when all ready
- `05-game-started.png` - Game begins
- `06-round-1.png` - Round 1 in progress
- `07-round-2.png` - Round 2 in progress
- `08-round-3.png` - Round 3 in progress
- `09-host-transferred.png` - Host transfer after disconnect

### Console Logs
Location: `test-screenshots-multiplayer/console-logs.txt`

Contains all debug logs from both backend and frontend, including:
- `[GameRoom:ROOMID]` - Backend game room events
- `[Server]` - Backend socket events
- `[GameContext]` - Frontend state updates
- `[Room]` - Frontend UI interactions

### Test Results
Location: `test-results-multiplayer-controls.json`

JSON file with detailed test results:
```json
{
  "test": "Test Name",
  "passed": true/false,
  "screenshot": "filename.png",
  "logs": ["relevant log entries"],
  "error": "error message if failed"
}
```

## Test Breakdown

### Test 1: Room Creation & Host Assignment
- Creates a room
- Verifies first player becomes host
- Checks host badge is visible

### Test 2: Second Player Joins (Not Host)
- Second player joins room
- Verifies they are NOT host
- Checks they don't have host privileges

### Test 3: Non-Host Cannot Start Game
- Second player sets ready
- Verifies they don't see "Start Game" button
- Confirms only host can start

### Test 4: Host Starts Game When All Ready
- Host sets ready
- All players ready → Start button enabled
- Host clicks start → game begins

### Test 5: Round Progression
- Waits for Round 1 to start
- Waits ~65 seconds for Round 1 to end
- Verifies Round 2 starts automatically
- Waits ~65 seconds for Round 2 to end
- Verifies Round 3 starts automatically

### Test 6: Drawer Rotation
- Analyzes console logs for drawer changes
- Verifies drawer rotates between rounds
- Checks drawer is announced each round

### Test 7: Host Transfer on Disconnect
- Third player joins
- Original host disconnects
- Verifies host transfers to Player 2
- Checks Player 2 now has host badge

## Interpreting Results

### Success ✅
```
TEST SUMMARY
============================================================
1. ✅ PASS: Room Creation & Host Assignment
2. ✅ PASS: Second Player Joins (Not Host)
3. ✅ PASS: Non-Host Cannot See Start Button
4. ✅ PASS: Host Starts Game Successfully
5. ✅ PASS: Round Progression (1→2→3)
6. ✅ PASS: Drawer Rotation Between Rounds
7. ✅ PASS: Host Transfer on Disconnect

RESULTS: 7/7 tests passed
```

### Failure ❌
If any test fails, check:
1. **Screenshots** - Visual inspection of what went wrong
2. **Console logs** - Backend and frontend debug output
3. **Test results JSON** - Detailed error messages

Common issues:
- Backend not running → Start with `npm run dev:all`
- Port conflicts → Check ports 8080, 3001 are free
- Timing issues → Round duration is 60s, test needs ~4 minutes

## Debug Mode

The test runs with `headless: false`, so you can watch it in real-time:
- See multiple browser windows open (one per player)
- Watch players join, ready up, and play
- Observe UI changes and interactions
- Great for understanding the multiplayer flow!

To run in headless mode (faster), edit the script:
```typescript
browser = await chromium.launch({ headless: true });
```

## Troubleshooting

### "Backend is not running"
```bash
# Make sure backend is started
cd backend && npm run dev
```

### "Failed to create room"
- Check if frontend is accessible at http://localhost:8080
- Look for console errors in the test output
- Try creating a room manually in the browser first

### "Round progression failed"
- This is expected! Rounds take 60 seconds each
- Test waits 65 seconds per round (60s + 3s delay + buffer)
- Total wait time for 2 rounds: ~130 seconds

### "Host transfer failed"
- Check console logs for disconnect events
- Verify backend correctly reassigns host
- Look for `[GameRoom:*] 🎖️ Host transferred` messages

## Manual Testing Comparison

This test automates what you'd normally do manually:
1. Open 2-3 browser windows
2. Create a room in one
3. Join from the others
4. Ready up all players
5. Start the game as host
6. Wait for multiple rounds
7. Observe drawer rotation
8. Test host transfer

**Time saved:** Manual testing: ~10 minutes, Automated: ~4 minutes + automatic verification

## CI/CD Integration

To run in CI (headless, non-interactive):

```typescript
// Edit test script
browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

Then add to your CI config:
```yaml
- name: Run multiplayer tests
  run: npm run test:multiplayer
  timeout-minutes: 10
```

## Contributing

To add more tests:
1. Add new test section in `runTests()` function
2. Create helper functions as needed
3. Take screenshots at key points
4. Push results to `TEST_RESULTS` array
5. Update this README with new test description

Example:
```typescript
// Test 8: New Feature
console.log('\n' + '='.repeat(60));
console.log('TEST 8: My New Feature');
console.log('='.repeat(60));

// Your test code here

TEST_RESULTS.push({
  test: 'My New Feature',
  passed: myTestPassed,
  screenshot: '10-new-feature.png',
  logs: relevantLogs
});
```

