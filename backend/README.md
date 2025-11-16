# Paint & Guess Backend

Backend server for the Paint & Guess multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the Prisma migrations (this also creates the local SQLite database):
```bash
npm run db:migrate
```

3. Generate the Prisma client (automatically done on install, but handy after schema edits):
```bash
npm run db:generate
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - Optional Prisma connection string. Defaults to the bundled SQLite file at `file:./data/rooms.db` when omitted.
- `LOG_LEVEL` - One of `error`, `warn`, `info`, `debug` (default: `info`)
- `PLAYER_STALE_HEARTBEAT_MS` - Time before a connected player is marked disconnected if no heartbeat arrives (default: 45000)
- `PLAYER_DISCONNECT_GRACE_PERIOD_MS` - Additional grace period before fully pruning disconnected players from a room (default: 120000)
- `ROOM_SWEEP_INTERVAL_MS` - How often the server sweeps rooms to prune stale sessions (default: 30000)

You can inspect the database locally with:

```bash
npm run db:studio
```

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

## Operational notes

- The server emits and expects heartbeat pings every 15 seconds to keep player `lastSeen` data fresh. Players that stop heartbeating are marked disconnected after `PLAYER_STALE_HEARTBEAT_MS` and are pruned after `PLAYER_DISCONNECT_GRACE_PERIOD_MS`.
- A background sweep runs every `ROOM_SWEEP_INTERVAL_MS` to persist any rooms with changed connectivity state and remove empty rooms automatically.
- For production, point `DATABASE_URL` at a managed Postgres instance and run `npm run db:migrate` before deploying. The defaults remain SQLite for local development convenience.

