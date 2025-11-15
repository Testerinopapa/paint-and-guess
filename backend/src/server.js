import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
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

// In-memory room storage (MVP - replace with database later)
const rooms = new Map();

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
  const publicRooms = Array.from(rooms.values())
    .filter((room) => room.isPublic && !room.isGameActive)
    .map((room) => ({
      id: room.id,
      name: room.name,
      players: room.players.length,
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
    wordPack,
  });

  rooms.set(roomId, room);
  res.json({ roomId, ...room.toJSON() });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, playerName, avatar }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

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

    room.addPlayer(player);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    // Notify room of new player
    const publicPlayer = serializePlayers([player])[0];
    io.to(roomId).emit("player-joined", {
      player: publicPlayer,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });

    // Send current room state to the new player
    socket.emit("room-state", room.toJSON());
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

  socket.on("start-game", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.isGameActive) return;

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

    io.to(roomId).emit("game-started", {
      drawer: room.currentDrawer,
      roundTime: room.roundTime,
      roundNumber: room.roundNumber,
    });

    // Send word only to drawer
    io.to(room.currentDrawer.id).emit("draw-word", {
      word: room.currentWord,
    });

    // Start round timer
    room.startRoundTimer((timeLeft) => {
      io.to(roomId).emit("round-timer", { timeLeft });
      if (timeLeft === 0) {
        endRound(roomId);
      }
    });
  });

  socket.on("drawing-event", (event) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.isGameActive) return;

    // Only drawer can send drawing events
    if (socket.id !== room.currentDrawer?.id) return;

    // Broadcast to all other players in room
    socket.to(roomId).emit("drawing-event", event);
  });

  socket.on("clear-canvas", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.isGameActive) return;

    if (socket.id !== room.currentDrawer?.id) return;

    io.to(roomId).emit("canvas-cleared");
  });

  socket.on("guess", ({ guess }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.isGameActive) return;

    // Drawer can't guess
    if (socket.id === room.currentDrawer?.id) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Check if already guessed correctly
    if (player.hasGuessed) return;

    const sanitizedGuess = sanitizeMessage(guess);
    if (!sanitizedGuess) {
      return;
    }

    const normalizedGuess = sanitizedGuess.toLowerCase();
    const normalizedWord = room.currentWord.toLowerCase().trim();

    if (normalizedGuess === normalizedWord) {
      // Correct guess!
      player.hasGuessed = true;
      const timeRemaining = room.roundTime - room.elapsedTime;
      const points = Math.max(50, Math.floor(100 * (timeRemaining / room.roundTime)));
      player.score += points;

      // Award drawer points
      if (room.currentDrawer && !room.drawerRewarded) {
        const drawerPoints = 75;
        room.currentDrawer.score += drawerPoints;
        room.markDrawerRewarded();
      }

      io.to(roomId).emit("correct-guess", {
        player: { id: player.id, name: player.name },
        points,
        word: room.currentWord,
        players: serializePlayers(room.players),
      });

      // Check if all players guessed
      const allGuessed = room.players
        .filter((p) => p.id !== room.currentDrawer?.id)
        .every((p) => p.hasGuessed);

      if (allGuessed) {
        // Everyone guessed - end round early
        endRound(roomId);
      }
    } else {
      // Wrong guess - broadcast to room
      io.to(roomId).emit("wrong-guess", {
        player: { id: player.id, name: player.name },
        guess: sanitizedGuess,
      });
    }
  });

  socket.on("chat-message", ({ message }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
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

        // If drawer disconnected, end round
        if (room.isGameActive && room.currentDrawer?.id === socket.id) {
          endRound(roomId);
        }
      }
    }

    console.log(`Client disconnected: ${socket.id}`);
  });

  function endRound(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (!room.isGameActive || !room.isRoundActive) {
      return;
    }

    console.log(`[Server] ⏸️ Ending round ${room.roundNumber} in room ${roomId}`);
    room.endRound();
    const revealedWord = room.currentWord;

    // Send round results
    io.to(roomId).emit("round-ended", {
      word: revealedWord,
      scores: serializePlayers(room.players),
      roundNumber: room.roundNumber,
    });

    room.currentWord = null;

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

      // Send word only to drawer
      io.to(room.currentDrawer.id).emit("draw-word", {
        word: room.currentWord,
      });

      // Start round timer
      room.startRoundTimer((timeLeft) => {
        io.to(roomId).emit("round-timer", { timeLeft });
        if (timeLeft === 0) {
          endRound(roomId);
        }
      });
    }, 3000);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});

