# Canva Mode Lobby Analysis

## Overview

Canva mode has **two distinct lobby stages** that serve different purposes in the game flow. Each lobby has specific responsibilities, UI components, and state management requirements.

---

## 1. Entry Lobby (`Lobby.tsx`)

### Purpose
The **Entry Lobby** is the initial landing page where players first enter the canva mode. It provides the interface for creating new rooms or joining existing rooms.

### Location
- **File**: `src/games/canva/pages/Lobby.tsx`
- **Route**: `/hub/games/canva`
- **Component**: `CanvaLobby`

### Key Features

#### Room Creation
- **Input Fields**:
  - Player name (auto-filled from authenticated user's username if available)
  - Room name
- **Avatar Integration**:
  - Loads avatar config from authenticated user or localStorage
  - Listens for `avatar-config-updated` events
  - Encodes avatar config before sending to server
- **Action**: Emits `canva:create-room` event with:
  - `roomName`: Sanitized room name
  - `playerName`: Sanitized player name
  - `avatar`: Encoded avatar config (JSON string)
  - Optional: `wordPack`, `roundTime`, `maxRounds` (defaults used)

#### Room Joining
- **Input Fields**:
  - Player name (auto-filled from authenticated user's username if available)
  - Game PIN (6-digit code, maxLength: 6)
- **Avatar Integration**: Same as room creation
- **Action**: Emits `canva:join-room` event with:
  - `gamePin`: 6-digit room PIN
  - `playerName`: Sanitized player name
  - `avatar`: Encoded avatar config (JSON string)

### State Management

#### Local State
- `roomName`: Room name input
- `playerName`: Player name input (auto-filled from auth)
- `gamePin`: PIN input for joining
- `avatarConfig`: Current avatar configuration

#### Context State
- `gameState.roomId`: Set when room is created/joined, triggers navigation
- `isConnected`: Socket connection status

### User Flow

1. **User arrives at `/hub/games/canva`**
2. **Player name auto-filled** (if authenticated)
3. **Avatar loaded** from user or localStorage
4. **User chooses**:
   - **Create Room**: Enter room name → Click "Create Room" → Navigate to room
   - **Join Room**: Enter PIN → Click "Join Room" → Navigate to room
5. **Navigation**: When `gameState.roomId` is set, automatically navigates to `/hub/games/canva/room/${roomId}`

### Server Events

#### Client → Server
- `canva:create-room`: Create new room
- `canva:join-room`: Join existing room by PIN

#### Server → Client
- `canva:room-created`: Room successfully created (includes roomId, gamePin, room state)
- `canva:joined`: Successfully joined room (includes roomId, playerId)
- `canva:room-state`: Full room state update
- `session`: Player ID assignment
- `error`: Error messages (invalid PIN, room full, etc.)

### UI Components

- **Two Cards**:
  1. **Create Room Card**: Room name input, create button
  2. **Join Room Card**: PIN input, join button
- **Connection Status**: Shows "Connecting to server..." when disconnected
- **Avatar Tip**: Reminder about avatar customization

### Validation

- **Room Creation**: Requires both `roomName` and `playerName` to be non-empty
- **Room Joining**: Requires both `gamePin` and `playerName` to be non-empty
- **Server Validation**:
  - PIN must exist in room repository
  - Room must not be full (max 10 players)
  - Names sanitized (max 24 chars, alphanumeric + spaces/hyphens/apostrophes)

---

## 2. Pre-Game Lobby (`LobbyStage.tsx`)

### Purpose
The **Pre-Game Lobby** is the room lobby where players wait, ready up, and the host starts the game. This is shown when `gameState.isGameActive === false`.

### Location
- **File**: `src/games/canva/components/LobbyStage.tsx`
- **Route**: `/hub/games/canva/room/:roomId` (when game not active)
- **Component**: `LobbyStage`

### Key Features

#### Player Management
- **Player List**: Displays all players in the room with:
  - Avatar (using `PlayerAvatar` component)
  - Player name
  - "(You)" indicator for current player
  - "👑" indicator for room owner/host
  - "✓ Ready" indicator for ready players

#### Ready System
- **Ready Toggle**: Players can toggle their ready status
- **Ready Button**: Shows "✓ Ready" or "Not Ready" based on state
- **All Players Ready**: Displays "All players ready!" when condition met
- **Minimum Players**: Requires at least 2 players before ready is enabled

#### Host Controls
- **Start Game Button**: Only visible to host (room owner)
- **Enabled When**:
  - All players are ready (`gameState.allPlayersReady === true`)
  - At least 2 players in room
- **Action**: Emits `canva:start-game` event

#### Room Information
- **Room PIN Display**: Shows 6-digit PIN for sharing
- **Game Instructions**: How to play guide
- **Player Count**: Shows current number of players

### State Management

#### Context State Used
- `gameState.players`: Array of all players
- `gameState.selfId`: Current player's ID
- `gameState.ownerId`: Room owner's ID
- `gameState.isReady`: Current player's ready status
- `gameState.allPlayersReady`: Whether all players are ready
- `gameState.gamePin`: Room PIN for display

#### Actions
- `setReady(boolean)`: Toggle ready status
- `startGame()`: Host starts the game
- `onLeaveRoom()`: Leave room and return to entry lobby

### User Flow

1. **Player enters room** (from Entry Lobby or direct URL)
2. **Sees player list** with all current players
3. **Clicks "Ready"** when prepared
4. **Waits for all players** to ready up
5. **Host sees "Start Game" button** when all ready
6. **Host clicks "Start Game"**
7. **Game begins** → Transitions to `GameStage`

### Server Events

#### Client → Server
- `canva:set-ready`: Toggle ready status (includes `isReady: boolean`)
- `canva:start-game`: Host starts the game

#### Server → Client
- `canva:player-ready`: Player ready status changed (includes `playerId`, `isReady`, `allReady`, `players`)
- `canva:game-started`: Game started (includes `drawer`, `roundTime`, `roundNumber`)
- `canva:player-joined`: New player joined room
- `canva:player-left`: Player left room
- `canva:room-state`: Full room state update

### UI Layout

**Grid Layout** (responsive):
- **Left Sidebar** (1 column on mobile, 1/3 on desktop):
  - Player list card
  - Ready up card (with start game button for host)
- **Main Area** (2 columns on desktop):
  - Game instructions
  - Room PIN display

### Validation

- **Ready Toggle**: Requires at least 2 players in room
- **Start Game**: 
  - Only host can start
  - Requires all players ready
  - Requires at least 2 players
- **Server Validation**:
  - Only owner can start game
  - All players must be ready
  - At least 2 active players required

---

## Lobby Transition Flow

```
Entry Lobby (Lobby.tsx)
    ↓
[Create/Join Room]
    ↓
Pre-Game Lobby (LobbyStage.tsx)
    ↓
[All Ready + Host Starts]
    ↓
Game Stage (GameStage.tsx)
    ↓
[Game Ends]
    ↓
Pre-Game Lobby (LobbyStage.tsx) [if staying in room]
```

### State Transitions

1. **Entry → Pre-Game**:
   - `gameState.roomId` set → Navigation triggered
   - `canva:room-created` or `canva:joined` received
   - `canva:room-state` received → Full state loaded

2. **Pre-Game → Game**:
   - `gameState.isGameActive` changes from `false` to `true`
   - `canva:game-started` received
   - Component switches from `LobbyStage` to `GameStage`

3. **Game → Pre-Game** (after game ends):
   - `gameState.isGameActive` changes from `true` to `false`
   - `canva:game-ended` received
   - Component switches from `GameStage` to `LobbyStage`

---

## Key Differences

| Feature | Entry Lobby | Pre-Game Lobby |
|---------|-------------|----------------|
| **Purpose** | Room creation/joining | Pre-game waiting |
| **Location** | `/hub/games/canva` | `/hub/games/canva/room/:roomId` |
| **State** | No room context | Room context active |
| **Player List** | None | Full player list with avatars |
| **Ready System** | None | Full ready system |
| **Host Controls** | None | Start game button |
| **Room PIN** | Not shown | Displayed prominently |
| **Navigation** | To room | To game or back to entry |
| **Socket Events** | Create/join only | Ready, start game, player updates |

---

## Technical Implementation Details

### Entry Lobby

#### Avatar Handling
```typescript
// Loads from multiple sources in priority order:
1. Authenticated user's avatarConfig (if logged in)
2. localStorage (via safeLoadAvatarConfig())
3. Default avatar config

// Listens for updates:
window.addEventListener("avatar-config-updated", ...)
```

#### Navigation Trigger
```typescript
useEffect(() => {
  if (gameState.roomId) {
    navigate(`/hub/games/canva/room/${gameState.roomId}`);
  }
}, [gameState.roomId, navigate]);
```

### Pre-Game Lobby

#### Ready State Management
```typescript
// Toggle ready status
const handleReadyToggle = () => {
  setReady(!gameState.isReady);
};

// Server validates and broadcasts to all players
```

#### Host Detection
```typescript
const isHost = gameState.ownerId === gameState.selfId;
```

#### All Players Ready Check
```typescript
// Server calculates:
allPlayersReady = activePlayers.length >= 2 && 
                  activePlayers.every(player => player.isReady)

// Client receives via canva:player-ready event
```

---

## Error Handling

### Entry Lobby Errors
- **Invalid PIN**: Server emits `error` event → Toast notification
- **Room Full**: Server emits `error` event → Toast notification
- **Connection Lost**: Shows "Connecting to server..." message
- **Name Validation**: Client-side validation before emit

### Pre-Game Lobby Errors
- **Start Game Failures**: Server validates and emits `error` if conditions not met
- **Player Disconnection**: Handled via `canva:player-left` event
- **Room State Sync**: `canva:room-state` keeps all clients in sync

---

## Future Enhancements

### Potential Improvements

1. **Entry Lobby**:
   - Room browser/list (for public rooms)
   - Room settings (word pack, round time, max rounds) in UI
   - Recent rooms history
   - Room password protection

2. **Pre-Game Lobby**:
   - Chat system (already in game stage, could add to lobby)
   - Player kick functionality (host only)
   - Room settings modification (host only)
   - Spectator mode
   - Ready countdown timer
   - Player roles/teams

---

## Summary

The canva mode uses a **two-stage lobby system**:

1. **Entry Lobby**: Simple, focused on room creation/joining with minimal state
2. **Pre-Game Lobby**: Rich, focused on player coordination and game preparation

This separation provides:
- **Clear user flow**: Easy to understand progression
- **Focused responsibilities**: Each lobby has a single, clear purpose
- **Better state management**: Room state only loaded when in room
- **Improved UX**: Players know exactly where they are in the flow

The transition between lobbies is handled automatically via state changes and navigation, creating a seamless experience for players.

