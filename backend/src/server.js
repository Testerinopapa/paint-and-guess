import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { WORDS } from "./words.js";
import { RoomStore } from "./store/roomStore.js";
import { RoomRepository } from "./store/roomRepository.js";
import { WORDS, getWordPacks, getRandomWordFromPack } from "./words.js";
import { GameRoom } from "./gameRoom.js";

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

const roomStore = new RoomStore(path.join(dataDir, "rooms.db"));
const roomRepository = new RoomRepository(roomStore);
await roomRepository.initialize();

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
  return players.map((player) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    isReady: player.isReady,
    avatar: player.avatar ?? null,
  }));
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
  return players.map((player) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    isReady: player.isReady,
    avatar: player.avatar ?? null,
  }));
}

// Helper functions
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
      players: room.players.length,
      maxPlayers: room.maxPlayers,
      wordPack: room.wordPack,
    }));

  res.json(publicRooms);
});

app.post("/api/rooms", async (req, res) => {
  const { name, isPublic = true, maxPlayers = 6, roundTime = 60, maxRounds = 6 } = req.body;
  const roomId = generateRoomId();

  const room = await roomRepository.createRoom({
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

app.post("/api/rooms", (req, res) => {
  const { name, isPublic = true, maxPlayers = 6, roundTime = 60, maxRounds = 6, wordPack = "classic" } = req.body;
  const roomId = generateRoomId();

  const room = new GameRoom({
    id: roomId,
    name: sanitizeName(name, `Room ${roomId}`),
    isPublic,
    maxPlayers,
    roundTime,
    maxRounds,
  });

    wordPack,
  });

  rooms.set(roomId, room);
  res.json({ roomId, ...room.toJSON() });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, avatar, playerId: reconnectId }) => {
    const room = roomRepository.getRoom(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const existingPlayerId = typeof reconnectId === "string" ? reconnectId : null;
    const existingPlayer = existingPlayerId ? room.getPlayerById(existingPlayerId) : null;

    if (!existingPlayer && room.players.length >= room.maxPlayers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    let player;

    if (existingPlayer) {
      player = existingPlayer;
      player.name = sanitizeName(playerName, player.name);
      player.avatar = sanitizeAvatar(avatar);
      player.isReady = false;
      player.hasGuessed = false;
    } else {
      player = {
        id: uuidv4(),
        name: sanitizeName(playerName, `Player ${room.players.length + 1}`),
        score: 0,
        isReady: false,
        avatar: sanitizeAvatar(avatar),
        hasGuessed: false,
      };
      room.addPlayer(player);
    }

    player.socketId = socket.id;
    const player = {
      id: socket.id,
      name: sanitizeName(
        playerName,
        `Player ${room.players.length + 1}`
      ),
      score: 0,
      isReady: false,
      avatar: sanitizeAvatar(avatar),
    };

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    await roomRepository.saveRoom(room);

    socket.emit("session", { playerId: player.id });

    // Notify room of new player
    const publicPlayer = serializePlayers([player])[0];
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

    if (room.players.length === 0) {
      await roomRepository.deleteRoom(roomId);
    } else {
      await roomRepository.saveRoom(room);
      io.to(roomId).emit("player-left", {
        playerId,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });
  socket.on("leave-room", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (room) {
      room.removePlayer(socket.id);
      socket.leave(roomId);

      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit("player-left", {
          playerId: socket.id,
          players: serializePlayers(room.players),
          ownerId: room.ownerId,
        });
      }
    }
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
    console.log(`[Server] 🎮 start-game request from ${socket.id}, room owner: ${room.ownerId}`);
    
    if (room.ownerId !== socket.id) {
      console.log(`[Server] ⛔ Non-host ${socket.id} tried to start game`);
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    try {
      const getWord = () => getRandomWordForRoom(room);
      room.startGame(getWord);
      console.log(`[Server] ✅ Game started successfully in room ${roomId}`);
    } catch (error) {
      console.log(`[Server] ❌ Failed to start game: ${error.message}`);
      socket.emit("error", { message: error.message });
      return;
    }

    try {
      room.startGame(getRandomWord);
      await roomRepository.saveRoom(room);
    } catch (error) {
      socket.emit("error", { message: error.message });
      return;
    }

    const drawer = room.currentDrawer ? serializePlayers([room.currentDrawer])[0] : null;
    io.to(roomId).emit("game-started", {
      drawer,
      drawer: room.currentDrawer,
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
      await roomRepository.saveRoom(room);
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
    if (!player) return;

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
    const normalizedWord = room.currentWord.toLowerCase().trim();

    if (normalizedGuess === normalizedWord) {
      player.hasGuessed = true;
      const timeRemaining = room.getTimeRemainingSeconds();
      const points = Math.max(50, Math.floor(100 * (timeRemaining / room.roundTime)));
      player.score += points;

      // Award drawer points
      if (room.currentDrawer && !room.drawerRewarded) {
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
      });

      const allGuessed = room.players
        .filter((p) => p.id !== room.currentDrawer?.id)
        .every((p) => p.hasGuessed);

      if (allGuessed) {
        await endRound(roomId);
        return;
      }

      await roomRepository.saveRoom(room);
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
    if (!player) return;

    // Filter out hints and offensive words (basic MVP filtering)
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
  socket.on("set-ready", ({ isReady }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.isGameActive) return;

    const ready = Boolean(isReady);
    const player = room.players.find((p) => p.id === socket.id);
    console.log(`[Server] ${ready ? '✅' : '❌'} Player ${player?.name || socket.id} set ready: ${ready}`);
    room.setPlayerReady(socket.id, ready);

    io.to(roomId).emit("player-ready", {
      playerId: socket.id,
      isReady: ready,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (room) {
      room.removePlayer(socket.id);
      socket.leave(roomId);

      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit("player-left", {
          playerId: socket.id,
          players: serializePlayers(room.players),
          ownerId: room.ownerId,
        });

    const room = roomRepository.getRoom(roomId);
    if (!room || room.isGameActive) return;

    const ready = Boolean(isReady);
    room.setPlayerReady(playerId, ready);

    await roomRepository.saveRoom(room);

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

    room.removePlayer(playerId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;

    if (room.players.length === 0) {
      await roomRepository.deleteRoom(roomId);
    } else {
      await roomRepository.saveRoom(room);
      io.to(roomId).emit("player-left", {
        playerId,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });

      if (room.isGameActive && room.currentDrawer?.id === playerId) {
        await endRound(roomId);
      }
    }

    console.log(`Client disconnected: ${socket.id}`);
  });

  async function endRound(roomId) {
    const room = roomRepository.getRoom(roomId);
    if (!room) return;

    if (!room.isGameActive || !room.isRoundActive) {
      return;
    }

    room.endRound();
    const revealedWord = room.currentWord;

    await roomRepository.saveRoom(room);
    console.log(`[Server] ⏸️ Ending round ${room.roundNumber} in room ${roomId}`);
    room.endRound();
    const revealedWord = room.currentWord;

    io.to(roomId).emit("round-ended", {
      word: revealedWord,
      scores: serializePlayers(room.players),
      roundNumber: room.roundNumber,
    });

    room.currentWord = null;

    if (room.shouldEndGame() || room.players.length < 2) {
      room.isGameActive = false;
      room.currentDrawer = null;
      await roomRepository.saveRoom(room);
      io.to(roomId).emit("game-ended", {
        reason: room.players.length < 2 ? "not enough players" : "maximum rounds reached",
        scores: serializePlayers(room.players),

    if (room.shouldEndGame() || room.players.length < 2) {
      room.isGameActive = false;
      room.currentDrawer = null;
      const reason = room.players.length < 2 ? "not enough players" : "maximum rounds reached";
      console.log(`[Server] 🏁 Game ended in room ${roomId}: ${reason}`);
      io.to(roomId).emit("game-ended", {
        reason,
        scores: serializePlayers(room.players),
      });
      return;
    }

    console.log(`[Server] ⏳ Starting next round in 3 seconds...`);
    // Wait 3 seconds before starting next round
    setTimeout(() => {
      // Rotate drawer
      const getWord = () => getRandomWordForRoom(room);
      room.nextRound(getWord);

      console.log(`[Server] 🔄 Broadcasting round-started for round ${room.roundNumber}`);
      io.to(roomId).emit("round-started", {
        drawer: room.currentDrawer,
        roundTime: room.roundTime,
        roundNumber: room.roundNumber,
      });
      return;
    }

    setTimeout(async () => {
      try {
        room.nextRound(getRandomWord);
        await roomRepository.saveRoom(room);

        const drawer = room.currentDrawer ? serializePlayers([room.currentDrawer])[0] : null;
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
          await roomRepository.saveRoom(room);
          if (timeLeft === 0) {
            await endRound(roomId);
          }
        });
      } catch (error) {
        console.error("Failed to start next round", error);
        room.isGameActive = false;
        room.currentDrawer = null;
        await roomRepository.saveRoom(room);
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});
