import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { WORDS, getWordPacks, getRandomWordFromPack } from "./words.js";
import { GameRoom } from "./gameRoom.js";
import { roomRepository } from "./roomRepository.js";

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

// Initialize room repository
await roomRepository.init();

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
    .getPublic()
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

  await roomRepository.set(roomId, room);
  res.json({ roomId, ...room.toJSON() });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, playerName, avatar, reconnectPlayerId, reconnectToken }) => {
    const room = roomRepository.get(roomId);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    let player;
    let sessionToken;
    let isReconnection = false;

    // Check if this is a reconnection attempt
    if (reconnectPlayerId && reconnectToken) {
      const existingPlayer = room.getPlayerById(reconnectPlayerId);
      
      if (existingPlayer && room.validateSessionToken(reconnectPlayerId, reconnectToken)) {
        // Valid reconnection
        player = existingPlayer;
        player.socketId = socket.id;
        sessionToken = reconnectToken; // Reuse existing token
        isReconnection = true;
        console.log(`[Server] 🔄 Player reconnected: ${player.name} (${player.id})`);
      } else {
        // Invalid token or player not found - reject reconnection
        socket.emit("error", { message: "Invalid reconnection credentials" });
        console.log(`[Server] ⛔ Invalid reconnection attempt for player ${reconnectPlayerId}`);
        return;
      }
    } else {
      // New player joining
      if (room.players.length >= room.maxPlayers) {
        socket.emit("error", { message: "Room is full" });
        return;
      }

      // Generate stable player ID
      const playerId = uuidv4();

      player = {
        id: playerId,
        socketId: socket.id,
        name: sanitizeName(
          playerName,
          `Player ${room.players.length + 1}`
        ),
        score: 0,
        isReady: false,
        avatar: sanitizeAvatar(avatar),
      };

      room.addPlayer(player);
      
      // Generate session token for this player
      sessionToken = room.generateSessionToken(playerId);
      
      console.log(`[Server] ➕ New player joined: ${player.name} (${player.id})`);
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerId = player.id;

    // Save room state
    await roomRepository.set(roomId, room);

    if (!isReconnection) {
      // Notify room of new player
      const publicPlayer = serializePlayers([player])[0];
      io.to(roomId).emit("player-joined", {
        player: publicPlayer,
        players: serializePlayers(room.players),
        ownerId: room.ownerId,
      });
    }

    // Send current room state and session credentials to the player
    socket.emit("room-state", {
      ...room.toJSON(),
      sessionToken, // Send session token for reconnection
      playerId: player.id, // Send stable player ID
    });

    // If reconnecting and game is active, restore drawer state
    if (isReconnection && room.isGameActive && room.currentDrawer?.id === player.id) {
      console.log(`[Server] 🎨 Drawer reconnected, sending word: ${room.currentWord}`);
      socket.emit("draw-word", { word: room.currentWord });
      
      // Restart round timer if round is active
      if (room.isRoundActive && !room.timer) {
        room.startRoundTimer((timeLeft) => {
          io.to(roomId).emit("round-timer", { timeLeft });
          if (timeLeft === 0) {
            endRound(roomId);
          }
        });
      }
    }
  });

  socket.on("leave-room", async () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (room) {
      room.removePlayer(playerId);
      socket.leave(roomId);

      if (room.players.length === 0) {
        await roomRepository.delete(roomId);
        console.log(`[Server] 🗑️ Deleted empty room: ${roomId}`);
      } else {
        await roomRepository.set(roomId, room);
        io.to(roomId).emit("player-left", {
          playerId: playerId,
          players: serializePlayers(room.players),
          ownerId: room.ownerId,
        });
      }
    }
  });

  socket.on("start-game", async () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (!room || room.isGameActive) return;

    console.log(`[Server] 🎮 start-game request from player ${playerId}, room owner: ${room.ownerId}`);
    
    if (room.ownerId !== playerId) {
      console.log(`[Server] ⛔ Non-host ${playerId} tried to start game`);
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

    // Send word only to drawer (use socketId)
    if (room.currentDrawer?.socketId) {
      io.to(room.currentDrawer.socketId).emit("draw-word", {
        word: room.currentWord,
      });
    } else {
      console.log(`[Server] ⚠️ Drawer ${room.currentDrawer?.name} has no socketId, ending round`);
      await endRound(roomId);
      return;
    }

    // Save room state
    await roomRepository.set(roomId, room);

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
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (!room || !room.isGameActive) return;

    // Only drawer can send drawing events
    if (playerId !== room.currentDrawer?.id) return;

    // Broadcast to all other players in room
    socket.to(roomId).emit("drawing-event", event);
  });

  socket.on("clear-canvas", () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (!room || !room.isGameActive) return;

    if (playerId !== room.currentDrawer?.id) return;

    io.to(roomId).emit("canvas-cleared");
  });

  socket.on("guess", async ({ guess }) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (!room || !room.isGameActive) return;

    // Drawer can't guess
    if (playerId === room.currentDrawer?.id) return;

    const player = room.getPlayerById(playerId);
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

      // Save updated scores
      await roomRepository.set(roomId, room);

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
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
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
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (!room || room.isGameActive) return;

    const ready = Boolean(isReady);
    const player = room.getPlayerById(playerId);
    console.log(`[Server] ${ready ? '✅' : '❌'} Player ${player?.name || playerId} set ready: ${ready}`);
    room.setPlayerReady(playerId, ready);

    await roomRepository.set(roomId, room);

    io.to(roomId).emit("player-ready", {
      playerId: playerId,
      isReady: ready,
      players: serializePlayers(room.players),
      ownerId: room.ownerId,
    });
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId) return;

    const room = roomRepository.get(roomId);
    if (room) {
      const player = room.getPlayerById(playerId);
      
      // Clear socketId but keep player in room for potential reconnection
      if (player) {
        player.socketId = null;
        console.log(`[Server] 🔌 Player disconnected: ${player.name} (${playerId}), room: ${roomId}`);
      }

      socket.leave(roomId);

      // Only delete room if all players are disconnected and no active game
      const allDisconnected = room.players.every(p => !p.socketId);
      if (allDisconnected && !room.isGameActive) {
        await roomRepository.delete(roomId);
        console.log(`[Server] 🗑️ Deleted room ${roomId} (all players disconnected)`);
      } else {
        await roomRepository.set(roomId, room);
        
        // Notify other players (but don't remove from player list yet)
        io.to(roomId).emit("player-disconnected", {
          playerId: playerId,
          playerName: player?.name,
        });

        // If drawer disconnected during active round, pause/end round
        if (room.isGameActive && room.currentDrawer?.id === playerId && room.isRoundActive) {
          console.log(`[Server] ⚠️ Drawer disconnected during active round, ending round`);
          endRound(roomId);
        }
      }
    }

    console.log(`Client disconnected: ${socket.id}`);
  });

  async function endRound(roomId) {
    const room = roomRepository.get(roomId);
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

    // Save room state
    await roomRepository.set(roomId, room);

    // Count connected players
    const connectedPlayers = room.players.filter(p => p.socketId);
    
    if (room.shouldEndGame() || connectedPlayers.length < 2) {
      room.isGameActive = false;
      room.currentDrawer = null;
      const reason = connectedPlayers.length < 2 ? "not enough players" : "maximum rounds reached";
      console.log(`[Server] 🏁 Game ended in room ${roomId}: ${reason}`);
      io.to(roomId).emit("game-ended", {
        reason,
        scores: serializePlayers(room.players),
      });
      await roomRepository.set(roomId, room);
      return;
    }

    console.log(`[Server] ⏳ Starting next round in 3 seconds...`);
    // Wait 3 seconds before starting next round
    setTimeout(async () => {
      // Rotate drawer
      const getWord = () => getRandomWordForRoom(room);
      room.nextRound(getWord);

      console.log(`[Server] 🔄 Broadcasting round-started for round ${room.roundNumber}`);
      io.to(roomId).emit("round-started", {
        drawer: room.currentDrawer,
        roundTime: room.roundTime,
        roundNumber: room.roundNumber,
      });

      // Send word only to drawer (use socketId)
      if (room.currentDrawer?.socketId) {
        io.to(room.currentDrawer.socketId).emit("draw-word", {
          word: room.currentWord,
        });
      } else {
        console.log(`[Server] ⚠️ Drawer ${room.currentDrawer?.name} not connected, ending round`);
        await endRound(roomId);
        return;
      }

      // Save room state
      await roomRepository.set(roomId, room);

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

