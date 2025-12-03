import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { getWordPacks, getRandomWordFromPack } from "./words.js";
import { initializeRedis, getRedisSubscriber, getRedisPublisher, isRedisEnabled, shutdownRedis } from "./redisClient.js";
import { getRegistryResponse, loadGameRegistry } from "./gameRegistry.js";
import { TriviaRoomRepository } from "./triviaRoomRepository.js";
import { getSampleQuestions, getQuestionsByQuizId, QUIZZES } from "./triviaQuestions.js";
import { canvaRoomRepository } from "./canvaRoomRepository.js";
import authRoutes from "./auth/routes.js";
import puzzleRoutes from "./puzzleRoutes.js";

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configuredLogLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
const ACTIVE_LOG_LEVEL = LOG_LEVELS[configuredLogLevel] ?? LOG_LEVELS.info;

const logger = {
  error: (message, metadata) => {
    const prefix = `[ERROR]`;
    const payload = metadata ? [message, metadata] : [message];
    console.error(prefix, ...payload);
  },
  warn: (message, metadata) => {
    const prefix = `[WARN]`;
    const payload = metadata ? [message, metadata] : [message];
    console.warn(prefix, ...payload);
  },
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
  methods: ["GET", "POST", "PUT", "OPTIONS"],
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

// Authentication routes
app.use("/api/auth", authRoutes);

// Puzzle routes
app.use("/api/puzzles", puzzleRoutes);

app.get("/api/games", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const registry = await loadGameRegistry({ forceRefresh });
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

const triviaRoomRepository = new TriviaRoomRepository();

// Track rooms that are currently ending a round to prevent race conditions
const endingRoundRooms = new Set();

process.on("unhandledRejection", (reason) => {
  console.error("[Process] UnhandledRejection:", reason);
});

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


function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// REST API endpoints

app.get("/api/games/registry", async (req, res) => {
  const requestStart = Date.now();
  const forceRefresh = req.query.refresh === "true";
  const clientIp = req.ip || req.socket.remoteAddress;

  try {
    const registry = await loadGameRegistry({ forceRefresh });
    const duration = Date.now() - requestStart;
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


// Health endpoint
app.get("/api/health", async (req, res) => {
  try {
    res.json({
      status: "ok",
      redis: {
        enabled: isRedisEnabled(),
        adapter: redisAdapter ? "active" : "none",
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: String(error?.message || error) });
  }
});

io.on("connection", (socket) => {


  socket.on("disconnect", async () => {
    const { roomId, playerId, isTrivia, isCanva } = socket.data;
    if (!roomId || !playerId) {
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

    // Paint-and-guess room disconnect handling removed
  });

  // Trivia Blitz socket handlers
  socket.on("trivia:create-room", async ({ roomName, playerName, avatar, quizId }) => {
    const roomId = generateRoomId();
    // Load questions based on quizId, fallback to general if not provided or invalid
    const questions = quizId ? getQuestionsByQuizId(quizId) : getSampleQuestions();
    const quiz = quizId ? QUIZZES[quizId] : null;
    const quizName = quiz ? quiz.name : null;
    
    const room = triviaRoomRepository.createRoom({
      id: roomId,
      name: sanitizeName(roomName, `Room ${roomId}`),
      isPublic: true,
      maxPlayers: 12,
      questions,
      ownerId: null,
      quizId: quizId || null,
      quizName: quizName,
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
      return;
    }

    // Clear the timer since we're transitioning early or it expired
    room.clearQuestionTimer();

    // Get fresh question reference
    const currentQuestion = room.getCurrentQuestion();
    if (!currentQuestion) {
      return;
    }

    room.phase = "answer-reveal";
    io.to(roomId).emit("trivia:phase-changed", {
      phase: room.phase,
      questionIndex: room.currentQuestionIndex,
    });

    io.to(roomId).emit("trivia:answer-reveal", {
      correctOptionId: currentQuestion.correctOptionId,
      answerStats: room.answerStats,
    });

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

        setTimeout(() => {
          const nextRoom = triviaRoomRepository.getRoom(roomId);
          if (!nextRoom) return;

          const hasMore = nextRoom.nextQuestion();

          if (!hasMore) {
            // Game ended - show podium
            const podium = nextRoom.getPodium();
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
              return;
            }
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
      return;
    }

    if (!room.isGameActive) {
      return;
    }

    if (room.phase !== "question-intro") {
      return;
    }

    // Transition from question-intro to question phase
    setTimeout(() => {
      const currentRoom = triviaRoomRepository.getRoom(roomId);
      if (!currentRoom) {
        return;
      }

      currentRoom.phase = "question";
      currentRoom.questionStartTime = Date.now();
      const question = currentRoom.getCurrentQuestion();

      if (!question) {
        return;
      }

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
          return;
        }

        transitionToAnswerReveal(roomId);
      }, question.timeLimit * 1000);
    }, 2000);
  }

  socket.on("trivia:start-game", async () => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) {
      return;
    }

    if (room.isGameActive) {
      return;
    }

    if (room.ownerId !== playerId) {
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    try {
      room.startGame();
    } catch (error) {
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
      return;
    }

    const room = triviaRoomRepository.getRoom(roomId);
    if (!room) {
      return;
    }

    if (room.phase !== "question") {
      return;
    }

    const timeElapsed = Date.now() - (room.questionStartTime || Date.now());
    const result = room.submitAnswer(playerId, optionId, timeElapsed);

    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }

    socket.emit("trivia:answer-result", {
      isCorrect: result.isCorrect,
      points: result.points,
      newScore: result.newScore,
      newStreak: result.newStreak,
    });

    // Check if all non-host players have answered - if so, end question early
    if (room.allPlayersAnswered()) {
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
  socket.on("canva:create-room", async ({ roomName, playerName, avatar, wordPack = "classic", roundTime = 60, maxRounds = 6 }) => {
    // Create room first - it will generate its own ID
    const room = canvaRoomRepository.createRoom({
      name: sanitizeName(roomName, "Canva Room"),
      isPublic: true,
      maxPlayers: 10,
      wordPack,
      roundTime,
      maxRounds,
    });
    const roomId = room.id; // Use the room's actual ID

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

    socket.emit("session", { playerId: player.id });

    socket.emit("canva:room-created", {
      roomId: room.id, // Use room's actual ID
      gamePin: room.gamePin,
      room: room.toJSON(),
    });

    socket.emit("canva:room-state", room.toJSON());
  });

  socket.on("canva:join-room", async ({ gamePin, playerName, avatar }) => {
    const room = canvaRoomRepository.getRoomByPin(gamePin);
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
      name: sanitizeName(playerName, "Player"),
      avatar: sanitizeAvatar(avatar),
      socketId: socket.id,
    };

    room.addPlayer(player);

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = player.id;
    socket.data.isCanva = true;

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
  });

  socket.on("canva:drawing-event", (event) => {
    const { roomId, playerId } = socket.data;
    
    if (!roomId || !playerId) {
      return;
    }
    
    const room = canvaRoomRepository.getRoom(roomId);
    if (!room) {
      return;
    }

    // If game is active, only allow drawer to draw
    if (room.isGameActive && room.isRoundActive && playerId !== room.currentDrawer?.id) {
      return;
    }

    // Ensure socket is in room
    if (!socket.rooms.has(roomId)) {
      socket.join(roomId);
    }

    // Broadcast to all OTHER sockets in room (excludes sender)
    socket.broadcast.to(roomId).emit("canva:drawing-event", event);
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

  socket.on("canva:update-avatar", async ({ avatar }) => {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return;
    }

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room) {
      return;
    }

    const sanitizedAvatar = sanitizeAvatar(avatar);
    room.updatePlayerAvatar(playerId, sanitizedAvatar);
    
    // Broadcast updated player list to all clients in room
    io.to(roomId).emit("canva:room-state", room.toJSON());
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

    // Clear canvas for all clients when game starts
    io.to(roomId).emit("canva:canvas-cleared");

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
        // Get updated players list after score updates
        const updatedPlayers = room.toJSON().players;
        io.to(roomId).emit("canva:correct-guess", {
          player: { id: player.id, name: player.name },
          points: result.points,
          word: room.currentWord,
          players: updatedPlayers,
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
    // Guard against concurrent executions
    if (endingRoundRooms.has(roomId)) {
      return;
    }

    const room = canvaRoomRepository.getRoom(roomId);
    if (!room || !room.isGameActive) {
      return;
    }

    // Mark room as ending round
    endingRoundRooms.add(roomId);

    try {
      // Save the previous word before ending the round
      const previousWord = room.currentWord;
      const previousRoundNumber = room.roundNumber;

      // CRITICAL: Stop the timer FIRST to prevent it from firing again
      room.endRound();

      const shouldEnd = room.shouldEndGame();
      
      if (shouldEnd) {
        room.isGameActive = false;
        io.to(roomId).emit("canva:game-ended", {
          players: room.toJSON().players,
        });
        endingRoundRooms.delete(roomId);
      } else {
        // Emit round-ended with the previous word
        io.to(roomId).emit("canva:round-ended", {
          word: previousWord,
          roundNumber: previousRoundNumber,
        });

        // Wait 3 seconds before starting next round (like paint & guess mode)
        setTimeout(async () => {
          // Check again if room is still active (might have been deleted/disconnected)
          const nextRoom = canvaRoomRepository.getRoom(roomId);
          if (!nextRoom || !nextRoom.isGameActive) {
            endingRoundRooms.delete(roomId);
            return;
          }

          // Double-check we're not already ending a round (shouldn't happen, but safety check)
          if (endingRoundRooms.has(roomId)) {
            endingRoundRooms.delete(roomId);
          }

          const getWord = () => getRandomWordFromPack(nextRoom.wordPack || "classic");
          try {
            const previousDrawerId = nextRoom.currentDrawer?.id;
            nextRoom.nextRound(getWord);

            // Verify drawer is still valid
            if (!nextRoom.currentDrawer || !nextRoom.currentDrawer.connected || !nextRoom.currentDrawer.socketId) {
              const activePlayers = nextRoom.getActivePlayers();
              if (activePlayers.length < 2) {
                nextRoom.isGameActive = false;
                io.to(roomId).emit("canva:game-ended", {
                  players: nextRoom.toJSON().players,
                });
                endingRoundRooms.delete(roomId);
                return;
              }
              
              // Select a new drawer from active players
              nextRoom.currentDrawer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
              
              // Double-check the new drawer has socketId
              if (!nextRoom.currentDrawer?.socketId) {
                console.error(`[Server] ❌ Selected drawer ${nextRoom.currentDrawer?.id} has no socketId in canva room ${roomId}`);
                // Don't recursively call endCanvaRound - just end the game
                nextRoom.isGameActive = false;
                io.to(roomId).emit("canva:game-ended", {
                  players: nextRoom.toJSON().players,
                });
                endingRoundRooms.delete(roomId);
                return;
              }
            }

            // CRITICAL: Ensure drawer is properly serialized with all required fields
            if (!nextRoom.currentDrawer || !nextRoom.currentDrawer.id) {
              console.error(`[Server] ❌ No drawer set after nextRound in canva room ${roomId}`);
              nextRoom.isGameActive = false;
              io.to(roomId).emit("canva:game-ended", {
                players: nextRoom.toJSON().players,
              });
              endingRoundRooms.delete(roomId);
              return;
            }

            const drawer = {
              id: nextRoom.currentDrawer.id,
              name: nextRoom.currentDrawer.name,
            };

            // Emit round-started with the new round info
            io.to(roomId).emit("canva:round-started", {
              drawer,
              roundTime: nextRoom.roundTime,
              roundNumber: nextRoom.roundNumber,
            });

            // Clear canvas for all clients when new round starts
            io.to(roomId).emit("canva:canvas-cleared");

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

            // Clear the flag after successfully starting the new round
            endingRoundRooms.delete(roomId);
          } catch (error) {
            console.error("[Server] Error starting next canva round:", error);
            const errorRoom = canvaRoomRepository.getRoom(roomId);
            if (errorRoom) {
              errorRoom.isGameActive = false;
              io.to(roomId).emit("canva:game-ended", {
                players: errorRoom.toJSON().players,
              });
            }
            endingRoundRooms.delete(roomId);
          }
        }, 3000); // 3 second delay between rounds
      }
    } catch (error) {
      console.error(`[Canva] Error in endCanvaRound for room ${roomId}:`, error);
      endingRoundRooms.delete(roomId);
    }
  }

  socket.on("disconnect", async () => {
    const { roomId, playerId, isTrivia, isCanva } = socket.data;
    if (!roomId || !playerId) {
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

    // Paint-and-guess room disconnect handling removed
  });

});

function cleanupIntervals() {
  // Room sweep timer removed with paint-and-guess
}

async function cleanup() {
  cleanupIntervals();
  await shutdownRedis();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
});
