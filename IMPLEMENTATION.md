# Room Persistence and Stable Player IDs Implementation

## Summary

This implementation adds file-backed room storage and stable player identifiers that survive server restarts. Players can now reconnect to rooms after disconnection without losing their progress.

## Key Features

### 1. **File-Backed Room Repository**
- Rooms are persisted to `backend/data/rooms.json`
- Room state is automatically saved after significant changes
- Rooms survive server restarts
- Empty rooms are cleaned up automatically

### 2. **Stable Player IDs**
- Players receive UUIDs instead of socket-based IDs
- Player identity persists across disconnections
- Session tokens prevent player impersonation
- SocketIds are managed separately for communication

### 3. **Secure Reconnection**
- Session tokens are generated when players join
- Tokens are stored in localStorage on the client
- Server validates tokens before allowing reconnection
- Invalid reconnection attempts are rejected

### 4. **Timer Serialization**
- Game state (including elapsed time) is serialized
- Timers are restarted when drawer reconnects
- Round state is preserved during disconnections

## Files Changed

### Backend

#### New Files
- `backend/src/roomRepository.js` - File-backed storage implementation

#### Modified Files
- `backend/src/gameRoom.js` - Added stable player IDs, session tokens, serialization
- `backend/src/server.js` - Updated to use repository and handle reconnections

### Frontend

#### Modified Files
- `src/contexts/GameContext.tsx` - Store/use persistent player IDs and session tokens
- `src/pages/Room.tsx` - Use stored player ID for identity checks

### Configuration
- `.gitignore` - Exclude `backend/data/` directory

## Implementation Details

### Player Object Structure

**Before:**
```javascript
{
  id: socket.id,  // Ephemeral, changes on reconnect
  name: "Player Name",
  score: 0,
  isReady: false,
  avatar: "..."
}
```

**After:**
```javascript
{
  id: uuid(),           // Stable, persists across sessions
  socketId: socket.id,  // Ephemeral, updated on reconnect
  name: "Player Name",
  score: 0,
  isReady: false,
  avatar: "..."
}
```

### Session Flow

#### First Join
1. Client calls `joinRoom(roomId, playerName, avatar)`
2. Server generates stable `playerId` (UUID)
3. Server generates `sessionToken` (64-char hex)
4. Server stores token: `room.sessionTokens.set(playerId, sessionToken)`
5. Server sends `room-state` with `playerId` and `sessionToken`
6. Client stores in localStorage: 
   - `room_${roomId}_playerId`
   - `room_${roomId}_sessionToken`

#### Reconnection
1. Client checks localStorage for stored credentials
2. Client sends `reconnectPlayerId` and `reconnectToken`
3. Server validates: `room.validateSessionToken(playerId, token)`
4. If valid: Update `player.socketId`, preserve score/state
5. If invalid: Reject with error message

### Security Considerations

✅ **Session tokens are cryptographically random** (32 bytes)  
✅ **Tokens are validated on reconnection**  
✅ **Tokens are not broadcasted to other players**  
✅ **Invalid tokens are rejected immediately**  
❌ **Tokens stored in localStorage** (acceptable for game, not for sensitive data)

### Room Persistence Strategy

**When rooms are saved:**
- Player joins or leaves
- Game starts
- Player readies up
- Guess is made (score changes)
- Round ends

**What is persisted:**
- Room metadata (name, settings, owner)
- Player list (without socketIds)
- Game state (rounds, scores, drawer)
- Session tokens
- Word history

**What is NOT persisted:**
- Active timers (restarted on reconnect)
- Socket connections (ephemeral)
- Canvas drawing data (in-memory only)

## Security Fixes

### Issue 1: Player Impersonation (P1)
**Problem:** Old code trusted client-provided player IDs without validation.

**Solution:**
```javascript
// Before (VULNERABLE)
const existingPlayer = room.getPlayerById(reconnectPlayerId);
if (existingPlayer) {
  // Anyone could send another player's ID
  player = existingPlayer;
}

// After (SECURE)
if (existingPlayer && room.validateSessionToken(reconnectPlayerId, reconnectToken)) {
  player = existingPlayer;
} else {
  socket.emit("error", { message: "Invalid reconnection credentials" });
  return;
}
```

### Issue 2: Drawer Socket Reference (P1)
**Problem:** Player object was cloned without preserving socketId reference.

**Solution:**
```javascript
// Before (BROKEN)
room.addPlayer(player);
player.socketId = socket.id;  // Lost due to cloning

// After (FIXED)
player = {
  id: playerId,
  socketId: socket.id,  // Set BEFORE adding
  // ... other properties
};
room.addPlayer(player);  // No cloning, direct reference

// Drawer word delivery uses socketId
if (room.currentDrawer?.socketId) {
  io.to(room.currentDrawer.socketId).emit("draw-word", { word });
}
```

## Testing

### Manual Testing
1. Start servers: `npm run dev:all`
2. Open two browser windows
3. Create room in window 1
4. Join room in window 2
5. Refresh one window → Should reconnect automatically
6. Start game → Both players should see game state
7. Restart backend server → Rooms should persist

### Automated Testing
```bash
npm run test:multiplayer
```

**Expected results:**
- ✅ Room creation and host assignment
- ✅ Player joining and non-host status
- ✅ Non-host cannot start game
- ✅ Host can start when all ready
- ✅ Round progression
- ✅ Drawer rotation
- ✅ Host transfer on disconnect

## Migration Notes

### Breaking Changes
- Player IDs are now UUIDs instead of socket IDs
- Client must use stored playerId from localStorage
- Room state includes additional fields (`sessionToken`, `playerId`)

### Backward Compatibility
- Old rooms without session tokens will work but won't support reconnection
- Existing localStorage data is ignored (no conflicts)
- Frontend gracefully handles missing stored credentials

## Future Improvements

### Potential Enhancements
1. **Token expiration** - Add TTL to session tokens
2. **Database storage** - Replace JSON files with proper DB
3. **Room cleanup** - Auto-delete inactive rooms after 24h
4. **Drawing state** - Persist canvas data for reconnection
5. **Spectator mode** - Allow reconnection as observer when room is full
6. **Token refresh** - Implement token rotation for long sessions

### Performance Considerations
- File I/O is async (non-blocking)
- Rooms are kept in memory for fast access
- Consider Redis for production scalability
- Add room limit to prevent disk exhaustion

## Deployment Checklist

- [ ] Ensure `backend/data/` directory is created on deploy
- [ ] Add `backend/data/` to `.gitignore` (✅ Done)
- [ ] Consider volume mount for persistent storage in Docker
- [ ] Add error handling for disk full scenarios
- [ ] Monitor room file size growth
- [ ] Set up backup strategy for rooms.json

## API Changes

### Socket Events

#### join-room (Updated)
```javascript
// Client → Server
socket.emit("join-room", {
  roomId: string,
  playerName: string,
  avatar?: string,
  reconnectPlayerId?: string,    // NEW
  reconnectToken?: string         // NEW
});
```

#### room-state (Updated)
```javascript
// Server → Client
socket.on("room-state", {
  // ... existing fields
  sessionToken: string,  // NEW
  playerId: string       // NEW
});
```

#### player-disconnected (New)
```javascript
// Server → Clients
socket.on("player-disconnected", {
  playerId: string,
  playerName: string
});
```

## License

Same as parent project.

