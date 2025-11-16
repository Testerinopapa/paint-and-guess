import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { WORDS } from "./words.js";
import { RoomStore } from "./store/roomStore.js";
import { RoomRepository } from "./store/roomRepository.js";
import { logger } from "./logger.js";

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

const roomStore = new RoomStore();
const roomRepository = new RoomRepository(roomStore);
await roomRepository.initialize();

async function persistRoom(room) {
  const markedStale = room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
  const removedPlayers = room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);

  if (room.players.length === 0) {
    await roomRepository.deleteRoom(room.id);
    logger.info({ roomId: room.id }, "Removed empty room");
    return false;
  }

  await roomRepository.saveRoom(room);
  if (markedStale || removedPlayers) {
    logger.info(
      { roomId: room.id, markedStale, removedPlayers },
      "Pruned inactive players while persisting room"
    );
  }
  return true;
}

const MAX_MESSAGE_LENGTH = 200;
const MAX_NAME_LENGTH = 24;
const MAX_AVATAR_LENGTH = 2048;
const PLAYER_DISCONNECT_GRACE_PERIOD_MS = getNumberFromEnv(
  "PLAYER_DISCONNECT_GRACE_PERIOD_MS",
  2 * 60 * 1000
);
const PLAYER_STALE_HEARTBEAT_MS = getNumberFromEnv("PLAYER_STALE_HEARTBEAT_MS", 45 * 1000);
const ROOM_SWEEP_INTERVAL_MS = getNumberFromEnv("ROOM_SWEEP_INTERVAL_MS", 30_000);

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

function getNumberFromEnv(key, defaultValue) {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

async function sweepInactiveRooms(trigger = "manual") {
  if (sweepingRooms) {
    return;
  }

  sweepingRooms = true;
  try {
    for (const room of roomRepository.getRooms()) {
      const hadPlayers = room.players.length;
      const markedStale = room.markStalePlayersDisconnected(PLAYER_STALE_HEARTBEAT_MS);
      const kept = await persistRoom(room);

      if (!kept) {
        logger.info({ roomId: room.id, trigger }, "Removed empty room during sweep");
        continue;
      }

      if (markedStale) {
        io.to(room.id).emit("player-left", {
          playerId: null,
          players: serializePlayers(room.players),
          ownerId: room.ownerId,
        });
      }

      if (hadPlayers > 0 && room.players.length === 0) {
        logger.info({ roomId: room.id, trigger }, "Room became empty during sweep");
      }
    }
  } catch (error) {
    logger.error({ err: error, trigger }, "Failed to sweep rooms");
  } finally {
    sweepingRooms = false;
  }
}

app.get("/api/rooms", (req, res) => {
  const publicRooms = roomRepository
    .listPublicRooms()
    .filter((room) => !room.isGameActive)
    .map((room) => ({
      id: room.id,
      name: room.name,
      players: room.getActivePlayerCount(),
      maxPlayers: room.maxPlayers,
    }));

  res.json(publicRooms);
});

app.post("/api/rooms", async (req, res) => {
  const { name, isPublic = true, maxPlayers = 6, roundTime = 60, maxRounds = 6 } = req.body;
  const roomId = generateRoomId();

  const room = await roomRepository.createRoom({
    id: roomId,
    name: sanitizeName(name, `Room ${roomId}`),
    isPublic,
    maxPlayers,
    roundTime,
    maxRounds,
  });

  res.json({ roomId, ...room.toJSON() });
});

let sweepingRooms = false;
const sweepTimer = setInterval(() => {
  sweepInactiveRooms("interval").catch((error) =>
    logger.error({ err: error }, "Room sweep failed")
  );
}, ROOM_SWEEP_INTERVAL_MS);

if (typeof sweepTimer.unref === "function") {
  sweepTimer.unref();
}

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");

  socket.on("join-room", async ({ roomId, playerName, avatar, playerId: reconnectId }) => {
    const room = roomRepository.getRoom(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    room.pruneDisconnectedPlayers(PLAYER_DISCONNECT_GRACE_PERIOD_MS);

    const existingPlayerId = typeof reconnectId === "string" ? reconnectId : null;
    const existingPlayer = existingPlayerId ? room.getPlayerById(existingPlayerId) : null;

    if (!existingPlayer && room.getActivePlayerCount() >= room.maxPlayers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    let playerRecord;

    if (existingPlayer) {
      if (existingPlayer.connected && existingPlayer.socketId && existingPlayer.socketId !== socket.id) {
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
      room.addPlayer(newPlayer);
      playerRecord = room.getPlayerById(newPlayer.id);
    }

    room.markPlayerConnected(playerRecord.id, socket.id);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = playerRecord.id;

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

  socket.on("heartbeat", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayerById(playerId);
    if (!player) return;

    player.lastSeen = Date.now();
    await persistRoom(room);
    socket.emit("heartbeat-ack", { serverTime: Date.now() });
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
      room.startGame(getRandomWord);
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

  socket.on("disconnect", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;

    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    room.markPlayerDisconnected(playerId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;

    const kept = await persistRoom(room);

    if (kept) {
      io.to(roomId).emit("player-left", {
        playerId,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });

      if (room.isGameActive && room.currentDrawer?.id === playerId) {
        await endRound(roomId);
      }
    }

    logger.info({ socketId: socket.id, roomId, playerId }, "Client disconnected");
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
        room.nextRound(getRandomWord);
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
        logger.error({ err: error, roomId }, "Failed to start next round");
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, "🚀 Server running");
  logger.info("📡 Socket.io ready for connections");
});
