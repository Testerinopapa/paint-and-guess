import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { WORDS, getWordPacks, getRandomWordFromPack } from "./words.js";
import { PrismaRoomStore } from "./store/prismaRoomStore.js";
import { RoomRepository } from "./store/roomRepository.js";

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
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
await fs.mkdir(dataDir, { recursive: true });

const roomStore = new PrismaRoomStore();
const roomRepository = new RoomRepository(roomStore);

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
const MAX_AVATAR_FIELD_LENGTH = 256;
const MAX_AVATAR_ARRAY_LENGTH = 50;
const MAX_AVATAR_DEPTH = 4;

const PROFANITY_LIST = [
  "anal",
  "arse",
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "boner",
  "choad",
  "chode",
  "clit",
  "cock",
  "cuck",
  "cum",
  "cunt",
  "damn",
  "dick",
  "dildo",
  "dyke",
  "fag",
  "fuck",
  "goddamn",
  "hell",
  "jizz",
  "kike",
  "labia",
  "muff",
  "nigger",
  "penis",
  "piss",
  "pube",
  "pussy",
  "queef",
  "shit",
  "slut",
  "spic",
  "twat",
  "vagina",
  "whore",
];

const PROFANITY_REPLACEMENT = "★";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function censorProfanity(text) {
  if (typeof text !== "string") return "";
  return PROFANITY_LIST.reduce((result, word) => {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
    return result.replace(pattern, PROFANITY_REPLACEMENT.repeat(word.length));
  }, text);
}

function sanitizeName(name, fallback) {
  if (typeof name !== "string") {
    return fallback;
  }
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  const cleaned = trimmed.replace(/[^\w\s'-]/g, "");
  const filtered = censorProfanity(cleaned);
  return filtered.length > 0 ? filtered : fallback;
}

function sanitizeMessage(message) {
  if (typeof message !== "string") {
    return "";
  }
  const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  const filtered = censorProfanity(trimmed);
  return filtered;
}

function sanitizeAvatarValue(value, depth = 0) {
  if (depth > MAX_AVATAR_DEPTH) return null;

  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, MAX_AVATAR_FIELD_LENGTH);
    return trimmed.length ? trimmed : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_AVATAR_ARRAY_LENGTH)
      .map((item) => sanitizeAvatarValue(item, depth + 1))
      .filter((item) => item !== null);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, val]) => {
      if (typeof key !== "string" || key.length === 0 || key.length > MAX_AVATAR_FIELD_LENGTH) {
        return acc;
      }
      const sanitizedVal = sanitizeAvatarValue(val, depth + 1);
      if (sanitizedVal !== null) {
        acc[key] = sanitizedVal;
      }
      return acc;
    }, {});
  }

  return null;
}

function sanitizeAvatar(avatar) {
  if (typeof avatar !== "string") {
    return null;
  }

  const trimmed = avatar.trim();
  if (!trimmed || trimmed.length > MAX_AVATAR_LENGTH) {
    return null;
  }

  // Allow simple URLs and data URLs as-is after trimming
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const normalized = sanitizeAvatarValue(parsed);
    if (!normalized || typeof normalized !== "object") {
      return null;
    }
    const encoded = JSON.stringify(normalized);
    return encoded.length <= MAX_AVATAR_LENGTH ? encoded : null;
  } catch (error) {
    logger.warn("[Sanitize] Avatar rejected due to invalid JSON", { error: error?.message });
    return null;
  }
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

    const activeCount = room.getActivePlayerCount();
    const sanitizedName = sanitizeName(playerName, existingPlayer ? existingPlayer.name : `Player ${activeCount + 1}`);
    const sanitizedAvatar = sanitizeAvatar(avatar);

    if (!existingPlayer) {
      const duplicateName = room.players.find(
        (player) => player.connected && player.name.toLowerCase() === sanitizedName.toLowerCase(),
      );
      if (duplicateName) {
        console.log(`[Server] ❌ Duplicate name rejected: ${sanitizedName}`);
        socket.emit("error", { message: "That name is already in use in this room" });
        return;
      }
    } else {
      const conflictingName = room.players.find(
        (player) => player.id !== existingPlayer.id && player.connected && player.name.toLowerCase() === sanitizedName.toLowerCase(),
      );
      if (conflictingName) {
        console.log(`[Server] ❌ Reconnect rename rejected: ${sanitizedName}`);
        socket.emit("error", { message: "That name is already in use in this room" });
        return;
      }
    }

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

      existingPlayer.name = sanitizedName;
      existingPlayer.avatar = sanitizedAvatar;
      existingPlayer.isReady = false;
      existingPlayer.hasGuessed = false;
      playerRecord = existingPlayer;
    } else {
      const newPlayer = {
        id: uuidv4(),
        name: sanitizedName,
        score: 0,
        isReady: false,
        avatar: sanitizedAvatar,
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
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) return;

    if (playerId !== room.currentDrawer?.id) return;

    socket.to(roomId).emit("drawing-event", event);
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
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      console.log(`[Server] 🔌 Client disconnected: ${socket.id} (not in a room)`);
      return;
    }

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

        const drawer = serializePlayers([room.currentDrawer])[0] ?? null;
        io.to(roomId).emit("round-started", {
          drawer,
          roundTime: room.roundTime,
          roundNumber: room.roundNumber,
        });

        if (!room.currentDrawer?.socketId) {
          await endRound(roomId);
          return;
        }

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

process.on("SIGINT", cleanupIntervals);
process.on("SIGTERM", cleanupIntervals);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});
