import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { WORDS, getWordPacks, getRandomWordFromPack } from "./words.js";
import { PrismaRoomStore } from "./store/prismaRoomStore.js";
import { RoomRepository } from "./store/roomRepository.js";
import { initializeRedis, getRedisSubscriber, getRedisPublisher, isRedisEnabled, shutdownRedis } from "./redisClient.js";
import { getRegistryResponse, loadGameRegistry } from "./gameRegistry.js";
import { TriviaRoomRepository } from "./triviaRoomRepository.js";
import { getSampleQuestions } from "./triviaQuestions.js";
import { canvaRoomRepository } from "./canvaRoomRepository.js";

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configuredLogLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
const ACTIVE_LOG_LEVEL = LOG_LEVELS[configuredLogLevel] ?? LOG_LEVELS.info;

function logAtLevel(level, message, metadata) {
  if ((LOG_LEVELS[level] ?? LOG_LEVELS.info) > ACTIVE_LOG_LEVEL) {
    return;
  }
  const prefix = `[${level.toUpperCase()}]`;
  const payload = metadata ? [message, metadata] : [message];
  switch (level) {
    case "error":
      console.error(prefix, ...payload);
      break;
    case "warn":
      console.warn(prefix, ...payload);
      break;
    case "debug":
      console.debug(prefix, ...payload);
      break;
    default:
      console.log(prefix, ...payload);
      break;
  }
}

const logger = {
  error: (message, metadata) => logAtLevel("error", message, metadata),
  warn: (message, metadata) => logAtLevel("warn", message, metadata),
  info: (message, metadata) => logAtLevel("info", message, metadata),
  debug: (message, metadata) => logAtLevel("debug", message, metadata),
};

function parseEnvNumber(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined) {
    return defaultValue;
  }
  const value = Number(raw);
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  console.warn(`[Config] Invalid ${name}="${raw}", falling back to ${defaultValue}`);
  return defaultValue;
}

const PLAYER_STALE_HEARTBEAT_MS = parseEnvNumber("PLAYER_STALE_HEARTBEAT_MS", 45_000);
const PLAYER_DISCONNECT_GRACE_PERIOD_MS = parseEnvNumber("PLAYER_DISCONNECT_GRACE_PERIOD_MS", 2 * 60 * 1000);
const ROOM_SWEEP_INTERVAL_MS = parseEnvNumber("ROOM_SWEEP_INTERVAL_MS", 30_000);
const CLIENT_HEARTBEAT_EVENT = "heartbeat";
const HEARTBEAT_ACK_EVENT = "heartbeat-ack";

logger.info("[Config] Loaded runtime configuration", {
  logLevel: configuredLogLevel,
  playerStaleHeartbeatMs: PLAYER_STALE_HEARTBEAT_MS,
  playerDisconnectGracePeriodMs: PLAYER_DISCONNECT_GRACE_PERIOD_MS,
  roomSweepIntervalMs: ROOM_SWEEP_INTERVAL_MS,
});

const app = express();
const httpServer = createServer(app);

// Initialize Redis adapter if enabled (with timeout to prevent hanging)
let redisAdapter = null;
const redisInitPromise = initializeRedis().catch((error) => {
  // Error already logged in initializeRedis
  return null;
});

// Wait for Redis init with timeout - don't block startup too long
try {
  const redisConnections = await Promise.race([
    redisInitPromise,
    new Promise((resolve) => setTimeout(() => resolve(null), 2500)), // 2.5 second max wait
  ]);
  
  if (redisConnections) {
    const pubClient = getRedisPublisher();
    const subClient = getRedisSubscriber();
    if (pubClient && subClient) {
      redisAdapter = createAdapter(pubClient, subClient);
      logger.info("[Server] Redis adapter initialized for horizontal scaling");
    }
  }
} catch (error) {
  logger.warn("[Server] Redis initialization failed, continuing without adapter", error);
}

const corsOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8080,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.RENDER_EXTERNAL_URL) {
  corsOrigins.push(process.env.RENDER_EXTERNAL_URL);
}

const normalizedOrigins = Array.from(
  new Set(
    corsOrigins.map((origin) => origin.replace(/\/$/, ""))
  )
);

const corsConfig = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/$/, "");
    if (!origin || normalizedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsConfig,
  adapter: redisAdapter || undefined, // Use Redis adapter if available
  // Optimize for low latency
  pingTimeout: 20000, // Reduce from default 20000ms
  pingInterval: 25000, // Reduce from default 25000ms
  transports: ['websocket', 'polling'], // Prefer WebSocket for lower latency
  // Enable compression for better performance
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3, // Balance between compression and speed
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    threshold: 1024, // Only compress messages larger than 1KB
  },
});

app.use(cors(corsConfig));
app.use(express.json());

app.get("/api/games", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const registry = await loadGameRegistry({ forceRefresh });
    logger.info("[registry] Serving registry", {
      source: registry.source,
      entryCount: registry.entries.length,
      entryIds: registry.entries.map((e) => e.id),
      forceRefresh,
    });
    res.json(registry);
  } catch (error) {
    logger.error("[registry] Failed to serve registry", error);
    res.status(500).json({ status: "error", message: "Unable to load game registry" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
await fs.mkdir(dataDir, { recursive: true });

const roomStore = new PrismaRoomStore();
const roomRepository = new RoomRepository(roomStore);
const triviaRoomRepository = new TriviaRoomRepository();

let roomSweepTimer = null;
let sweepInProgress = false;

try {
  await roomRepository.initialize();
  await sweepRooms("startup");
  scheduleRoomSweeps();
} catch (error) {
  if (
    error.code === "P2021" ||
    error.message?.includes("Database not initialized") ||
    error.message?.includes("file is not a database") ||
    error.message?.includes("does not exist")
  ) {
    console.error(`\n❌ [Startup] Database initialization failed!`);
    console.error(`   Error: ${error.message}`);
    console.error(`\n   The database table doesn't exist. Please run migrations:`);
    console.error(`\n   Option 1: Create .env file (recommended)`);
    console.error(`   Create backend/.env with: DATABASE_URL="file:./data/rooms.db"`);
    console.error(`   Then run: npm run prisma:migrate`);
    console.error(`\n   Option 2: Set environment variable inline`);
    console.error(`   PowerShell: $env:DATABASE_URL="file:./data/rooms.db"; npm run prisma:migrate`);
    console.error(`   Bash: DATABASE_URL="file:./data/rooms.db" npm run prisma:migrate`);
    console.error(`\n   After running the migration, restart the server.\n`);
    process.exit(1);
  }
  throw error;
}

console.log(`[Startup] Store type: PrismaRoomStore`);
process.on("unhandledRejection", (reason) => {
  console.error("[Process] UnhandledRejection:", reason);
});
try {
  const totalRooms = await roomStore.count?.();
  if (typeof totalRooms === "number") {
    console.log(`[Startup] Rooms in database: ${totalRooms}`);
  }
} catch (e) {
  console.warn(`[Startup] Failed to query rooms count`, e);
}

async function persistRoom(room) {
  room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
  room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);

  if (room.players.length === 0) {
    await roomRepository.deleteRoom(room.id);
    return false;
  }

  await roomRepository.saveRoom(room);
  return true;
}

async function sweepRooms(trigger = "interval") {
  if (sweepInProgress) {
    logger.debug(`[Sweeper] Skipping ${trigger} run (already running)`);
    return;
  }

  sweepInProgress = true;
  const startedAt = Date.now();
  const rooms = roomRepository.getRooms();
  let roomsTouched = 0;
  let roomsDeleted = 0;

  logger.debug(`[Sweeper] Starting ${trigger} run`, {
    totalRooms: rooms.length,
    staleThresholdMs: PLAYER_STALE_HEARTBEAT_MS,
    gracePeriodMs: PLAYER_DISCONNECT_GRACE_PERIOD_MS,
  });

  try {
    for (const room of rooms) {
      const roomBefore = {
        totalPlayers: room.players.length,
        activePlayers: room.getActivePlayerCount(),
        gameActive: room.isGameActive,
      };

      logger.debug(`[Sweeper] Checking room ${room.id}`, {
        name: room.name,
        ...roomBefore,
      });

      const stalePlayers = room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
      const pruned = room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);

      const roomAfter = {
        totalPlayers: room.players.length,
        activePlayers: room.getActivePlayerCount(),
      };

      if (!stalePlayers.length && !pruned) {
        logger.debug(`[Sweeper] Room ${room.id} unchanged`, roomAfter);
        continue;
      }

      roomsTouched++;
      logger.info(`[Sweeper] Room ${room.id} updated`, {
        name: room.name,
        before: roomBefore,
        after: roomAfter,
        stalePlayersCount: stalePlayers.length,
        stalePlayerNames: stalePlayers.map((p) => p.name),
        pruned,
      });

      const playersPayload = serializePlayers(room.players);
      for (const player of stalePlayers) {
        logger.debug(`[Sweeper] Broadcasting player-left for stale player`, {
          roomId: room.id,
          playerId: player.id,
          playerName: player.name,
        });
        io.to(room.id).emit("player-left", {
          playerId: player.id,
          players: playersPayload,
          ownerId: room.ownerId,
        });
      }

      const kept = await persistRoom(room);
      if (!kept) {
        roomsDeleted++;
        logger.info(`[Sweeper] Room ${room.id} deleted (empty)`, { name: room.name });
      }
    }

    const duration = Date.now() - startedAt;
    if (roomsTouched > 0) {
      logger.info(`[Sweeper] ${trigger} run updated rooms`, {
        roomsTouched,
        roomsDeleted,
        roomsChecked: rooms.length,
        durationMs: duration,
      });
    } else {
      logger.debug(`[Sweeper] ${trigger} run finished with no changes`, {
        roomsChecked: rooms.length,
        durationMs: duration,
      });
    }
  } catch (error) {
    logger.error(`[Sweeper] ${trigger} run failed`, error);
  } finally {
    sweepInProgress = false;
  }
}

function scheduleRoomSweeps() {
  if (ROOM_SWEEP_INTERVAL_MS <= 0) {
    logger.warn("[Sweeper] Disabled - interval is set to 0", {
      intervalMs: ROOM_SWEEP_INTERVAL_MS,
    });
    return;
  }

  if (roomSweepTimer) {
    logger.warn("[Sweeper] Sweeps already scheduled, skipping");
    return;
  }

  logger.info("[Sweeper] Scheduling background sweeps", {
    intervalMs: ROOM_SWEEP_INTERVAL_MS,
    nextSweepIn: `${ROOM_SWEEP_INTERVAL_MS}ms`,
  });

  roomSweepTimer = setInterval(() => {
    logger.debug("[Sweeper] Interval timer triggered");
    sweepRooms("interval").catch((error) => logger.error("[Sweeper] Interval run crashed", error));
  }, ROOM_SWEEP_INTERVAL_MS);

  logger.info("[Sweeper] Background sweeps scheduled", {
    intervalMs: ROOM_SWEEP_INTERVAL_MS,
  });
}

const MAX_MESSAGE_LENGTH = 200;
const MAX_NAME_LENGTH = 24;
const MAX_AVATAR_LENGTH = 2048;

function sanitizeName(name, fallback) {
  if (typeof name !== "string") {
    return fallback;
  }
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  const cleaned = trimmed.replace(/[^\w\s'-]/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeMessage(message) {
  if (typeof message !== "string") {
    return "";
  }
  return message.trim().slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeAvatar(avatar) {
  if (typeof avatar !== "string") {
    return null;
  }
  if (avatar.length > MAX_AVATAR_LENGTH) {
    return null;
  }
  return avatar;
}

function serializePlayers(players) {
  return players
    .filter((player) => player && player.connected)
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      isReady: player.isReady,
      avatar: player.avatar ?? null,
    }));
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// Get random word from a room's word pack
function getRandomWordForRoom(room) {
  return getRandomWordFromPack(room.wordPack || "classic");
}

// REST API endpoints
app.get("/api/rooms", (req, res) => {
  const publicRooms = roomRepository
    .listPublicRooms()
    .filter((room) => !room.isGameActive)
    .map((room) => ({
      id: room.id,
      name: room.name,
      players: room.getActivePlayerCount(),
      maxPlayers: room.maxPlayers,
      wordPack: room.wordPack,
    }));

  res.json(publicRooms);
});

app.get("/api/games/registry", async (req, res) => {
  const requestStart = Date.now();
  const forceRefresh = req.query.refresh === "true";
  const clientIp = req.ip || req.socket.remoteAddress;
  
  logger.debug("[HTTP] Game registry request", {
    forceRefresh,
    clientIp,
    query: req.query,
  });

  try {
    const registry = await loadGameRegistry({ forceRefresh });
    const duration = Date.now() - requestStart;
    
    logger.info("[HTTP] Game registry served", {
      source: registry.source,
      entryCount: registry.entries?.length ?? 0,
      duration: `${duration}ms`,
      forceRefresh,
    });
    
    res.json(registry);
  } catch (error) {
    const duration = Date.now() - requestStart;
    logger.error("[HTTP] Failed to load game registry", {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      forceRefresh,
    });
    res.status(500).json({ 
      status: "error", 
      message: "Failed to load registry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get available word packs
app.get("/api/word-packs", (req, res) => {
  const packs = getWordPacks().map((pack) => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    icon: pack.icon,
    wordCount: pack.words.length,
  }));
  res.json(packs);
});

app.post("/api/rooms", async (req, res) => {
  try {
    const { name, isPublic = true, maxPlayers = 6, roundTime = 60, maxRounds = 6, wordPack = "classic" } = req.body;
    const roomId = generateRoomId();

    const room = await roomRepository.createRoom({
      id: roomId,
      name: sanitizeName(name, `Room ${roomId}`),
      isPublic,
      maxPlayers,
      roundTime,
      maxRounds,
      wordPack,
    });

    res.json({ roomId, ...room.toJSON() });
  } catch (error) {
    console.error(`[HTTP] Failed to create room`, error);
    res.status(500).json({ message: "Failed to create room", error: String(error?.message || error) });
  }
});

// Health and debug endpoints
app.get("/api/health", async (req, res) => {
  try {
    const dbRooms = await (roomStore.count?.() ?? null);
    const memoryRooms = roomRepository.getRooms().length;
    res.json({
      status: "ok",
      store: "prisma",
      databaseUrl: process.env.DATABASE_URL ?? null,
      redis: {
        enabled: isRedisEnabled(),
        adapter: redisAdapter ? "active" : "none",
      },
      rooms: {
        inMemory: memoryRooms,
        inDatabase: dbRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: String(error?.message || error) });
  }
});

app.get("/api/debug/rooms", async (req, res) => {
  try {
    const list = roomRepository.getRooms().map((r) => ({
      id: r.id,
      name: r.name,
      players: r.players.length,
      isGameActive: r.isGameActive,
      roundNumber: r.roundNumber,
    }));
    const idsInDb = await (roomStore.listIds?.() ?? []);
    res.json({ inMemory: list, inDatabase: idsInDb });
  } catch (error) {
    res.status(500).json({ status: "error", message: String(error?.message || error) });
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, avatar, playerId: reconnectId }) => {
    console.log(`[Server] 🚪 join-room`, {
      roomId,
      playerName,
      socketId: socket.id,
      reconnectId: reconnectId || 'none',
      isReconnect: Boolean(reconnectId),
    });

    const room = roomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Server] ❌ Room ${roomId} not found`);
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const stalePlayers = room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
    const beforePrune = room.players.length;
    room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);
    const afterPrune = room.players.length;
    if (beforePrune !== afterPrune) {
      console.log(`[Server] 🧹 Pruned ${beforePrune - afterPrune} disconnected players from room ${roomId}`);
    }

    if (stalePlayers.length) {
      const playersPayload = serializePlayers(room.players);
      for (const player of stalePlayers) {
        io.to(roomId).emit("player-left", {
          playerId: player.id,
          players: playersPayload,
          ownerId: room.ownerId,
        });
      }
    }

    const existingPlayerId = typeof reconnectId === "string" ? reconnectId : null;
    const existingPlayer = existingPlayerId ? room.getPlayerById(existingPlayerId) : null;

    if (!existingPlayer && room.getActivePlayerCount() >= room.maxPlayers) {
      console.log(`[Server] ❌ Room ${roomId} is full (${room.getActivePlayerCount()}/${room.maxPlayers})`);
      socket.emit("error", { message: "Room is full" });
      return;
    }

    let playerRecord;

    if (existingPlayer) {
      console.log(`[Server] 🔄 Reconnecting player ${existingPlayerId} (${existingPlayer.name})`);
      if (existingPlayer.connected && existingPlayer.socketId && existingPlayer.socketId !== socket.id) {
        console.log(`[Server] 🔌 Disconnecting previous socket ${existingPlayer.socketId} for player ${existingPlayerId}`);
        const previousSocket = io.sockets.sockets.get(existingPlayer.socketId);
        if (previousSocket) {
          previousSocket.data.roomId = null;
          previousSocket.data.playerId = null;
          previousSocket.disconnect(true);
        }
      }

      existingPlayer.name = sanitizeName(playerName, existingPlayer.name);
      existingPlayer.avatar = sanitizeAvatar(avatar);
      existingPlayer.isReady = false;
      existingPlayer.hasGuessed = false;
      playerRecord = existingPlayer;
    } else {
      const activeCount = room.getActivePlayerCount();
      const newPlayer = {
        id: uuidv4(),
        name: sanitizeName(playerName, `Player ${activeCount + 1}`),
        score: 0,
        isReady: false,
        avatar: sanitizeAvatar(avatar),
        hasGuessed: false,
        socketId: socket.id,
      };
      console.log(`[Server] ➕ New player joining: ${newPlayer.id} (${newPlayer.name})`);
      room.addPlayer(newPlayer);
      playerRecord = room.getPlayerById(newPlayer.id);
    }

    room.markPlayerConnected(playerRecord.id, socket.id);
    console.log(`[Server] ✅ Player ${playerRecord.id} connected: ${playerRecord.name}, active: ${room.getActivePlayerCount()}/${room.maxPlayers}`);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerRecord.id;

    // If this was a reconnection of the current drawer during an active round, resend word and ensure timer runs
    if (existingPlayer && room.isGameActive && room.currentDrawer?.id === playerRecord.id) {
      if (room.currentWord && room.currentDrawer?.socketId) {
        io.to(room.currentDrawer.socketId).emit("draw-word", { word: room.currentWord });
        console.log(`[Server] ✉️ draw-word resent to reconnected drawer`, {
          drawerId: room.currentDrawer.id,
          drawerSocket: room.currentDrawer.socketId,
          wordLength: room.currentWord?.length ?? 0,
        });
      }
      if (room.isRoundActive && !room.timer) {
        room.startRoundTimer(async (timeLeft) => {
          io.to(roomId).emit("round-timer", { timeLeft });
          await persistRoom(room);
          if (timeLeft === 0) {
            await endRound(roomId);
          }
        });
      }
    }

    await persistRoom(room);

    socket.emit("session", { playerId: playerRecord.id });

    const publicPlayer =
      serializePlayers([playerRecord])[0] ??
      ({
        id: playerRecord.id,
        name: playerRecord.name,
        score: playerRecord.score,
        isReady: playerRecord.isReady,
        avatar: playerRecord.avatar ?? null,
      });
    io.to(roomId).emit("player-joined", {
      player: publicPlayer,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });

    socket.emit("room-state", room.toJSON());
  });

  socket.on("leave-room", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    room.removePlayer(playerId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;

    const kept = await persistRoom(room);
    if (!kept) {
      return;
    }

    io.to(roomId).emit("player-left", {
      playerId,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });
  });

  socket.on("start-game", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room || room.isGameActive) return;

    if (room.ownerId !== playerId) {
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    try {
      const getWord = () => getRandomWordForRoom(room);
      room.startGame(getWord);
      await persistRoom(room);
    } catch (error) {
      socket.emit("error", { message: error.message });
      return;
    }

    const drawer = serializePlayers([room.currentDrawer])[0] ?? null;
    io.to(roomId).emit("game-started", {
      drawer,
      roundTime: room.roundTime,
      roundNumber: room.roundNumber,
    });

    if (room.currentDrawer?.socketId) {
      io.to(room.currentDrawer.socketId).emit("draw-word", {
        word: room.currentWord,
      });
    }

    room.startRoundTimer(async (timeLeft) => {
      io.to(roomId).emit("round-timer", { timeLeft });
      await persistRoom(room);
      if (timeLeft === 0) {
        await endRound(roomId);
      }
    });
  });

  socket.on("drawing-event", (event) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      // Only log warnings in debug mode to reduce overhead
      if (process.env.LOG_LEVEL === "debug") {
        console.warn(`[Server] ⚠️ drawing-event rejected: missing roomId or playerId`, { roomId, playerId, socketId: socket.id });
      }
      return;
    }

    const room = roomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) {
      if (process.env.LOG_LEVEL === "debug") {
        console.warn(`[Server] ⚠️ drawing-event rejected: room not found or game not active`, { roomId, isGameActive: room?.isGameActive });
      }
      return;
    }

    if (playerId !== room.currentDrawer?.id) {
      if (process.env.LOG_LEVEL === "debug") {
        console.warn(`[Server] ⚠️ drawing-event rejected: player is not current drawer`, { 
          playerId, 
          currentDrawerId: room.currentDrawer?.id,
          socketId: socket.id 
        });
      }
      return;
    }

    // Optimized: Direct broadcast without expensive fetchSockets() call
    // Socket.io's socket.to() is efficient and doesn't require fetching all sockets
    // Only check room membership on first event or if we suspect an issue
    socket.to(roomId).emit("drawing-event", event);
    
    // Debug logging only in debug mode to reduce overhead
    if (process.env.LOG_LEVEL === "debug") {
      const isHost = room.ownerId === playerId;
      console.debug(`[Server] ✏️ drawing-event broadcast`, {
        roomId,
        drawerId: playerId,
        drawerSocketId: socket.id,
        isHost,
        eventType: event?.type,
        pathId: event?.pathId,
      });
    }
  });

  socket.on("clear-canvas", () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) return;

    if (playerId !== room.currentDrawer?.id) return;

    console.debug(`[Server] 🧹 canvas-cleared broadcast`, { roomId, drawerId: playerId });
    io.to(roomId).emit("canvas-cleared");
  });

  socket.on("guess", async ({ guess }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) return;

    if (playerId === room.currentDrawer?.id) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    if (player.hasGuessed) return;

    const sanitizedGuess = sanitizeMessage(guess);
    if (!sanitizedGuess) {
      return;
    }

    const normalizedGuess = sanitizedGuess.toLowerCase();
    const normalizedWord = room.currentWord?.toLowerCase().trim();

    if (!normalizedWord) {
      return;
    }

    if (normalizedGuess === normalizedWord) {
      player.hasGuessed = true;
      const timeRemaining = room.getTimeRemainingSeconds();
      const points = Math.max(50, Math.floor(100 * (timeRemaining / room.roundTime)));
      player.score += points;

      if (room.currentDrawer && room.currentDrawer.connected && !room.drawerRewarded) {
        const drawerPoints = 75;
        room.currentDrawer.score += drawerPoints;
        room.markDrawerRewarded();
      }

      const payload = {
        player: { id: player.id, name: player.name },
        points,
        word: room.currentWord,
        players: serializePlayers(room.players),
      };

      io.to(roomId).emit("correct-guess", payload);

      const allGuessed = room
        .getActivePlayers()
        .filter((p) => p.id !== room.currentDrawer?.id)
        .every((p) => p.hasGuessed);

      if (allGuessed) {
        await endRound(roomId);
        return;
      }

      await persistRoom(room);
    } else {
      io.to(roomId).emit("wrong-guess", {
        player: { id: player.id, name: player.name },
        guess: sanitizedGuess,
      });
    }
  });

  socket.on("chat-message", ({ message }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    const filteredMessage = sanitizeMessage(message);
    if (filteredMessage.length === 0) return;

    io.to(roomId).emit("chat-message", {
      player: { id: player.id, name: player.name },
      message: filteredMessage,
      timestamp: Date.now(),
    });
  });

  socket.on("set-ready", async ({ isReady }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room || room.isGameActive) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    const ready = Boolean(isReady);
    room.setPlayerReady(playerId, ready);

    await persistRoom(room);

    io.to(roomId).emit("player-ready", {
      playerId,
      isReady: ready,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });
  });

  socket.on("update-avatar", async ({ avatar }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    player.avatar = sanitizeAvatar(avatar);
    await persistRoom(room);

    console.log(`[Server] 🎨 Player avatar updated: ${playerId} (${player.name})`);

    io.to(roomId).emit("player-avatar-updated", {
      playerId,
      avatar: player.avatar,
      players: serializePlayers(room.players),
    });
  });

  socket.on(CLIENT_HEARTBEAT_EVENT, async () => {
    const heartbeatReceivedAt = Date.now();
    socket.data.lastHeartbeatAt = heartbeatReceivedAt;
    const { roomId, playerId } = socket.data;

    logger.debug(`[Heartbeat] Received heartbeat`, {
      socketId: socket.id,
      roomId: roomId || "none",
      playerId: playerId || "none",
      timestamp: heartbeatReceivedAt,
    });

    if (!roomId || !playerId) {
      logger.debug(`[Heartbeat] Socket not in a room`, { socketId: socket.id });
      socket.emit(HEARTBEAT_ACK_EVENT, { serverTime: heartbeatReceivedAt, status: "idle" });
      return;
    }

    const room = roomRepository.getRoom(roomId);
    if (!room) {
      logger.warn(`[Heartbeat] Room not found`, { socketId: socket.id, roomId, playerId });
      socket.emit(HEARTBEAT_ACK_EVENT, { serverTime: heartbeatReceivedAt, status: "room-missing" });
      return;
    }

    const player = room.getPlayerById(playerId);
    if (!player) {
      logger.warn(`[Heartbeat] Player not found in room`, {
        socketId: socket.id,
        roomId,
        playerId,
      });
      socket.emit(HEARTBEAT_ACK_EVENT, { serverTime: heartbeatReceivedAt, status: "player-missing" });
      return;
    }

    const wasConnected = player.connected;
    const previousLastSeen = player.lastSeen ?? 0;
    const timeSinceLastSeen = previousLastSeen > 0 ? heartbeatReceivedAt - previousLastSeen : null;

    logger.debug(`[Heartbeat] Processing heartbeat for player`, {
      roomId,
      playerId,
      playerName: player.name,
      wasConnected,
      previousLastSeen: previousLastSeen || "never",
      timeSinceLastSeen: timeSinceLastSeen ? `${timeSinceLastSeen}ms` : "N/A",
    });

    room.markPlayerHeartbeat(playerId);

    if (!wasConnected && player.connected) {
      logger.info(`[Heartbeat] Player revived via heartbeat`, {
        roomId,
        playerId,
        playerName: player.name,
        timeSinceLastSeen: timeSinceLastSeen ? `${timeSinceLastSeen}ms` : "N/A",
      });
      const revivedPlayer = serializePlayers([player])[0] ?? null;
      await persistRoom(room);
      io.to(roomId).emit("player-joined", {
        player: revivedPlayer,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });
    }

    socket.emit(HEARTBEAT_ACK_EVENT, { serverTime: heartbeatReceivedAt, roomId, playerId });
  });

  socket.on("disconnect", async () => {
    const { roomId, playerId, isTrivia, isCanva } = socket.data;
    if (!roomId || !playerId) {
      console.log(`[Server] 🔌 Client disconnected: ${socket.id} (not in a room)`);
      return;
    }

    // Handle trivia room disconnects
    if (isTrivia) {
      const room = triviaRoomRepository.getRoom(roomId);
      if (!room) return;

      room.markPlayerDisconnected(playerId);
      socket.leave(roomId);
      socket.data.roomId = null;
      socket.data.playerId = null;

      if (room.players.length === 0) {
        triviaRoomRepository.deleteRoom(roomId);
      } else {
        io.to(roomId).emit("trivia:player-left", {
          playerId,
          players: room.toJSON().players,
        });
      }
      return;
    }

    // Handle canva room disconnects
    if (isCanva) {
      const room = canvaRoomRepository.getRoom(roomId);
      if (!room) return;

      room.markPlayerDisconnected(playerId);
      socket.leave(roomId);
      socket.data.roomId = null;
      socket.data.playerId = null;

      if (room.players.length === 0) {
        canvaRoomRepository.deleteRoom(roomId);
      } else {
        io.to(roomId).emit("canva:player-left", {
          playerId,
          players: room.toJSON().players,
        });
      }
      return;
    }

    // Handle paint-and-guess room disconnects
    const room = roomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Server] 🔌 Client disconnected: ${socket.id}, room ${roomId} not found`);
      return;
    }

    const player = room.getPlayerById(playerId);
    const wasDrawer = room.currentDrawer?.id === playerId;
    const activeBefore = room.getActivePlayerCount();

    console.log(`[Server] 🔌 Player disconnecting: ${playerId} (${player?.name || 'unknown'}), wasDrawer: ${wasDrawer}, activeBefore: ${activeBefore}`);

    room.markPlayerDisconnected(playerId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;

    const activeAfter = room.getActivePlayerCount();
    console.log(`[Server] 📊 Room ${roomId} state: ${activeAfter}/${room.players.length} active (was ${activeBefore}), gameActive: ${room.isGameActive}`);

    const kept = await persistRoom(room);

    if (kept) {
      io.to(roomId).emit("player-left", {
        playerId,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });

      if (room.isGameActive && wasDrawer) {
        console.log(`[Server] ⚠️ Drawer disconnected during active game, ending round`);
        await endRound(roomId);
      }
    } else {
      console.log(`[Server] 🗑️ Room ${roomId} deleted (no players left)`);
    }

    console.log(`[Server] ✅ Disconnect handled for ${socket.id}`);
  });

  // Trivia Blitz socket handlers
  socket.on("trivia:create-room", async ({ roomName, playerName, avatar, quizId }) => {
    const roomId = generateRoomId();
    // For now, quizId is accepted but not used - all rooms use sample questions
    // Future: Load questions based on quizId
    const questions = getSampleQuestions();
    
    const room = triviaRoomRepository.createRoom({
      id: roomId,
      name: sanitizeName(roomName, `Room ${roomId}`),
      isPublic: true,
      maxPlayers: 12,
      questions,
      ownerId: null,
    });

    const player = {
      id: uuidv4(),
      name: sanitizeName(playerName, "Host"),
      avatar: sanitizeAvatar(avatar),
      socketId: socket.id,
    };

    room.addPlayer(player);
    room.ownerId = player.id;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;
    socket.data.isTrivia = true;

    socket.emit("session", { playerId: player.id });

    socket.emit("trivia:room-created", {
      roomId,
      gamePin: room.gamePin,
      room: room.toJSON(),
    });

    socket.emit("trivia:room-state", room.toJSON());
  });

  socket.on("trivia:join-room", async ({ gamePin, playerName, avatar }) => {
    const room = triviaRoomRepository.getRoomByPin(gamePin);
    if (!room) {
      socket.emit("error", { message: "Invalid game PIN" });
      return;
    }

    if (room.getActivePlayerCount() >= room.maxPlayers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    const player = {
      id: uuidv4(),
      name: sanitizeName(playerName, `Player ${room.getActivePlayerCount() + 1}`),
      avatar: sanitizeAvatar(avatar),
      socketId: socket.id,
    };

    room.addPlayer(player);

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = player.id;
    socket.data.isTrivia = true;

    socket.emit("session", { playerId: player.id });

    socket.emit("trivia:joined", {
      roomId: room.id,
      room: room.toJSON(),
    });

    io.to(room.id).emit("trivia:player-joined", {
      player: { id: player.id, name: player.name, avatar: player.avatar },
      players: room.toJSON().players,
    });

    socket.emit("trivia:room-state", room.toJSON());
  });

  // Helper function to transition from question phase to answer-reveal and subsequent phases
  function transitionToAnswerReveal(roomId) {
    const room = triviaRoomRepository.getRoom(roomId);
    if (!room || room.phase !== "question") {
      console.log(`[Trivia] ⚠️ transitionToAnswerReveal: Room ${roomId} not in question phase (current: ${room?.phase})`);
      return;
    }

    // Clear the timer since we're transitioning early or it expired
    room.clearQuestionTimer();

    // Get fresh question reference
    const currentQuestion = room.getCurrentQuestion();
    if (!currentQuestion) {
      console.log(`[Trivia] ❌ transitionToAnswerReveal: No question found at index ${room.currentQuestionIndex}`);
      return;
    }

    console.log(`[Trivia] ⏰ Transitioning to answer-reveal for question ${room.currentQuestionIndex + 1}`);

    room.phase = "answer-reveal";
    io.to(roomId).emit("trivia:phase-changed", {
      phase: room.phase,
      questionIndex: room.currentQuestionIndex,
    });

    io.to(roomId).emit("trivia:answer-reveal", {
      correctOptionId: currentQuestion.correctOptionId,
      answerStats: room.answerStats,
    });

    console.log(`[Trivia] ✅ Answer reveal for question ${room.currentQuestionIndex + 1}, stats:`, room.answerStats);

    setTimeout(() => {
      const scoringRoom = triviaRoomRepository.getRoom(roomId);
      if (!scoringRoom) return;

      scoringRoom.phase = "scoring";
      io.to(roomId).emit("trivia:phase-changed", {
        phase: scoringRoom.phase,
        questionIndex: scoringRoom.currentQuestionIndex,
      });

      io.to(roomId).emit("trivia:scoring", {
        players: scoringRoom.toJSON().players,
      });

      console.log(`[Trivia] 💰 Scoring phase for question ${scoringRoom.currentQuestionIndex + 1}`);

      setTimeout(() => {
        const leaderboardRoom = triviaRoomRepository.getRoom(roomId);
        if (!leaderboardRoom) return;

        const leaderboard = leaderboardRoom.getLeaderboard();
        leaderboardRoom.phase = "leaderboard";
        io.to(roomId).emit("trivia:phase-changed", {
          phase: leaderboardRoom.phase,
          questionIndex: leaderboardRoom.currentQuestionIndex,
        });

        io.to(roomId).emit("trivia:leaderboard", {
          leaderboard,
        });

        console.log(`[Trivia] 🏆 Leaderboard phase for question ${leaderboardRoom.currentQuestionIndex + 1}`);

        setTimeout(() => {
          const nextRoom = triviaRoomRepository.getRoom(roomId);
          if (!nextRoom) return;

          const hasMore = nextRoom.nextQuestion();
          console.log(`[Trivia] 🔄 nextQuestion() called: hasMore=${hasMore}, newPhase=${nextRoom.phase}, newIndex=${nextRoom.currentQuestionIndex}`);

          if (!hasMore) {
            // Game ended - show podium
            const podium = nextRoom.getPodium();
            console.log(`[Trivia] 🎉 Game ended! Showing podium`);
            io.to(roomId).emit("trivia:phase-changed", {
              phase: nextRoom.phase,
            });
            io.to(roomId).emit("trivia:podium", {
              podium,
              finalScores: nextRoom.toJSON().players,
            });
          } else {
            // Next question - automatically start it
            if (!nextRoom.isGameActive) {
              console.log(`[Trivia] ⚠️ Game no longer active, skipping next question`);
              return;
            }
            console.log(`[Trivia] ➡️ Starting next question (${nextRoom.currentQuestionIndex + 1}/${nextRoom.questions.length})`);
            io.to(roomId).emit("trivia:phase-changed", {
              phase: nextRoom.phase,
              questionIndex: nextRoom.currentQuestionIndex,
            });
            // Automatically start the next question
            startQuestion(roomId);
          }
        }, 3000);
      }, 2000);
    }, 3000);
  }

  // Helper function to start a question (used for first question and subsequent questions)
  function startQuestion(roomId) {
    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Trivia] ❌ startQuestion: Room ${roomId} not found`);
      return;
    }

    if (!room.isGameActive) {
      console.log(`[Trivia] ⚠️ startQuestion: Game not active in room ${roomId}`);
      return;
    }

    if (room.phase !== "question-intro") {
      console.log(`[Trivia] ⚠️ startQuestion: Room ${roomId} not in question-intro phase (current: ${room.phase})`);
      return;
    }

    console.log(`[Trivia] 🎯 Starting question ${room.currentQuestionIndex + 1}/${room.questions.length} in room ${roomId}`);

    // Transition from question-intro to question phase
    setTimeout(() => {
      const currentRoom = triviaRoomRepository.getRoom(roomId);
      if (!currentRoom) {
        console.log(`[Trivia] ❌ startQuestion timeout: Room ${roomId} not found`);
        return;
      }

      currentRoom.phase = "question";
      currentRoom.questionStartTime = Date.now();
      const question = currentRoom.getCurrentQuestion();

      if (!question) {
        console.log(`[Trivia] ❌ startQuestion: No question found at index ${currentRoom.currentQuestionIndex}`);
        return;
      }

      console.log(`[Trivia] 📝 Emitting question ${currentRoom.currentQuestionIndex + 1}: "${question.text}"`);

      io.to(roomId).emit("trivia:phase-changed", {
        phase: currentRoom.phase,
        questionIndex: currentRoom.currentQuestionIndex,
      });

      io.to(roomId).emit("trivia:question", {
        question,
        questionIndex: currentRoom.currentQuestionIndex,
        totalQuestions: currentRoom.questions.length,
      });

      // Clear any existing timer before setting a new one
      currentRoom.clearQuestionTimer();

      // End question after time limit
      currentRoom.questionTimer = setTimeout(() => {
        const timerRoom = triviaRoomRepository.getRoom(roomId);
        if (!timerRoom || timerRoom.phase !== "question") {
          console.log(`[Trivia] ⚠️ Question timer expired but room phase is ${timerRoom?.phase}, skipping`);
          return;
        }

        console.log(`[Trivia] ⏰ Question ${timerRoom.currentQuestionIndex + 1} time limit reached`);
        transitionToAnswerReveal(roomId);
      }, question.timeLimit * 1000);
    }, 2000);
  }

  socket.on("trivia:start-game", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      console.log(`[Trivia] ❌ start-game: Missing roomId or playerId`);
      return;
    }

    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Trivia] ❌ start-game: Room ${roomId} not found`);
      return;
    }

    if (room.isGameActive) {
      console.log(`[Trivia] ⚠️ start-game: Room ${roomId} already active`);
      return;
    }

    if (room.ownerId !== playerId) {
      console.log(`[Trivia] ❌ start-game: Player ${playerId} is not owner (${room.ownerId})`);
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    try {
      room.startGame();
      console.log(`[Trivia] 🎮 Game started in room ${roomId}, phase: ${room.phase}, questionIndex: ${room.currentQuestionIndex}`);
    } catch (error) {
      console.log(`[Trivia] ❌ start-game error:`, error.message);
      socket.emit("error", { message: error.message });
      return;
    }

    io.to(roomId).emit("trivia:phase-changed", {
      phase: room.phase,
      questionIndex: room.currentQuestionIndex,
    });

    // Start first question
    startQuestion(roomId);
  });

  socket.on("trivia:submit-answer", async ({ optionId }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      console.log(`[Trivia] ❌ submit-answer: Missing roomId or playerId`);
      return;
    }

    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Trivia] ❌ submit-answer: Room ${roomId} not found`);
      return;
    }

    if (room.phase !== "question") {
      console.log(`[Trivia] ⚠️ submit-answer: Room ${roomId} not in question phase (current: ${room.phase})`);
      return;
    }

    const timeElapsed = Date.now() - (room.questionStartTime || Date.now());
    const result = room.submitAnswer(playerId, optionId, timeElapsed);

    if (result.error) {
      console.log(`[Trivia] ❌ submit-answer error: ${result.error}`);
      socket.emit("error", { message: result.error });
      return;
    }

    const player = room.getPlayerById(playerId);
    console.log(`[Trivia] ✅ Player ${player?.name} (${playerId}) answered: ${result.isCorrect ? "CORRECT" : "WRONG"}, +${result.points} points, new score: ${result.newScore}`);

    socket.emit("trivia:answer-result", {
      isCorrect: result.isCorrect,
      points: result.points,
      newScore: result.newScore,
      newStreak: result.newStreak,
    });

    // Check if all non-host players have answered - if so, end question early
    if (room.allPlayersAnswered()) {
      console.log(`[Trivia] 🎯 All non-host players answered question ${room.currentQuestionIndex + 1}, ending question early`);
      io.to(roomId).emit("trivia:all-answered");
      // Transition to answer-reveal phase immediately
      transitionToAnswerReveal(roomId);
    }
  });

  socket.on("trivia:next-question", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) return;

    if (room.ownerId !== playerId) {
      socket.emit("error", { message: "Only the host can advance" });
      return;
    }

    const hasMore = room.nextQuestion();
    if (!hasMore) {
      const podium = room.getPodium();
      io.to(roomId).emit("trivia:phase-changed", {
        phase: room.phase,
      });
      io.to(roomId).emit("trivia:podium", {
        podium,
        finalScores: room.toJSON().players,
      });
    } else {
      io.to(roomId).emit("trivia:phase-changed", {
        phase: room.phase,
        questionIndex: room.currentQuestionIndex,
      });
    }
  });

  // Canva socket handlers
  socket.on("canva:create-room", async ({ roomName, playerName, avatar }) => {
    // Create room first - it will generate its own ID
    const room = canvaRoomRepository.createRoom({
      name: sanitizeName(roomName, "Canva Room"),
      isPublic: true,
      maxPlayers: 10,
    });
    const roomId = room.id; // Use the room's actual ID
    console.log("[Server] canva:create-room: Room created", { roomId, gamePin: room.gamePin });

    const player = {
      id: uuidv4(),
      name: sanitizeName(playerName, "Host"),
      avatar: sanitizeAvatar(avatar),
      socketId: socket.id,
    };

    room.addPlayer(player);
    room.ownerId = player.id;

    // CRITICAL: Join the room using the room's actual ID
    socket.join(room.id);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;
    socket.data.isCanva = true;

    // Verify socket is in room
    const socketRooms = Array.from(socket.rooms);
    console.log("[Server] canva:create-room: Socket joined room", {
      roomId,
      socketId: socket.id,
      playerId: player.id,
      socketRooms,
      isInRoom: socketRooms.includes(roomId),
    });

    socket.emit("session", { playerId: player.id });

    socket.emit("canva:room-created", {
      roomId: room.id, // Use room's actual ID
      gamePin: room.gamePin,
      room: room.toJSON(),
    });

    socket.emit("canva:room-state", room.toJSON());
  });

  socket.on("canva:join-room", async ({ gamePin, playerName, avatar }) => {
    console.log("[Server] canva:join-room: Attempting to join", { gamePin, playerName });
    
    // List all rooms and their PINs for debugging
    const allRooms = canvaRoomRepository.getRooms();
    console.log("[Server] canva:join-room: Available rooms", {
      totalRooms: allRooms.length,
      rooms: allRooms.map(r => ({ id: r.id, pin: r.gamePin, players: r.players.length })),
    });
    
    const room = canvaRoomRepository.getRoomByPin(gamePin);
    if (!room) {
      console.error("[Server] canva:join-room: Room not found for PIN", gamePin);
      socket.emit("error", { message: "Invalid game PIN" });
      return;
    }
    
    console.log("[Server] canva:join-room: Found room", { roomId: room.id, pin: room.gamePin });

    if (room.getActivePlayerCount() >= room.maxPlayers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    const player = {
      id: uuidv4(),
      name: sanitizeName(playerName, "Player"),
      avatar: sanitizeAvatar(avatar),
      socketId: socket.id,
    };

    room.addPlayer(player);

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = player.id;
    socket.data.isCanva = true;

    // Verify socket is in room
    const socketRooms = Array.from(socket.rooms);
    console.log("[Server] canva:join-room: Socket joined room", {
      roomId: room.id,
      socketId: socket.id,
      playerId: player.id,
      socketRooms,
      isInRoom: socketRooms.includes(room.id),
    });

    socket.emit("session", { playerId: player.id });
    socket.emit("canva:joined", {
      roomId: room.id,
      playerId: player.id,
    });
    socket.emit("canva:room-state", room.toJSON());

    // Notify other players
    socket.to(room.id).emit("canva:player-joined", {
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        connected: true,
      },
      players: room.toJSON().players,
    });

    // TEST: Send a test event to verify connection works
    setTimeout(() => {
      console.log("[Server] TEST: Sending test event to room", room.id);
      io.to(room.id).emit("canva:test-event", { message: "TEST - Can you hear me?", timestamp: Date.now() });
    }, 1000);
  });

  socket.on("canva:drawing-event", (event) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      console.log("[Server] canva:drawing-event: Missing roomId or playerId", { roomId, playerId });
      return;
    }
    
    const room = canvaRoomRepository.getRoom(roomId);
    if (!room) {
      console.log("[Server] canva:drawing-event: Room not found", roomId);
      return;
    }

    // If game is active, only allow drawer to draw
    if (room.isGameActive && room.isRoundActive && playerId !== room.currentDrawer?.id) {
      return;
    }

    // Ensure socket is in room
    if (!socket.rooms.has(roomId)) {
      console.log("[Server] canva:drawing-event: Socket not in room, joining", { roomId, socketId: socket.id });
      socket.join(roomId);
    }

    // Get all sockets in room to verify
    io.in(roomId).fetchSockets().then((sockets) => {
      const otherSockets = sockets.filter(s => s.id !== socket.id);
      console.log("[Server] canva:drawing-event: Room sockets", {
        roomId,
        totalSockets: sockets.length,
        otherSockets: otherSockets.length,
        senderSocketId: socket.id,
        otherSocketIds: otherSockets.map(s => s.id),
      });

      // Broadcast to all OTHER sockets in room (excludes sender)
      if (otherSockets.length > 0) {
        socket.broadcast.to(roomId).emit("canva:drawing-event", event);
        console.log("[Server] canva:drawing-event: Broadcast sent to", otherSockets.length, "sockets");
      } else {
        console.warn("[Server] canva:drawing-event: No other sockets in room to receive!");
      }
    }).catch((err) => {
      console.error("[Server] canva:drawing-event: Error fetching sockets", err);
      // Fallback: try broadcast anyway
      socket.broadcast.to(roomId).emit("canva:drawing-event", event);
    });
  });

  // Canva game flow handlers
  socket.on("canva:set-ready", async ({ isReady }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || room.isGameActive) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    room.setPlayerReady(playerId, isReady);
    io.to(roomId).emit("canva:player-ready", {
      playerId,
      isReady,
      allReady: room.allPlayersReady(),
      players: room.toJSON().players,
    });
  });

  socket.on("canva:start-game", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || room.isGameActive) return;

    if (room.ownerId !== playerId) {
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    try {
      const getWord = () => getRandomWordFromPack(room.wordPack || "classic");
      room.startGame(getWord);
    } catch (error) {
      socket.emit("error", { message: error.message });
      return;
    }

    const drawer = room.currentDrawer ? {
      id: room.currentDrawer.id,
      name: room.currentDrawer.name,
    } : null;

    io.to(roomId).emit("canva:game-started", {
      drawer,
      roundTime: room.roundTime,
      roundNumber: room.roundNumber,
    });

    // Also emit round-started for the first round
    io.to(roomId).emit("canva:round-started", {
      drawer,
      roundTime: room.roundTime,
      roundNumber: room.roundNumber,
    });

    if (room.currentDrawer?.socketId) {
      io.to(room.currentDrawer.socketId).emit("canva:draw-word", {
        word: room.currentWord,
      });
    }

    room.startRoundTimer(async (timeLeft) => {
      io.to(roomId).emit("canva:round-timer", { timeLeft });
      if (timeLeft === 0) {
        await endCanvaRound(roomId);
      }
    });
  });

  socket.on("canva:guess", async ({ guess }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || !room.isGameActive || !room.isRoundActive) return;

    if (playerId === room.currentDrawer?.id) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    if (player.hasGuessed) return;

    const sanitizedGuess = sanitizeMessage(guess);
    if (!sanitizedGuess) return;

    const normalizedGuess = sanitizedGuess.toLowerCase();
    const normalizedWord = room.currentWord?.toLowerCase().trim();

    if (!normalizedWord) return;

    if (normalizedGuess === normalizedWord) {
      const result = room.makeGuess(playerId, sanitizedGuess, true);
      if (result && result.correct) {
        io.to(roomId).emit("canva:correct-guess", {
          player: { id: player.id, name: player.name },
          points: result.points,
          word: room.currentWord,
          players: room.toJSON().players,
        });

        const allGuessed = room
          .getActivePlayers()
          .filter((p) => p.id !== room.currentDrawer?.id)
          .every((p) => p.hasGuessed);

        if (allGuessed) {
          await endCanvaRound(roomId);
          return;
        }
      }
    } else {
      io.to(roomId).emit("canva:wrong-guess", {
        player: { id: player.id, name: player.name },
        guess: sanitizedGuess,
      });
    }
  });

  socket.on("canva:chat-message", ({ message }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayerById(playerId);
    if (!player || !player.connected) return;

    const filteredMessage = sanitizeMessage(message);
    if (filteredMessage.length === 0) return;

    io.to(roomId).emit("canva:chat-message", {
      player: { id: player.id, name: player.name },
      message: filteredMessage,
      timestamp: Date.now(),
    });
  });

  socket.on("canva:clear-canvas", () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || !room.isGameActive || !room.isRoundActive) return;

    if (playerId !== room.currentDrawer?.id) return;

    io.to(roomId).emit("canva:canvas-cleared");
  });

  async function endCanvaRound(roomId) {
    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) {
      console.log(`[Canva] endCanvaRound: Room ${roomId} not found or game not active`);
      return;
    }

    // Save the previous word before ending the round
    const previousWord = room.currentWord;
    const previousRoundNumber = room.roundNumber;
    console.log(`[Canva] Ending round ${previousRoundNumber} in room ${roomId}, word was: ${previousWord}`);

    room.endRound();

    const shouldEnd = room.shouldEndGame();
    console.log(`[Canva] Round ${previousRoundNumber} ended, shouldEnd: ${shouldEnd}, roundNumber: ${room.roundNumber}, maxRounds: ${room.maxRounds}, activePlayers: ${room.getActivePlayerCount()}`);
    
    if (shouldEnd) {
      console.log(`[Canva] Game ending in room ${roomId}`);
      room.isGameActive = false;
      io.to(roomId).emit("canva:game-ended", {
        players: room.toJSON().players,
      });
    } else {
      // Emit round-ended with the previous word
      io.to(roomId).emit("canva:round-ended", {
        word: previousWord,
        roundNumber: previousRoundNumber,
      });

      // Wait 3 seconds before starting next round (like paint & guess mode)
      setTimeout(async () => {
        const nextRoom = canvaRoomRepository.getRoom(roomId);
        if (!nextRoom || !nextRoom.isGameActive) {
          console.log(`[Canva] Room ${roomId} no longer active when starting next round`);
          return;
        }

        const getWord = () => getRandomWordFromPack(nextRoom.wordPack || "classic");
        try {
          console.log(`[Canva] Starting round ${nextRoom.roundNumber + 1} in room ${roomId}`);
          nextRoom.nextRound(getWord);
          console.log(`[Canva] Round ${nextRoom.roundNumber} started in room ${roomId}, drawer: ${nextRoom.currentDrawer?.name}`);

          // Verify drawer is still valid
          if (!nextRoom.currentDrawer || !nextRoom.currentDrawer.connected || !nextRoom.currentDrawer.socketId) {
            const activePlayers = nextRoom.getActivePlayers();
            if (activePlayers.length < 2) {
              console.log(`[Server] ⚠️ Not enough active players for next round in canva room ${roomId}, ending game`);
              nextRoom.isGameActive = false;
              io.to(roomId).emit("canva:game-ended", {
                players: nextRoom.toJSON().players,
              });
              return;
            }
            
            // Select a new drawer from active players
            console.log(`[Server] ⚠️ Drawer invalid after nextRound in canva room ${roomId}, selecting new drawer`);
            nextRoom.currentDrawer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            
            // Double-check the new drawer has socketId
            if (!nextRoom.currentDrawer?.socketId) {
              console.error(`[Server] ❌ Selected drawer ${nextRoom.currentDrawer?.id} has no socketId in canva room ${roomId}`);
              await endCanvaRound(roomId);
              return;
            }
          }

          const drawer = nextRoom.currentDrawer ? {
            id: nextRoom.currentDrawer.id,
            name: nextRoom.currentDrawer.name,
          } : null;

          if (!drawer) {
            console.error(`[Server] ❌ Failed to serialize drawer in canva room ${roomId}`);
            await endCanvaRound(roomId);
            return;
          }

          // Emit round-started with the new round info
          io.to(roomId).emit("canva:round-started", {
            drawer,
            roundTime: nextRoom.roundTime,
            roundNumber: nextRoom.roundNumber,
          });

          // Send word to drawer
          if (nextRoom.currentDrawer?.socketId) {
            io.to(nextRoom.currentDrawer.socketId).emit("canva:draw-word", {
              word: nextRoom.currentWord,
            });
          }

          // Start the timer for the new round
          nextRoom.startRoundTimer(async (timeLeft) => {
            io.to(roomId).emit("canva:round-timer", { timeLeft });
            if (timeLeft === 0) {
              await endCanvaRound(roomId);
            }
          });
        } catch (error) {
          console.error("[Server] Error starting next canva round:", error);
          const errorRoom = canvaRoomRepository.getRoom(roomId);
          if (errorRoom) {
            errorRoom.isGameActive = false;
            io.to(roomId).emit("canva:game-ended", {
              players: errorRoom.toJSON().players,
            });
          }
        }
      }, 3000); // 3 second delay between rounds
    }
  }

  socket.on("disconnect", async () => {
    const { roomId, playerId, isTrivia, isCanva } = socket.data;
    if (!roomId || !playerId) {
      console.log(`[Server] 🔌 Client disconnected: ${socket.id} (not in a room)`);
      return;
    }

    if (isTrivia) {
      const room = triviaRoomRepository.getRoom(roomId);
      if (!room) return;

      room.markPlayerDisconnected(playerId);
      socket.leave(roomId);
      socket.data.roomId = null;
      socket.data.playerId = null;

      if (room.players.length === 0) {
        triviaRoomRepository.deleteRoom(roomId);
      } else {
        io.to(roomId).emit("trivia:player-left", {
          playerId,
          players: room.toJSON().players,
        });
      }
      return;
    }

    // Handle paint-and-guess room disconnects
    const room = roomRepository.getRoom(roomId);
    if (!room) {
      console.log(`[Server] 🔌 Client disconnected: ${socket.id}, room ${roomId} not found`);
      return;
    }

    const player = room.getPlayerById(playerId);
    const wasDrawer = room.currentDrawer?.id === playerId;
    const activeBefore = room.getActivePlayerCount();

    console.log(`[Server] 🔌 Player disconnecting: ${playerId} (${player?.name || 'unknown'}), wasDrawer: ${wasDrawer}, activeBefore: ${activeBefore}`);

    room.markPlayerDisconnected(playerId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;

    const activeAfter = room.getActivePlayerCount();
    console.log(`[Server] 📊 Room ${roomId} state: ${activeAfter}/${room.players.length} active (was ${activeBefore}), gameActive: ${room.isGameActive}`);

    const kept = await persistRoom(room);

    if (kept) {
      io.to(roomId).emit("player-left", {
        playerId,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });

      if (room.isGameActive && wasDrawer) {
        console.log(`[Server] ⚠️ Drawer disconnected during active game, ending round`);
        await endRound(roomId);
      }
    } else {
      console.log(`[Server] 🗑️ Room ${roomId} deleted (no players left)`);
    }

    console.log(`[Server] ✅ Disconnect handled for ${socket.id}`);
  });

  async function endRound(roomId) {
    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    if (!room.isGameActive || !room.isRoundActive) {
      return;
    }

    room.endRound();
    const revealedWord = room.currentWord;
    room.currentWord = null;

    const keptAfterEnd = await persistRoom(room);

    if (!keptAfterEnd) {
      return;
    }

    io.to(roomId).emit("round-ended", {
      word: revealedWord,
      scores: serializePlayers(room.players),
      roundNumber: room.roundNumber,
    });

    if (room.shouldEndGame()) {
      room.isGameActive = false;
      room.currentDrawer = null;
      const keptAfterFinish = await persistRoom(room);
      if (!keptAfterFinish) {
        return;
      }
      io.to(roomId).emit("game-ended", {
        reason: room.getActivePlayerCount() < 2 ? "not enough players" : "maximum rounds reached",
        scores: serializePlayers(room.players),
      });
      return;
    }

    setTimeout(async () => {
      try {
        const getWord = () => getRandomWordForRoom(room);
        room.nextRound(getWord);
        const keptDuringSetup = await persistRoom(room);
        if (!keptDuringSetup) {
          return;
        }

        // Verify drawer is still valid after persistRoom (which may have marked players as disconnected)
        // If drawer is invalid, try to select a new one
        if (!room.currentDrawer || !room.currentDrawer.connected || !room.currentDrawer.socketId) {
          const activePlayers = room.getActivePlayers();
          if (activePlayers.length < 2) {
            console.log(`[Server] ⚠️ Not enough active players for next round in room ${roomId}, ending game`);
            room.isGameActive = false;
            room.currentDrawer = null;
            const keptAfterEnd = await persistRoom(room);
            if (!keptAfterEnd) {
              return;
            }
            io.to(roomId).emit("game-ended", {
              reason: "not enough players",
              scores: serializePlayers(room.players),
            });
            return;
          }
          
          // Select a new drawer from active players
          console.log(`[Server] ⚠️ Drawer invalid after persistRoom in room ${roomId}, selecting new drawer`);
          room.currentDrawer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
          
          // Double-check the new drawer has socketId
          if (!room.currentDrawer?.socketId) {
            console.error(`[Server] ❌ Selected drawer ${room.currentDrawer?.id} has no socketId in room ${roomId}`);
            await endRound(roomId);
            return;
          }
        }

        const drawer = serializePlayers([room.currentDrawer])[0] ?? null;
        if (!drawer) {
          console.error(`[Server] ❌ Failed to serialize drawer in room ${roomId}`);
          await endRound(roomId);
          return;
        }

        io.to(roomId).emit("round-started", {
          drawer,
          roundTime: room.roundTime,
          roundNumber: room.roundNumber,
        });

        io.to(room.currentDrawer.socketId).emit("draw-word", {
          word: room.currentWord,
        });

        room.startRoundTimer(async (timeLeft) => {
          io.to(roomId).emit("round-timer", { timeLeft });
          const keptDuringTimer = await persistRoom(room);
          if (!keptDuringTimer) {
            return;
          }
          if (timeLeft === 0) {
            await endRound(roomId);
          }
        });
      } catch (error) {
        console.error("Failed to start next round", error);
        room.isGameActive = false;
        room.currentDrawer = null;
        const keptAfterError = await persistRoom(room);
        if (!keptAfterError) {
          return;
        }
        io.to(roomId).emit("game-ended", {
          reason: "error",
          scores: serializePlayers(room.players),
        });
      }
    }, 3000);
  }
});

function cleanupIntervals() {
  if (roomSweepTimer) {
    clearInterval(roomSweepTimer);
    roomSweepTimer = null;
  }
}

async function cleanup() {
  cleanupIntervals();
  await shutdownRedis();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  if (isRedisEnabled()) {
    console.log(`🔴 Redis adapter: ENABLED (horizontal scaling active)`);
  } else {
    console.log(`⚪ Redis adapter: DISABLED (single-instance mode)`);
  }
});
