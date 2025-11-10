import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { WORDS } from "./words.js";
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

// Helper functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
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
    }));
  res.json(publicRooms);
});

app.post("/api/rooms", (req, res) => {
  const { name, isPublic = true, maxPlayers = 6, roundTime = 60 } = req.body;
  const roomId = generateRoomId();
  
  const room = new GameRoom({
    id: roomId,
    name: name || `Room ${roomId}`,
    isPublic,
    maxPlayers,
    roundTime,
  });
  
  rooms.set(roomId, room);
  res.json({ roomId, ...room.toJSON() });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, playerName }) => {
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
      name: playerName || `Player ${room.players.length + 1}`,
      score: 0,
      isReady: false,
    };

    room.addPlayer(player);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    // Notify room of new player
    io.to(roomId).emit("player-joined", {
      player,
      players: room.players,
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
          players: room.players,
        });
      }
    }
  });

  socket.on("start-game", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.isGameActive) return;

    // Only allow starting if player is the first one (room creator) or implement voting
    room.startGame(getRandomWord);
    room.currentWord = getRandomWord();

    io.to(roomId).emit("game-started", {
      drawer: room.currentDrawer,
      word: room.currentWord, // Only drawer sees this
      roundTime: room.roundTime,
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

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = room.currentWord.toLowerCase().trim();

    if (normalizedGuess === normalizedWord) {
      // Correct guess!
      player.hasGuessed = true;
      const timeRemaining = room.roundTime - room.elapsedTime;
      const points = Math.max(50, Math.floor(100 * (timeRemaining / room.roundTime)));
      player.score += points;

      // Award drawer points
      if (room.currentDrawer) {
        const drawerPoints = 75;
        room.currentDrawer.score += drawerPoints;
      }

      io.to(roomId).emit("correct-guess", {
        player: { id: player.id, name: player.name },
        points,
        word: room.currentWord,
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
        guess,
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
    const filteredMessage = message.trim();
    if (filteredMessage.length === 0) return;

    io.to(roomId).emit("chat-message", {
      player: { id: player.id, name: player.name },
      message: filteredMessage,
      timestamp: Date.now(),
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
          players: room.players,
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

    room.endRound();

    // Send round results
    io.to(roomId).emit("round-ended", {
      word: room.currentWord,
      scores: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
    });

    // Wait 3 seconds before starting next round
    setTimeout(() => {
      if (room.players.length < 2) {
        // Not enough players
        room.isGameActive = false;
        io.to(roomId).emit("game-ended", {
          reason: "not enough players",
        });
        return;
      }

      // Rotate drawer
      room.nextRound(getRandomWord);
      room.currentWord = getRandomWord();

      io.to(roomId).emit("round-started", {
        drawer: room.currentDrawer,
        roundTime: room.roundTime,
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

