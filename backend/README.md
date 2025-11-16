# Paint & Guess Backend

Backend server for the Paint & Guess multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - Prisma database URL (SQLite). If unset, defaults to `file:backend/data/rooms.db`.

## Prisma setup

This backend uses Prisma + SQLite to persist rooms.

1. Generate Prisma client:
```bash
npm run prisma:generate
```

2. Apply migrations (creates the `Room` table if missing):
```bash
npm run prisma:migrate
```

Optional: set a custom database path using `DATABASE_URL` (defaults to `file:backend/data/rooms.db`).

## API Endpoints

### GET /api/rooms
Get list of public rooms.

### POST /api/rooms
Create a new room.

**Body:**
```json
{
  "name": "Room Name",
  "isPublic": true,
  "maxPlayers": 6,
  "roundTime": 60
}
```

## Socket.io Events

### Client → Server

- `join-room` - Join a room
- `leave-room` - Leave current room
- `start-game` - Start the game
- `drawing-event` - Send drawing event (drawer only)
- `clear-canvas` - Clear the canvas (drawer only)
- `guess` - Submit a guess
- `chat-message` - Send a chat message

### Server → Client

- `room-state` - Current room state
- `player-joined` - Player joined the room
- `player-left` - Player left the room
- `game-started` - Game has started
- `draw-word` - Word to draw (drawer only)
- `round-started` - New round started
- `round-timer` - Round timer update
- `round-ended` - Round ended
- `correct-guess` - Correct guess made
- `wrong-guess` - Wrong guess made
- `chat-message` - Chat message received
- `drawing-event` - Drawing event received
- `canvas-cleared` - Canvas was cleared
- `game-ended` - Game ended

## Game Flow

1. Players join a room
2. Game starts when host clicks "Start Game"
3. Round begins with a random drawer and word
4. Drawer draws, others guess
5. Round ends when time expires or all players guess correctly
6. Next round starts with a new drawer
7. Game continues until players leave

