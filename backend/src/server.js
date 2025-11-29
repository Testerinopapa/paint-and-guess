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

const triviaRoomRepository = new TriviaRoomRepository();

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
  console.log(`Client connected: ${socket.id}`);


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

    // Paint-and-guess room disconnect handling removed
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  if (isRedisEnabled()) {
    console.log(`🔴 Redis adapter: ENABLED (horizontal scaling active)`);
  } else {
    console.log(`⚪ Redis adapter: DISABLED (single-instance mode)`);
  }
});
