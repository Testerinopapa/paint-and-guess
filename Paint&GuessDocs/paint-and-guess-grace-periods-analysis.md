# Paint & Guess Grace Periods Analysis

## Overview

The Paint & Guess game implements multiple grace periods to handle network disconnections, round transitions, and player state management. These grace periods ensure smooth gameplay, allow for reconnection, and provide time for players to see important information between rounds.

## Grace Period Types

### 1. Player Disconnect Grace Period

**Purpose:** Allows disconnected players to reconnect before their slot is permanently removed from the room.

**Configuration:**
- **Environment Variable:** `PLAYER_DISCONNECT_GRACE_PERIOD_MS`
- **Default Value:** `120,000ms` (2 minutes)
- **Location:** `backend/src/server.js:69`

**How It Works:**

1. **Player Disconnection Detection:**
   - When a player's socket disconnects, `markPlayerDisconnected()` is called
   - Player's `connected` flag is set to `false`
   - Player's `lastSeen` timestamp is updated to current time
   - Player's `socketId` is cleared
   - Player's `isReady` and `hasGuessed` flags are reset

2. **Stale Player Detection:**
   - Background sweeper runs every `ROOM_SWEEP_INTERVAL_MS` (default: 30 seconds)
   - `markStalePlayersDisconnected()` checks for players who haven't sent heartbeats
   - Uses `PLAYER_STALE_HEARTBEAT_MS` threshold (default: 45 seconds)
   - Players without heartbeat for 45+ seconds are marked as disconnected

3. **Grace Period Window:**
   - Disconnected players remain in the room for the grace period duration
   - During this time, they can reconnect and resume playing
   - Their slot is preserved (counts toward `maxPlayers`)
   - They are excluded from active player counts (`getActivePlayerCount()`)

4. **Pruning Process:**
   - `pruneDisconnectedPlayers(gracePeriodMs)` is called during room sweeps
   - Calculates cutoff time: `now - gracePeriodMs`
   - Players with `lastSeen < cutoff` are permanently removed
   - Players with `lastSeen >= cutoff` are kept (still in grace period)

**Code Flow:**
```javascript
// backend/src/server.js:205-207
async function persistRoom(room) {
  room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
  room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);
  // ...
}

// backend/src/gameRoom.js:260-332
pruneDisconnectedPlayers(gracePeriodMs) {
  const now = Date.now();
  const cutoff = now - gracePeriodMs;
  
  this.players = this.players.filter((player) => {
    if (player.connected) return true;
    
    const lastSeen = player.lastSeen ?? 0;
    const shouldKeep = lastSeen >= cutoff; // Within grace period
    
    return shouldKeep;
  });
}
```

**Key Behaviors:**
- **Reconnection:** Players can reconnect within 2 minutes and resume playing
- **Slot Preservation:** Disconnected players still count toward room capacity
- **Active Player Exclusion:** Disconnected players don't count in `getActivePlayers()`
- **Drawer Handling:** If drawer disconnects, `currentDrawer` is set to `null` and round may end
- **Owner Transfer:** If owner disconnects, ownership transfers to next active player

**Timeline Example:**
```
T+0s:   Player disconnects → marked as disconnected, lastSeen = now
T+30s:  Sweep runs → player still in grace period (kept)
T+45s:  No heartbeat → marked stale (if was connected)
T+60s:  Sweep runs → player still in grace period (kept)
T+90s:  Sweep runs → player still in grace period (kept)
T+120s: Sweep runs → player pruned (grace period expired)
```

---

### 2. Round-Ended Grace Period

**Purpose:** Provides time for players to see round results (word reveal, winner, scoreboard) before the next round starts.

**Configuration:**
- **Backend Delay:** `3000ms` (3 seconds) - hardcoded in `endRound()` function
- **Frontend Display:** `5000ms` (5 seconds) - auto-dismiss in `RoundSummary` component
- **Location:** `backend/src/server.js:1086-1134`, `src/games/paint-and-guess/components/RoundSummary.tsx:24-26`

**How It Works:**

1. **Round End Trigger:**
   - Round timer reaches 0, or
   - Drawer disconnects during active round, or
   - All players have guessed correctly (if implemented)

2. **Backend Round-Ended Phase:**
   - `endRound(roomId)` is called
   - Room state updated: `isRoundActive = false`, `roundEndsAt = null`
   - Word is revealed: `revealedWord = room.currentWord`, then `currentWord = null`
   - `round-ended` event emitted to all clients with:
     - Revealed word
     - Updated scores
     - Round number

3. **Frontend Round-Ended Display:**
   - `RoundSummary` component shows overlay with:
     - Revealed word
     - Round winner (first correct guesser)
     - Scoreboard (all players sorted by score)
   - Auto-dismisses after 5 seconds OR when next round starts

4. **Next Round Transition:**
   - After 3-second delay, backend starts next round:
     - Selects next drawer (rotates through active players)
     - Gets new random word
     - Emits `round-started` event
     - Starts round timer
   - Frontend transitions from `round-ended` → `drawing` phase

**Code Flow:**
```javascript
// backend/src/server.js:1086-1134
async function endRound(roomId) {
  // ... end current round ...
  
  io.to(roomId).emit("round-ended", {
    word: revealedWord,
    scores: serializePlayers(room.players),
    roundNumber: room.roundNumber,
  });
  
  // 3-second delay before next round
  setTimeout(async () => {
    room.nextRound(getWord);
    io.to(roomId).emit("round-started", { /* ... */ });
    // Start timer...
  }, 3000);
}

// src/games/paint-and-guess/components/RoundSummary.tsx:19-29
useEffect(() => {
  if (gameState.phase === "round-ended") {
    setIsDismissed(false);
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [gameState.phase, roundNumber]);
```

**Key Behaviors:**
- **Word Revelation:** Secret word is revealed to all players (not just drawer)
- **Winner Display:** First correct guesser is highlighted
- **Scoreboard Update:** All players see updated scores
- **Canvas Clearing:** Canvas is cleared via `round-ended` event listener
- **Chat Disabled:** Chat input is disabled during `round-ended` phase
- **Auto-Transition:** Next round starts automatically after 3 seconds

**Timeline Example:**
```
T+0s:   Round timer hits 0 → endRound() called
T+0s:   "round-ended" event emitted → frontend shows RoundSummary
T+0-3s: Players see word reveal, winner, scoreboard
T+3s:   Backend starts next round → "round-started" event emitted
T+3s:   Frontend transitions to "drawing" phase
T+5s:   RoundSummary auto-dismisses (if still showing)
```

---

### 3. Stale Heartbeat Threshold

**Purpose:** Detects when connected players have lost network connection but haven't explicitly disconnected.

**Configuration:**
- **Environment Variable:** `PLAYER_STALE_HEARTBEAT_MS`
- **Default Value:** `45,000ms` (45 seconds)
- **Location:** `backend/src/server.js:68`

**How It Works:**

1. **Heartbeat System:**
   - Clients send heartbeat pings every ~15 seconds
   - Backend responds with `heartbeat-ack` event
   - `markPlayerHeartbeat(playerId)` updates `lastSeen` timestamp

2. **Stale Detection:**
   - Background sweeper runs every 30 seconds
   - `markStalePlayersDisconnected()` checks all players
   - For each connected player:
     - Calculates time since last heartbeat: `now - lastSeen`
     - If `timeSinceLastSeen > PLAYER_STALE_HEARTBEAT_MS`:
       - Marks player as disconnected
       - Clears `socketId`
       - Resets `isReady` and `hasGuessed`
       - Updates `lastSeen` to current time (starts grace period)

3. **Grace Period Start:**
   - Once marked stale, player enters disconnect grace period
   - Can reconnect within 2 minutes (PLAYER_DISCONNECT_GRACE_PERIOD_MS)
   - After grace period expires, player is pruned

**Code Flow:**
```javascript
// backend/src/gameRoom.js:186-258
markStalePlayersDisconnected(staleThresholdMs) {
  const now = Date.now();
  const cutoff = now - staleThresholdMs;
  
  this.players = this.players.map((player) => {
    if (player.connected && player.lastSeen < cutoff) {
      // Mark as disconnected (enters grace period)
      return {
        ...player,
        connected: false,
        socketId: null,
        isReady: false,
        hasGuessed: false,
      };
    }
    return player;
  });
}
```

**Key Behaviors:**
- **Network Failure Detection:** Catches cases where socket doesn't explicitly disconnect
- **Browser Crash Handling:** Detects when browser closes without proper disconnect
- **Tab Suspension:** Detects when browser tab is suspended/backgrounded
- **Grace Period Entry:** Stale players enter disconnect grace period immediately

**Timeline Example:**
```
T+0s:   Last heartbeat received → lastSeen = now
T+15s:  Expected heartbeat → not received (network issue)
T+30s:  Expected heartbeat → not received
T+45s:  Sweep runs → player marked stale (45s since lastSeen)
        → Player enters disconnect grace period (2 minutes)
T+75s:  Sweep runs → player still in grace period
T+165s: Sweep runs → player pruned (grace period expired)
```

---

## Grace Period Interaction

### Combined Timeline Example

**Scenario:** Player loses network connection during active round

```
T+0s:   Network connection lost
        → Socket doesn't explicitly disconnect (browser crash/tab suspend)
        
T+15s:  Expected heartbeat → not received
T+30s:  Expected heartbeat → not received
T+45s:  Sweep runs → markStalePlayersDisconnected()
        → Player marked as disconnected
        → lastSeen updated to now
        → Enters disconnect grace period (2 minutes)
        
T+60s:  If drawer → round may end immediately
        → "round-ended" event → 3-second display period
        
T+75s:  Sweep runs → pruneDisconnectedPlayers()
        → Player still in grace period (kept)
        
T+135s: Player reconnects → markPlayerConnected()
        → Player restored to active state
        → Can continue playing
        
OR
        
T+165s: Sweep runs → pruneDisconnectedPlayers()
        → Grace period expired → player pruned
        → Slot freed for new player
```

---

## Configuration Summary

| Grace Period | Variable | Default | Purpose |
|-------------|----------|---------|---------|
| **Disconnect Grace** | `PLAYER_DISCONNECT_GRACE_PERIOD_MS` | 120,000ms (2 min) | Time before disconnected player slot is reclaimed |
| **Stale Heartbeat** | `PLAYER_STALE_HEARTBEAT_MS` | 45,000ms (45 sec) | Time before connected player is marked disconnected |
| **Round-Ended Display** | Hardcoded | 3,000ms (3 sec) | Backend delay before next round starts |
| **Round Summary UI** | Hardcoded | 5,000ms (5 sec) | Frontend auto-dismiss for round summary |
| **Sweep Interval** | `ROOM_SWEEP_INTERVAL_MS` | 30,000ms (30 sec) | Frequency of background room sweeps |

---

## Implementation Details

### Backend Grace Period Logic

**File:** `backend/src/gameRoom.js`

**Key Methods:**
1. `markPlayerDisconnected(playerId)` - Explicit disconnection
2. `markStalePlayersDisconnected(thresholdMs)` - Stale detection
3. `pruneDisconnectedPlayers(gracePeriodMs)` - Permanent removal
4. `markPlayerHeartbeat(playerId)` - Heartbeat update
5. `markPlayerConnected(playerId, socketId)` - Reconnection

**Sweep Process:**
```javascript
// backend/src/server.js:218-312
async function sweepRooms(trigger = "interval") {
  const rooms = roomRepository.getRooms();
  
  for (const room of rooms) {
    // 1. Mark stale players as disconnected
    room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
    
    // 2. Prune players past grace period
    const pruned = room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);
    
    // 3. Persist room state
    await persistRoom(room);
  }
}
```

### Frontend Round-Ended Display

**File:** `src/games/paint-and-guess/components/RoundSummary.tsx`

**Key Features:**
- Shows during `round-ended` and `game-ended` phases
- Auto-dismisses after 5 seconds for round-ended
- Manual dismissal for game-ended
- Displays word reveal, winner, and scoreboard
- Prevents interaction during display (chat disabled, canvas cleared)

**Phase Management:**
```typescript
// src/games/paint-and-guess/state/GameContext.tsx:329-346
socket.on("round-ended", ({ word, scores, roundNumber }) => {
  setGameState((prev) => ({
    ...prev,
    phase: "round-ended",
    round: {
      ...prev.round,
      revealedWord: word,
    },
  }));
  window.dispatchEvent(new CustomEvent("round-ended"));
});
```

---

## Edge Cases & Considerations

### 1. Drawer Disconnection During Round

**Behavior:**
- Drawer disconnects → `currentDrawer` set to `null`
- Round ends immediately via `endRound()`
- Other players see round-ended summary
- Next round starts with new drawer after 3 seconds

**Code:**
```javascript
// backend/src/server.js:1037-1040
if (room.isGameActive && wasDrawer) {
  console.log(`[Server] ⚠️ Drawer disconnected during active game, ending round`);
  await endRound(roomId);
}
```

### 2. Owner Disconnection

**Behavior:**
- Owner disconnects → ownership transfers to next active player
- `#ensureOwner()` method selects first active player
- Room remains functional with new owner

### 3. Room Capacity During Grace Period

**Behavior:**
- Disconnected players still count toward `maxPlayers`
- New players cannot join if room appears full (due to disconnected players)
- After grace period expires, slots are freed

**Code:**
```javascript
// backend/src/gameRoom.js:65-68
addPlayer(player) {
  if (this.getActivePlayerCount() >= this.maxPlayers) {
    throw new Error("Room is full");
  }
  // Uses getActivePlayerCount(), not players.length
}
```

### 4. Reconnection During Round-Ended Phase

**Behavior:**
- Player reconnects during round-ended grace period
- Sees round summary if still displayed
- Can participate in next round immediately
- Score and state preserved

### 5. Multiple Disconnections

**Behavior:**
- Each disconnected player has independent grace period
- Based on individual `lastSeen` timestamp
- Pruned independently when grace period expires

---

## Testing & Validation

### Test Scripts

1. **`scripts/test-heartbeat-sweep.ts`**
   - Tests stale heartbeat detection
   - Validates grace period behavior
   - Verifies pruning after grace period

2. **`scripts/test-multiplayer-reconnection-migration.ts`**
   - Tests reconnection scenarios
   - Validates player state preservation
   - Checks grace period handling

### Key Test Scenarios

1. **Disconnect → Reconnect Within Grace Period**
   - Player disconnects
   - Reconnects within 2 minutes
   - Should resume playing with preserved state

2. **Disconnect → Prune After Grace Period**
   - Player disconnects
   - Wait 2+ minutes
   - Player should be pruned, slot freed

3. **Stale Heartbeat → Grace Period**
   - Player stops sending heartbeats
   - After 45 seconds, marked stale
   - Enters 2-minute grace period
   - Can reconnect or be pruned

4. **Round-Ended Display**
   - Round ends
   - RoundSummary shows for 5 seconds
   - Next round starts after 3 seconds
   - Smooth transition

---

## Recommendations

### Current Implementation Strengths

1. ✅ **Reconnection Support:** 2-minute grace period allows for network recovery
2. ✅ **Stale Detection:** 45-second threshold catches network failures
3. ✅ **Round Transition:** 3-second delay provides smooth round transitions
4. ✅ **User Feedback:** 5-second display ensures players see results

### Potential Improvements

1. **Configurable Round-Ended Delay:**
   - Currently hardcoded to 3 seconds
   - Could be configurable per room or game mode
   - Allow players to skip if all ready

2. **Grace Period Visualization:**
   - Show countdown for disconnected players
   - Indicate when player slot will be freed
   - Display reconnection status

3. **Adaptive Grace Periods:**
   - Shorter grace period for inactive rooms
   - Longer grace period for active games
   - Based on game state and activity

4. **"Player is Choosing" Grace Period:**
   - Currently marked as future enhancement
   - Would add delay before word assignment
   - Gives drawer time to prepare

---

## Related Documentation

- **Game Hub Analysis:** `GameHubDocs/game-hub-analysis.md`
- **Canvas Implementation:** `GameHubDocs/paint-and-guess-canvas-complete.md`
- **Issues Tracking:** `GameHubDocs/issues.txt`
- **Backend README:** `backend/README.md`

---

## Summary

Paint & Guess implements a comprehensive grace period system that:

1. **Handles Network Failures:** 45-second stale detection + 2-minute reconnection window
2. **Smooth Round Transitions:** 3-second backend delay + 5-second frontend display
3. **Player State Preservation:** Disconnected players can reconnect and resume
4. **Automatic Cleanup:** Background sweeper prunes expired players every 30 seconds

The system balances user experience (allowing reconnection) with resource management (freeing slots after grace period) while providing clear feedback during round transitions.

