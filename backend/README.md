# Paint & Guess Backend

Backend server for the Paint & Guess multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Apply migrations (creates the SQLite database/table if missing):
```bash
npm run prisma:migrate
```

3. Generate the Prisma client (handy after schema edits):
```bash
npm run prisma:generate
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - Prisma database URL (SQLite). If unset, defaults to `file:backend/data/rooms.db`.
- `LOG_LEVEL` - One of `error`, `warn`, `info`, `debug`. Controls console verbosity (default: `info`).
- `PLAYER_STALE_HEARTBEAT_MS` - Milliseconds before a connected player is marked disconnected if no heartbeat is received (default: `45000`).
- `PLAYER_DISCONNECT_GRACE_PERIOD_MS` - Additional grace period for disconnected players before their slot is reclaimed (default: `120000`).
- `ROOM_SWEEP_INTERVAL_MS` - Frequency for background sweeps that persist room state and prune stale players (default: `30000`).

### Redis Configuration (Optional - for horizontal scaling)

Redis is **optional** and only needed for horizontal scaling (multiple server instances). If Redis is not configured, the server runs in single-instance mode.

- `REDIS_ENABLED` - Set to `"true"` to enable Redis (default: `false`). Alternatively, set `REDIS_URL` to enable.
- `REDIS_URL` - Full Redis connection URL (e.g., `redis://localhost:6379` or `redis://:password@host:6379/0`). If set, overrides individual settings below.
- `REDIS_HOST` - Redis host (default: `localhost`)
- `REDIS_PORT` - Redis port (default: `6379`)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: `0`)

**Example configuration:**
```bash
# Option 1: Using REDIS_URL (recommended)
REDIS_URL="redis://localhost:6379"

# Option 2: Using individual settings
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"  # Optional
REDIS_DB="0"
```

**Note:** When Redis is enabled, Socket.io will use the Redis adapter to enable horizontal scaling across multiple server instances. All instances must connect to the same Redis server.

## Prisma setup

This backend uses Prisma + SQLite to persist rooms.

1. Generate Prisma client:
```bash
npm run prisma:generate
```

2. Apply migrations (creates the `Room` table if missing):

**Option A: Create a `.env` file** (recommended)
Create `backend/.env` with:
```
DATABASE_URL="file:./data/rooms.db"
```

Then run:
```bash
npm run prisma:migrate
```

**Option B: Set environment variable inline**

On Windows (PowerShell):
```powershell
$env:DATABASE_URL="file:./data/rooms.db"; npm run prisma:migrate
```

On Linux/Mac:
```bash
DATABASE_URL="file:./data/rooms.db" npm run prisma:migrate
```

**Note:** The server will automatically use `file:./data/rooms.db` if `DATABASE_URL` is not set, but Prisma CLI requires it to be explicitly set for migrations.

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

## Operational Notes

- Clients send heartbeat pings every ~15 seconds. The backend marks players as disconnected if no heartbeat arrives within `PLAYER_STALE_HEARTBEAT_MS`, and removes them entirely after the grace period. This keeps room capacity accurate even when browsers disconnect abruptly.
- A background sweep runs every `ROOM_SWEEP_INTERVAL_MS` to persist rooms to the database, broadcast stale disconnects, and delete empty rooms automatically.
- Inspect or edit the SQLite database with `npm run prisma:studio`.

## Horizontal Scaling with Redis

To run multiple server instances for horizontal scaling:

1. **Set up Redis** (local or cloud):
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Configure environment variables** on all server instances:
   ```bash
   REDIS_ENABLED="true"
   REDIS_HOST="localhost"  # or your Redis host
   REDIS_PORT="6379"
   ```

3. **Start multiple server instances**:
   ```bash
   # Terminal 1
   PORT=3001 npm start
   
   # Terminal 2
   PORT=3002 npm start
   
   # Terminal 3
   PORT=3003 npm start
   ```

4. **Use a load balancer** (nginx, HAProxy, etc.) to distribute traffic across instances.

**Important:** All server instances must:
- Connect to the same Redis server
- Connect to the same database (PostgreSQL recommended for production)
- Have the same environment configuration

The Redis adapter enables Socket.io to broadcast events across all server instances, so players connected to different servers can still communicate in the same rooms.

