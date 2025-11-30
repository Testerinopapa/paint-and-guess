# Canva Mode Summary

## Overview

Canva is a collaborative drawing game mode within the Paint & Guess game hub. It combines real-time collaborative canvas drawing with a word-guessing game mechanic. Players take turns drawing words while others guess, with scoring and round-based gameplay.

## Key Features

### 1. Real-Time Collaborative Canvas
- **Technology**: Fabric.js for canvas rendering, Socket.IO for real-time synchronization
- **Canvas Size**: Fixed 800x600 pixels (consistent across all clients)
- **Drawing Tools**: Brush with customizable color and size
- **Synchronization**: Real-time stroke synchronization across all connected clients
- **Drawing Permissions**: 
  - Free draw mode when game is not active
  - Restricted to current drawer during active rounds

### 2. Game Flow
- **Lobby Phase**: Players ready up before game starts
- **Round-Based Gameplay**: Multiple rounds with rotating drawers
- **Word Selection**: Random words from configurable word packs (default: "classic")
- **Scoring System**: Points awarded for correct guesses
- **Timer**: Configurable round time (default: 60 seconds)
- **Round Progression**: Automatic progression with 3-second delay between rounds

### 3. Player Management
- **Room System**: Create or join rooms via 6-digit PIN
- **Player Limits**: Maximum 10 players per room
- **Avatar Support**: Full integration with avatar system (DiceBear, custom images)
- **Player States**: Ready status, connection status, scores, guess status
- **Host Controls**: Room creator can start the game

### 4. Communication
- **Chat System**: Real-time chat messages
- **Unified Input**: Single input field that switches between chat and guess modes
- **Guess Input**: Automatically enabled for non-drawers during active rounds
- **Message History**: Chat messages displayed in sidebar

## Architecture

### Frontend Structure

```
src/games/canva/
├── components/
│   ├── Canvas.tsx           # Main drawing canvas component
│   ├── GameStage.tsx         # Active game UI
│   ├── LobbyStage.tsx        # Pre-game lobby UI
│   └── PlayerAvatar.tsx      # Avatar rendering component
├── pages/
│   ├── Lobby.tsx            # Room creation/joining
│   ├── Room.tsx             # Main room container
│   └── CanvaApp.tsx         # App entry point
├── state/
│   ├── CanvaContext.tsx     # Global state management
│   └── types.ts             # TypeScript interfaces
└── hooks/
    └── useSocket.ts         # Socket.IO connection hook
```

### Backend Structure

```
backend/src/
├── server.js                # Socket.IO event handlers
├── canvaRoom.js             # CanvaRoom class (room state management)
└── canvaRoomRepository.js   # Room storage and retrieval
```

## Core Components

### 1. Canvas Component (`Canvas.tsx`)

**Purpose**: Real-time collaborative drawing surface

**Key Features**:
- Fabric.js canvas initialization with fixed dimensions
- Drawing event batching for performance (60fps target)
- Path synchronization via Socket.IO
- Drawing permission enforcement (drawer-only during rounds)
  - Real-time permission checks using current game state
  - Overlay blocking pointer events for non-drawers
  - State-aware handlers that update when drawer changes
- Canvas clearing on round start/game start

**Technical Details**:
- Uses `PencilBrush` for smooth stroke rendering
- Batches path points to reduce network traffic
- Tracks active paths, accumulated points, and path properties
- Handles coordinate normalization to prevent offset issues
- Listens for `canva:canvas-clear` DOM events
- Permission checks use current game state (not stale closures)
- Overlay with `pointer-events-auto` blocks interactions for non-drawers
- Event handlers re-register when drawer/round state changes

**Drawing Flow**:
1. User draws → `path:start` event with initial point
2. Mouse move → `path:update` events with batched points
3. Mouse up → `path:complete` event with final path data
4. Events broadcast to all clients via Socket.IO
5. Remote clients render paths in real-time

### 2. State Management (`CanvaContext.tsx`)

**Purpose**: Global game state and Socket.IO communication

**State Properties**:
- Room information (ID, PIN, owner)
- Player list with scores, ready status, avatars
- Game flow state (round number, timer, current drawer, word)
- Connection status

**Key Actions**:
- `createRoom()`: Create new room with config
- `joinRoom()`: Join existing room by PIN
- `setReady()`: Toggle ready status
- `startGame()`: Host starts the game
- `makeGuess()`: Submit word guess
- `sendChatMessage()`: Send chat message
- `clearCanvas()`: Clear canvas manually

**Socket.IO Events**:
- `canva:room-created`: Room successfully created
- `canva:joined`: Successfully joined room
- `canva:room-state`: Full room state update
- `canva:player-joined/left`: Player list updates
- `canva:drawing-event`: Drawing synchronization
- `canva:game-started`: Game begins
- `canva:round-started`: New round begins
- `canva:round-ended`: Round ends with word reveal
- `canva:correct-guess`: Correct guess made
- `canva:round-timer`: Timer updates
- `canva:canvas-cleared`: Canvas cleared event

### 3. Backend Room Management (`canvaRoom.js`)

**Purpose**: Server-side room state and game logic

**CanvaRoom Class Properties**:
- Room metadata (ID, name, PIN, max players)
- Player list with game state (scores, ready, guesses)
- Game flow state (round number, timer, current drawer, word)
- Word pack and round configuration

**Key Methods**:
- `addPlayer()`: Add player to room
- `removePlayer()`: Remove player from room
- `startGame()`: Initialize game and select first drawer
- `nextRound()`: Advance to next round
  - Saves previous drawer ID before resetting player states
  - Gets active players after state reset to use updated objects
  - Rotates drawer by finding previous drawer index and moving to next
  - Always gets fresh player reference from updated players array
- `makeGuess()`: Process player guess
- `getActivePlayers()`: Get connected players
- `allPlayersReady()`: Check if all players are ready
- `startRoundTimer()`: Start countdown timer
  - Prevents multiple end calls with `hasCalledEnd` flag
  - Clears timer immediately when time expires
- `endRound()`: End current round

**Game Flow Logic**:
1. All players ready → Host can start game
2. Game starts → First drawer selected, word assigned, timer starts
3. Drawer draws → Others guess (drawing blocked for guessers via overlay and permission checks)
4. Correct guess → Points awarded, round continues
5. Time expires or word guessed → Round ends
6. Round end → `currentDrawer` cleared, `isRoundActive` set to false
7. 3-second delay → Next round starts with new drawer
8. New round → `currentDrawer` updated, `isRoundActive` set to true, canvas cleared
9. All rounds complete → Game ends

## Data Flow

### Room Creation Flow

1. **Client**: User enters name and room name
2. **Client**: Loads avatar config from localStorage
3. **Client**: Encodes avatar config as JSON string
4. **Client**: Emits `canva:create-room` with roomName, playerName, avatar
5. **Server**: Creates `CanvaRoom` instance
6. **Server**: Generates 6-digit PIN
7. **Server**: Adds creator as owner and first player
8. **Server**: Emits `canva:room-created` with room state
9. **Client**: Updates state and navigates to room

### Drawing Synchronization Flow

1. **Drawer**: Mouse down → Creates path, emits `path:start`
2. **Drawer**: Mouse move → Accumulates points, emits `path:update` (batched)
3. **Drawer**: Mouse up → Finalizes path, emits `path:complete`
4. **Server**: Receives drawing events, broadcasts to all clients in room
5. **Remote Clients**: Receive events, render paths on their canvas
6. **All Clients**: Canvas stays synchronized in real-time

### Game Round Flow

1. **Lobby**: Players ready up
2. **Host**: Starts game → `canva:start-game` event
3. **Server**: Selects first drawer, gets random word, starts timer
4. **Server**: Emits `canva:game-started` and `canva:round-started`
5. **Server**: Sends `canva:draw-word` to drawer only
6. **Drawer**: Receives word, can draw on canvas
7. **Guessers**: See canvas, can submit guesses
8. **Server**: Processes guesses, awards points, emits events
9. **Round End**: Timer expires or word guessed
10. **Server**: Emits `canva:round-ended` with revealed word
11. **Server**: 3-second delay, then starts next round
12. **Repeat**: Until all rounds complete

## Integration Points

### Avatar System

- **Lobby**: Loads avatar config before creating/joining rooms
- **Transmission**: Avatar configs encoded as JSON strings
- **Storage**: Avatars stored in player objects on server
- **Rendering**: `PlayerAvatar` component handles all avatar formats
- **Sync**: Listens for `avatar-config-updated` events

### Word Packs

- **Source**: Same word packs as Paint & Guess mode
- **Selection**: Configurable on room creation (default: "classic")
- **Word Selection**: Random word from selected pack
- **Word History**: Tracks used words to prevent repeats

### Hub Integration

- **Entry Point**: `hubEntry.tsx` registers game in hub
- **Routing**: `/games/canva` for lobby, `/games/canva/room/:roomId` for rooms
- **Navigation**: Integrated with main hub navigation

## Technical Highlights

### Coordinate System

- **Fixed Dimensions**: 800x600 pixels prevents scaling issues
- **Explicit Sizing**: Canvas element width/height set explicitly
- **Offset Calculation**: `calcOffset()` called after initialization and on resize
- **Path Coordinates**: Absolute coordinates stored, not relative to bounding box
- **Serialization**: Path data manually constructed to avoid Fabric.js coordinate quirks

### Performance Optimizations

- **Batching**: Drawing points batched before sending (target: 60fps)
- **Fast Draw Detection**: Smaller batches for rapid drawing
- **Flush Intervals**: Periodic flushing of accumulated points
- **Path Tracking**: Efficient tracking of active paths and properties

### Error Handling

- **Connection Status**: Visual indicators for connection state
- **Room Validation**: PIN validation, room capacity checks
- **Player Disconnection**: Graceful handling of disconnects
- **Canvas Errors**: Fallback rendering for failed path creation
- **Race Condition Prevention**: Guard flags prevent concurrent round endings
- **Timer Safety**: Timer cleared immediately on round end to prevent duplicate calls
- **Drawer Validation**: Drawer verified before each round start

## Configuration

### Room Creation Options

- `roomName`: Display name for the room
- `playerName`: Player's display name
- `avatar`: Encoded avatar config (JSON string)
- `wordPack`: Word pack ID (default: "classic")
- `roundTime`: Round duration in seconds (default: 60)
- `maxRounds`: Total number of rounds (default: 6)

### Default Values

- **Max Players**: 10 per room
- **Round Time**: 60 seconds
- **Max Rounds**: 6 rounds
- **Word Pack**: "classic"
- **Canvas Size**: 800x600 pixels

## Socket.IO Events

### Client → Server

- `canva:create-room`: Create new room
- `canva:join-room`: Join room by PIN
- `canva:set-ready`: Toggle ready status
- `canva:start-game`: Host starts game
- `canva:guess`: Submit word guess
- `canva:chat-message`: Send chat message
- `canva:drawing-event`: Drawing synchronization
- `canva:clear-canvas`: Clear canvas manually

### Server → Client

- `session`: Player ID assignment
- `canva:room-created`: Room creation confirmation
- `canva:joined`: Join confirmation
- `canva:room-state`: Full room state update
- `canva:player-joined`: New player joined
- `canva:player-left`: Player left room
- `canva:player-ready`: Player ready status changed
- `canva:game-started`: Game started
- `canva:round-started`: New round started
- `canva:round-ended`: Round ended
- `canva:draw-word`: Word for drawer (private)
- `canva:round-timer`: Timer update
- `canva:correct-guess`: Correct guess made
- `canva:wrong-guess`: Incorrect guess
- `canva:game-ended`: Game completed
- `canva:canvas-cleared`: Canvas cleared
- `canva:drawing-event`: Drawing synchronization
- `error`: Error message

## UI Components

### Lobby Stage

- **Player List**: Shows all players with avatars and ready status
- **Ready Button**: Toggle ready status
- **Start Game Button**: Host-only, enabled when all ready
- **Room PIN Display**: Shows 6-digit PIN for sharing
- **Game Rules**: Instructions for players

### Game Stage

- **Canvas**: Main drawing area (800x600)
- **Game Info**: Round number, timer, current drawer
- **Player List**: Sorted by score, shows avatars and scores
- **Chat/Guess Input**: Unified input that switches modes
- **Chat Messages**: Message history display
- **Word Display**: Shows word to drawer, revealed to all after round

## Future Enhancements

### Potential Improvements

1. **Drawing Tools**: Additional tools (shapes, text, eraser)
2. **Canvas History**: Undo/redo functionality
3. **Custom Word Lists**: User-created word packs
4. **Spectator Mode**: Watch games without playing
5. **Replay System**: Record and replay games
6. **Canvas Templates**: Pre-drawn backgrounds or templates
7. **Team Mode**: Team-based gameplay
8. **Power-ups**: Special abilities or modifiers
9. **Canvas Export**: Save drawings as images
10. **Mobile Support**: Touch-optimized drawing

## Dependencies

### Frontend

- `fabric`: Canvas drawing library
- `socket.io-client`: Real-time communication
- `react`: UI framework
- `@/lib/avatar/*`: Avatar system integration
- `@/components/ui/*`: UI components (shadcn-ui)

### Backend

- `socket.io`: WebSocket server
- `express`: HTTP server
- `uuid`: Unique ID generation

## Notes

- Canvas uses fixed dimensions to prevent coordinate drift
- Drawing events are batched for performance
- Avatar system fully integrated with DiceBear support
- Word packs shared with Paint & Guess mode
- Round progression includes 3-second delay between rounds
- Canvas automatically clears at round start
- Drawing restricted to current drawer during active rounds
  - Permission checks use current game state (not stale closures)
  - Overlay blocks pointer events for non-drawers
  - Event handlers update when drawer/round state changes
- Unified chat/guess input simplifies UI
- Drawer rotation handles player state updates correctly
  - Drawer ID saved before player state reset
  - Active players retrieved after state reset
  - Fresh player references used to avoid stale objects
- Timer prevents multiple end calls with guard flag
- Room state updates preserve drawer during active rounds





