# Canva Mode Score System Analysis

## Overview

The Canva mode scoring system is a time-based, collaborative scoring mechanism that rewards players for correctly guessing words during active rounds. The system incentivizes fast guesses and provides bonus points to drawers when their word is guessed correctly.

## Core Scoring Formula

### Guesser Points Calculation

Points are calculated using a **time-based formula** that rewards faster guesses:

```javascript
points = Math.max(1, Math.floor(timeRemaining / 10) + 10)
```

**Formula Breakdown:**
- `timeRemaining`: Seconds remaining in the round when the guess is made
- Divides time remaining by 10
- Adds a base of 10 points
- Uses `Math.max(1, ...)` to ensure minimum 1 point

**Examples:**
- **60 seconds remaining**: `floor(60/10) + 10 = 16 points`
- **30 seconds remaining**: `floor(30/10) + 10 = 13 points`
- **10 seconds remaining**: `floor(10/10) + 10 = 11 points`
- **0 seconds remaining**: `floor(0/10) + 10 = 10 points`

**Key Characteristics:**
- Points decrease as time passes (rewarding speed)
- Minimum guaranteed: 1 point
- Maximum points: ~16-17 points (when guessed immediately after round start)
- Linear scaling with time remaining

### Drawer Points

The drawer receives a **fixed bonus** when any player correctly guesses their word:

```javascript
drawerPoints = 5
```

**Conditions:**
- Only awarded **once per round** (first correct guess)
- Tracked via `drawerRewarded` flag in `CanvaRoom`
- Reset at the start of each new round
- If multiple players guess correctly, only the first correct guess triggers the drawer bonus

## Score Award Flow

### 1. Guess Submission

Location: `backend/src/server.js:965-1015`

**Process:**
1. Player submits guess via `canva:guess` socket event
2. Server validates:
   - Room exists and is in active round
   - Player is not the drawer
   - Player hasn't already guessed this round
   - Player is connected
3. Guess is normalized (lowercase, trimmed) and compared to word
4. If correct → `room.makeGuess()` is called with `isCorrect = true`
5. If incorrect → `canva:wrong-guess` event emitted (no score change)

### 2. Score Calculation & Award

Location: `backend/src/canvaRoom.js:293-316`

**Correct Guess Processing:**

```javascript
makeGuess(playerId, guess, isCorrect) {
  // 1. Mark player as having guessed
  player.hasGuessed = true;
  
  if (isCorrect) {
    // 2. Calculate points based on time remaining
    const timeRemaining = this.getTimeRemainingSeconds();
    const points = Math.max(1, Math.floor(timeRemaining / 10) + 10);
    
    // 3. Award points to guesser
    player.score += points;
    
    // 4. Award bonus to drawer (first correct guess only)
    if (this.currentDrawer && !this.drawerRewarded) {
      this.currentDrawer.score += 5;
      this.drawerRewarded = true;
    }
    
    return { correct: true, points, playerName: player.name };
  }
  
  return { correct: false, playerName: player.name };
}
```

### 3. Score Broadcast

Location: `backend/src/server.js:988-1008`

After score calculation, the server:
1. Retrieves updated player list with new scores
2. Emits `canva:correct-guess` event to all clients in room
3. Event includes:
   - Guessing player info
   - Points awarded
   - Revealed word
   - **Complete updated players array** with new scores

### 4. Frontend Score Update

Location: `src/games/canva/state/CanvaContext.tsx:136-169`

**State Update Process:**

```javascript
onCorrectGuess = ({ player, points, word, players }) => {
  setGameState((prev) => {
    // Merge server player data (with updated scores) into local state
    const newPlayersMap = new Map(players.map((p) => [p.id, p]));
    
    const updatedPlayers = prev.players.map((existingPlayer) => {
      const newPlayer = newPlayersMap.get(existingPlayer.id);
      if (newPlayer) {
        // Server data (includes updated scores) overrides local
        return { ...existingPlayer, ...newPlayer };
      }
      return existingPlayer;
    });
    
    // Add any new players from server
    players.forEach((newPlayer) => {
      if (!updatedPlayers.find((p) => p.id === newPlayer.id)) {
        updatedPlayers.push(newPlayer);
      }
    });
    
    return {
      ...prev,
      players: updatedPlayers,
      currentWord: word, // Reveal word when guessed correctly
    };
  });
  
  toast.success(`${player.name} guessed correctly! +${points} points`);
};
```

**Key Points:**
- Server is source of truth for scores
- Frontend merges server data into local state
- Word is revealed to all players when correctly guessed
- Toast notification shows points awarded

## Score Display

Location: `src/games/canva/components/GameStage.tsx:83-99`

**Player List Display:**

```tsx
{gameState.players
  .sort((a, b) => (b.score || 0) - (a.score || 0))
  .map((player) => (
    <div key={player.id}>
      <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
      <span>{player.name}{player.id === gameState.currentDrawer?.id && " 🎨"}</span>
      <span className="text-xs font-semibold">{player.score || 0}</span>
    </div>
  ))}
```

**Display Characteristics:**
- Players sorted by score (highest first)
- Shows avatar, name, and current score
- Drawer marked with 🎨 emoji
- Defaults to 0 if score is undefined/null
- Updates in real-time as scores change

## Score Initialization

Location: `backend/src/canvaRoom.js:28-36`

**Player Creation:**

Scores are initialized when:
1. Room is created (`constructor`)
2. Player joins room (`addPlayer`)

```javascript
this.players = players.map((player) => ({
  ...player,
  score: player.score ?? 0,  // Default to 0 if not set
  // ... other properties
}));
```

**Reset Behavior:**
- Scores are **NOT reset** when game starts
- Scores persist across rounds within a game
- Scores accumulate throughout the entire game session
- Only reset if player leaves and rejoins (new player object)

## Round and Game End Scoring

### Round End

Location: `backend/src/server.js:1049-1090`

**What Happens:**
- Round ends when:
  - Timer expires (time reaches 0)
  - All players (except drawer) have guessed correctly
- **No bonus points** awarded at round end
- Scores remain unchanged (already awarded during round)
- Word is revealed to all players
- `canva:round-ended` event emitted with revealed word

### Game End

Location: `backend/src/server.js:1077-1083`

**What Happens:**
- Game ends when:
  - Maximum rounds reached (`roundNumber >= maxRounds`)
  - Less than 2 active players remain
- **No final scoring bonuses**
- Final scores sent via `canva:game-ended` event
- Player list includes final accumulated scores

**Final Score Data:**
```javascript
io.to(roomId).emit("canva:game-ended", {
  players: room.toJSON().players,  // Includes final scores
});
```

## Score Tracking & Persistence

### In-Memory Storage

- Scores stored in `CanvaRoom` class instance
- Lives in `canvaRoomRepository` (in-memory Map)
- **Not persisted** to database
- Lost when server restarts

### Score Data Structure

```javascript
player = {
  id: string,
  name: string,
  avatar: string,
  score: number,        // Current total score
  hasGuessed: boolean,  // Whether guessed this round
  connected: boolean,
  isReady: boolean,
  // ... other properties
}
```

### Score Updates

Scores are updated:
- **Synchronously** on correct guess (immediate)
- **Broadcast** via Socket.IO events
- **Merged** into frontend state
- **Displayed** in real-time in UI

## Special Cases & Edge Cases

### 1. Multiple Correct Guesses in Same Round

- Only **first correct guess** awards points
- Subsequent correct guesses by other players:
  - Still marked as `hasGuessed = true`
  - Do not award points
  - Do not trigger drawer bonus again

### 2. Drawer Guessing

- Drawer **cannot guess** their own word
- Validation in `makeGuess()` prevents this
- Drawer only receives points from drawer bonus

### 3. Time Expiration

- If round ends without any correct guesses:
  - No points awarded
  - Drawer does not receive bonus
  - All players' `hasGuessed` remains false

### 4. Disconnection During Round

- Disconnected players keep their current score
- Cannot receive new points while disconnected
- Score persists if they reconnect (same player ID)

### 5. Round Reset

Location: `backend/src/canvaRoom.js:166-224`

When new round starts:
- `hasGuessed` reset to `false` for all players
- `drawerRewarded` reset to `false`
- **Scores are NOT reset** (accumulate across rounds)
- New drawer selected (rotation)

## Comparison with Other Game Modes

### Canva Mode vs. Trivia Mode

| Aspect | Canva Mode | Trivia Mode |
|--------|-----------|-------------|
| Base Formula | `floor(timeRemaining/10) + 10` | `BASE_POINTS * speedFactor + streakBonus` |
| Base Points | ~10-16 points | 1000 base points |
| Speed Factor | Linear with time | Exponential speed bonus |
| Streak Bonus | None | Yes (accumulates) |
| Drawer Bonus | 5 points (fixed) | N/A |
| Round End Bonus | None | None |

### Key Differences

1. **Scale**: Canva uses smaller point values (10-16 vs 1000+)
2. **Complexity**: Canva formula is simpler (linear vs exponential)
3. **Streaks**: Trivia rewards consecutive correct answers; Canva does not
4. **Collaboration**: Canva rewards drawer; Trivia is individual competition

## Potential Improvements

### 1. Streak System
- Add streak tracking for consecutive correct guesses
- Bonus points for maintaining streaks

### 2. First Guess Bonus
- Extra points for being the first to guess correctly in a round
- Could be 2-3x the normal points

### 3. Speed Multipliers
- Exponential scaling for very fast guesses (< 10 seconds)
- Encourages quick thinking

### 4. Drawer Performance Bonus
- Additional points if multiple players guess correctly
- Rewards drawing skill

### 5. Perfect Round Bonus
- Bonus if all players guess correctly before time expires
- Encourages good drawing and engagement

## Code Locations Summary

| Component | File | Key Functions |
|-----------|------|---------------|
| Score Calculation | `backend/src/canvaRoom.js` | `makeGuess()` (lines 293-316) |
| Guess Handling | `backend/src/server.js` | `socket.on("canva:guess")` (lines 965-1015) |
| Score Broadcast | `backend/src/server.js` | `canva:correct-guess` event (lines 992-997) |
| Frontend Update | `src/games/canva/state/CanvaContext.tsx` | `onCorrectGuess()` (lines 136-169) |
| Score Display | `src/games/canva/components/GameStage.tsx` | Player list render (lines 83-99) |

## Formula Visualization

```
Points Awarded
      ↑
  16  |●
      |
  14  |
      |
  12  |      ●
      |
  10  |           ●
      |                ●
      +────────────────────────→ Time Remaining (seconds)
      0    20    40    60
```

**Key Takeaway:** Points decrease linearly with time, encouraging fast guesses while still rewarding correct answers made later in the round.

