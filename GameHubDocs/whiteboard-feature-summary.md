# Whiteboard Feature - Technical Summary

## Overview

The Whiteboard is a real-time collaborative drawing application integrated into the GameHub. It enables multiple users to draw together on a shared canvas with synchronized updates across all connected clients. The feature uses WebSockets (Socket.io) for real-time communication and Fabric.js for canvas rendering.

## Architecture

### Frontend Stack
- **React** with TypeScript
- **Fabric.js** - Canvas drawing library
- **Socket.io Client** - WebSocket communication
- **React Router** - Navigation
- **shadcn-ui** - UI components
- **Tailwind CSS** - Styling

### Backend Stack
- **Node.js** with Express
- **Socket.io Server** - WebSocket server
- **In-Memory Storage** - Room management (can be extended with database)

## Key Components

### Frontend Components

#### 1. `Whiteboard.tsx` (Main Router Component)
- Entry point for the whiteboard feature
- Sets up routing between lobby and room views
- Wraps components in `WhiteboardProvider` context

**Routes:**
- `/hub/whiteboard` - Lobby view
- `/hub/whiteboard/room/:roomId` - Active room view

#### 2. `WhiteboardLobby.tsx`
Room creation and joining interface.

**Features:**
- Create new whiteboard rooms with custom names
- Join existing rooms via 6-digit PIN
- Player name input (persisted in localStorage)
- Avatar support (loaded from localStorage)
- Connection status indicator

**Key Functions:**
- `handleCreateRoom()` - Creates a room and navigates to it
- `handleJoinRoom()` - Joins an existing room via PIN

#### 3. `WhiteboardRoom.tsx`
Main drawing interface component.

**Features:**
- Real-time collaborative canvas drawing
- Color picker for brush color
- Brush size slider (1-50px range)
- Clear canvas button (triggers broadcast to all users)
- Player list display
- Room PIN display

**Canvas Configuration:**
- Fixed dimensions: 1000x700 pixels
- Responsive scaling to fit container
- Fabric.js for drawing operations

**Drawing Implementation:**
- Path-based drawing system
- Real-time point synchronization
- Optimized batch sending for performance
- Local and remote path tracking

#### 4. `WhiteboardContext.tsx`
Global state management for whiteboard rooms.

**State Includes:**
- Room ID and game PIN
- Player information (name, avatar, ID)
- Owner/host status
- Connected players list
- Socket connection status

**Key Functions:**
- `createRoom()` - Creates a new room
- `joinRoom()` - Joins existing room
- `leaveRoom()` - Leaves current room
- `clearCanvas()` - Broadcasts canvas clear
- `updateAvatar()` - Updates player avatar

**Socket Event Handlers:**
- `session` - Receives player ID
- `whiteboard:room-created` - Room creation confirmation
- `whiteboard:joined` - Join confirmation
- `whiteboard:room-state` - Room state updates
- `whiteboard:player-joined` - Player join notifications
- `whiteboard:player-left` - Player leave notifications
- `whiteboard:drawing-event` - Drawing synchronization
- `whiteboard:canvas-cleared` - Canvas clear notifications

#### 5. `useSocket.ts`
Custom hook for Socket.io connection management.

**Features:**
- Automatic connection establishment
- Connection status tracking
- Heartbeat mechanism (15s interval by default)
- Error handling with toast notifications

### Backend Components

#### 1. `whiteboardRoom.js`
Room data model class.

**Properties:**
- `id` - Unique room identifier
- `name` - Room display name
- `isPublic` - Room visibility flag
- `maxPlayers` - Maximum capacity (default: 20)
- `players` - Array of player objects
- `ownerId` - Room owner/creator ID
- `gamePin` - 6-digit PIN for joining

**Key Methods:**
- `generatePin()` - Creates 6-digit random PIN
- `addPlayer(player)` - Adds player to room
- `removePlayer(playerId)` - Removes player
- `markPlayerConnected(playerId, socketId)` - Updates connection status
- `markPlayerDisconnected(playerId)` - Marks player as disconnected
- `getActivePlayerCount()` - Returns connected player count
- `updatePlayerAvatar(playerId, avatar)` - Updates player avatar
- `toJSON()` - Serializes room for client

#### 2. `whiteboardRoomRepository.js`
In-memory room storage and management.

**Features:**
- Room creation with unique IDs
- Room lookup by ID or PIN
- Public room listing
- Room deletion

**Methods:**
- `createRoom({ name, isPublic, maxPlayers })` - Creates new room
- `getRoom(roomId)` - Gets room by ID
- `getRoomByPin(gamePin)` - Gets room by PIN
- `deleteRoom(roomId)` - Deletes room
- `listPublicRooms()` - Lists all public active rooms

#### 3. Socket Handlers (`server.js`)
Real-time event handlers for whiteboard operations.

**Socket Events:**

**Client → Server:**
- `whiteboard:create-room` - Create new room
  - Payload: `{ roomName, playerName, avatar }`
- `whiteboard:join-room` - Join existing room
  - Payload: `{ gamePin, playerName, avatar }`
- `whiteboard:drawing-event` - Send drawing updates
  - Payload: Drawing event object
- `whiteboard:clear-canvas` - Clear canvas
- `whiteboard:update-avatar` - Update player avatar
  - Payload: `{ avatar }`

**Server → Client:**
- `session` - Sends player ID after connection
  - Payload: `{ playerId }`
- `whiteboard:room-created` - Room creation confirmation
  - Payload: `{ roomId, gamePin, room }`
- `whiteboard:joined` - Join confirmation
  - Payload: `{ roomId, playerId }`
- `whiteboard:room-state` - Room state updates
  - Payload: Room JSON object
- `whiteboard:player-joined` - Player joined notification
  - Payload: `{ player, players }`
- `whiteboard:player-left` - Player left notification
  - Payload: `{ playerId, players }`
- `whiteboard:drawing-event` - Drawing synchronization
  - Payload: Drawing event object
- `whiteboard:canvas-cleared` - Canvas clear notification
- `error` - Error messages
  - Payload: `{ message }`

## Drawing System

### Path-Based Drawing

The whiteboard uses a path-based drawing system optimized for real-time synchronization:

**Path Events:**
1. **path-start** - Initializes a new drawing path
   - Contains: pathId, color, width, opacity, hardness
2. **path-update** - Updates an ongoing path
   - Contains: pathId, newPoints array, stroke properties
   - Batched for performance (min points or time threshold)
3. **path-complete** - Finalizes a path
   - Contains: pathId, complete path data

### Performance Optimizations

**Batching Strategy:**
- Minimum points per batch: Configurable threshold
- Fast drawing mode: Single point batches for rapid strokes
- Time-based flushing: Sends accumulated points at intervals
- Flush interval: Periodic sending of pending points

**Local State Management:**
- Immediate local rendering for instant feedback
- Separate tracking for local vs remote paths
- Path accumulation for incremental updates
- Finalized path tracking to prevent duplicates

**Drawing Constants:**
- Canvas dimensions: 1000x700 pixels
- Brush size range: 1-50 pixels
- Default brush size: 5 pixels
- Default color: Black (#000000)

## Room Management

### Room Creation Flow

1. User enters room name and player name
2. Client emits `whiteboard:create-room` event
3. Server creates room with unique ID and 6-digit PIN
4. Server adds creator as first player and sets as owner
5. Server joins socket to room namespace
6. Server emits `whiteboard:room-created` with room details
7. Client navigates to room view

### Room Joining Flow

1. User enters 6-digit PIN and player name
2. Client emits `whiteboard:join-room` event
3. Server looks up room by PIN
4. Server validates room exists and has capacity
5. Server adds player to room
6. Server joins socket to room namespace
7. Server broadcasts `whiteboard:player-joined` to existing players
8. Server emits `whiteboard:joined` and `whiteboard:room-state` to new player
9. Client navigates to room view

### Player Management

**Connection Tracking:**
- Players marked as connected/disconnected
- Last seen timestamp tracking
- Automatic owner reassignment if owner disconnects
- Graceful handling of stale connections

**Player Limits:**
- Default max players: 20 per room
- Room full validation on join attempts
- Active player count tracking

### Room Disconnection Handling

When a player disconnects:
1. Player marked as disconnected
2. Socket removed from room namespace
3. Other players notified via `whiteboard:player-left`
4. Owner reassigned if needed
5. Room persists for potential reconnection

## File Structure

```
src/pages/
├── Whiteboard.tsx                    # Main router component
└── whiteboard/
    ├── WhiteboardLobby.tsx          # Room creation/joining UI
    ├── WhiteboardRoom.tsx           # Drawing interface
    ├── hooks/
    │   └── useSocket.ts             # Socket connection hook
    └── state/
        └── WhiteboardContext.tsx    # Global state management

backend/src/
├── whiteboardRoom.js                # Room data model
├── whiteboardRoomRepository.js      # Room storage/management
└── server.js                        # Socket handlers (lines 942-1065)
```

## Integration with GameHub

The whiteboard is integrated into the GameHub ecosystem:

- **Routing**: Accessed via `/hub/whiteboard`
- **Navigation**: Part of main GameHub navigation
- **Authentication**: Uses GameHub player name and avatar system
- **Consistent UI**: Uses shared shadcn-ui components
- **Socket Server**: Shares backend Socket.io server with other game modes

## Technical Details

### Canvas Rendering
- Uses Fabric.js library for vector-based drawing
- Path objects with SVG path data
- Non-selectable, non-evented paths for performance
- Object caching disabled for real-time updates
- Responsive scaling while maintaining aspect ratio

### Real-Time Synchronization
- WebSocket-based event broadcasting
- Room-based socket namespaces
- Optimized event payloads
- Bidirectional communication
- Automatic reconnection handling

### State Persistence
- Player name persisted in localStorage
- Avatar configuration persisted in localStorage
- Room state managed in-memory on server
- No database persistence (can be extended)

### Error Handling
- Connection status validation
- Room validation (exists, capacity)
- Input sanitization (names, avatars)
- Toast notifications for user feedback
- Graceful degradation on errors

## Limitations & Future Enhancements

**Current Limitations:**
- No database persistence (rooms lost on server restart)
- No drawing history/undo functionality
- No shape tools (only freehand drawing)
- No text input
- No image upload/insert
- No room password protection
- No private messaging

**Potential Enhancements:**
- Persistent room storage (database)
- Drawing tools (shapes, text, stamps)
- Undo/redo functionality
- Drawing history playback
- Image import/export
- Room settings (privacy, permissions)
- User permissions (kick, mute, etc.)
- Mobile touch optimization
- Drawing layers
- Collaborative cursors (see other users' cursors)

## Configuration

### Environment Variables

**Frontend:**
- `VITE_SOCKET_URL` - Socket.io server URL
- `VITE_SOCKET_HEARTBEAT_INTERVAL_MS` - Heartbeat interval (default: 15000ms)

**Backend:**
- `PORT` - Server port (default: 3001)
- Redis configuration (optional, for horizontal scaling)

## Usage Example

1. **Create Room:**
   ```
   User enters room name: "Team Meeting"
   User enters name: "Alice"
   Clicks "Create Room"
   Receives PIN: 123456
   ```

2. **Join Room:**
   ```
   User enters PIN: 123456
   User enters name: "Bob"
   Clicks "Join Room"
   Enters collaborative whiteboard
   ```

3. **Drawing:**
   ```
   Select color: #FF0000 (red)
   Adjust brush size: 10px
   Draw on canvas
   Other users see drawing in real-time
   ```

4. **Clear Canvas:**
   ```
   Click "Clear" button
   All users' canvases cleared simultaneously
   ```

## Conclusion

The Whiteboard feature provides a solid foundation for real-time collaborative drawing. It demonstrates effective use of WebSockets for synchronization, Fabric.js for canvas rendering, and React Context for state management. The architecture is extensible and can support additional features like drawing tools, persistence, and advanced collaboration features.

