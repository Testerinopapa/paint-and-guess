import EnginePool from "../lib/enginePool.js";
import { scoreToCp } from "../lib/moveEvaluation.js";

const logger = {
  info: (metadata, message) => {
    console.log(`[Analyze API] ${message}`, metadata || "");
  },
  error: (metadata, message) => {
    console.error(`[Analyze API] ${message}`, metadata || "");
  },
};

// POST /api/analyze
export async function analyzePosition(req, res) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { fen, depth = 12, elo, limitStrength, multiPv = 1 } = req.body;

    if (!fen || typeof fen !== "string") {
      return res.status(400).json({ error: "Missing fen" });
    }

    // Validate FEN format (basic check)
    if (!fen.includes("/") || !fen.includes(" ")) {
      return res.status(400).json({ error: "Invalid fen format" });
    }

    const normalizedDepth = Math.max(1, Math.min(20, parseInt(depth, 10) || 12));
    const normalizedElo =
      typeof elo === "number" ? Math.max(1350, Math.min(2850, Math.floor(elo))) : undefined;
    const normalizedLimitStrength = limitStrength ?? (normalizedElo !== undefined);
    const normalizedMultiPv = Math.max(1, Math.min(10, parseInt(multiPv, 10) || 1));

    logger.info(
      { reqId, fen, depth: normalizedDepth, elo: normalizedElo, limitStrength: normalizedLimitStrength, multiPv: normalizedMultiPv },
      "analysis_request"
    );

    const result = await EnginePool.analyze({
      fen,
      depth: normalizedDepth,
      elo: normalizedElo,
      limitStrength: normalizedLimitStrength,
      multiPv: normalizedMultiPv,
    });

    const response = {
      bestmove: result.bestmove,
      info: result.info,
      infos: result.infos,
      cp: scoreToCp(result.info?.score),
    };

    logger.info({ reqId, bestmove: result.bestmove }, "analysis_complete");
    return res.json(response);
  } catch (error) {
    logger.error({ reqId, err: String(error), stack: error.stack }, "analysis_error");
    return res.status(500).json({
      error: "Analysis failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// POST /api/puzzles/validate-move
// Validates a puzzle move by comparing evaluations
export async function validatePuzzleMove(req, res) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    const { fen, userMove, solutionMove, depth = 8 } = req.body;
    
    if (!fen || !userMove || !solutionMove) {
      return res.status(400).json({ error: "Missing required fields: fen, userMove, solutionMove" });
    }
    
    // Validate FEN format
    if (!fen.includes("/") || !fen.includes(" ")) {
      return res.status(400).json({ error: "Invalid fen format" });
    }
    
    const normalizedDepth = Math.max(4, Math.min(12, parseInt(depth, 10) || 8));
    
    logger.info({ reqId, fen, userMove, solutionMove, depth: normalizedDepth }, "puzzle_move_validation");
    
    // Parse FEN and play moves to get resulting positions
    const { parseFen, makeFen } = await import("chessops/fen");
    const { Chess } = await import("chessops/chess");
    const { parseUci } = await import("chessops/util");
    
    const setupResult = parseFen(fen);
    if (!setupResult.isOk) {
      return res.status(400).json({ error: "Invalid FEN position" });
    }
    
    const pos = Chess.fromSetup(setupResult.unwrap());
    if (!pos.isOk) {
      return res.status(400).json({ error: "Invalid chess position" });
    }
    const position = pos.unwrap();
    
    // Play user move
    const userMoveParsed = parseUci(userMove);
    if (!userMoveParsed) {
      return res.status(400).json({ error: "Invalid user move UCI" });
    }
    
    const posAfterUser = position.clone();
    const userPlayResult = posAfterUser.play(userMoveParsed);
    if (!userPlayResult.isOk) {
      return res.status(400).json({ error: "User move is illegal" });
    }
    const userFen = makeFen(posAfterUser.toSetup());
    
    // Play solution move
    const solutionMoveParsed = parseUci(solutionMove);
    if (!solutionMoveParsed) {
      return res.status(400).json({ error: "Invalid solution move UCI" });
    }
    
    const posAfterSolution = position.clone();
    const solutionPlayResult = posAfterSolution.play(solutionMoveParsed);
    if (!solutionPlayResult.isOk) {
      return res.status(400).json({ error: "Solution move is illegal" });
    }
    const solutionFen = makeFen(posAfterSolution.toSetup());
    
    // Evaluate both positions from opponent's perspective
    // (flip the turn in FEN to evaluate from opponent's view)
    const flipFen = (fenStr) => {
      const parts = fenStr.split(" ");
      parts[1] = parts[1] === "w" ? "b" : "w"; // Flip turn
      return parts.join(" ");
    };
    
    const userEvalFen = flipFen(userFen);
    const solutionEvalFen = flipFen(solutionFen);
    
    // Analyze both positions
    const [userEval, solutionEval] = await Promise.all([
      EnginePool.analyze({
        fen: userEvalFen,
        depth: normalizedDepth,
        multiPv: 1,
      }),
      EnginePool.analyze({
        fen: solutionEvalFen,
        depth: normalizedDepth,
        multiPv: 1,
      }),
    ]);
    
    const userCp = scoreToCp(userEval.info?.score) ?? 0;
    const solutionCp = scoreToCp(solutionEval.info?.score) ?? 0;
    
    // Calculate evaluation difference (from opponent's perspective)
    // If user move is better for opponent (higher cp), it's worse for player
    // We want: |userCp - solutionCp| <= 30 (within threshold)
    const evalDiff = Math.abs(userCp - solutionCp);
    const threshold = 30; // From detectAgreement in moveEvaluation.js
    const isEquivalent = evalDiff <= threshold;
    
    // Check for mate outcomes
    const userIsMate = userEval.info?.score?.type === "mate";
    const solutionIsMate = solutionEval.info?.score?.type === "mate";
    
    // If both are mate, check if they're equivalent
    let isCorrect = isEquivalent;
    if (userIsMate && solutionIsMate) {
      // Both deliver mate - check if mate distance is similar
      const userMateVal = userEval.info.score.value;
      const solutionMateVal = solutionEval.info.score.value;
      // Mate values are negative for the side being mated
      // If both are mate, they're equivalent if same sign
      isCorrect = Math.sign(userMateVal) === Math.sign(solutionMateVal);
    } else if (userIsMate !== solutionIsMate) {
      // One is mate, other isn't - not equivalent
      isCorrect = false;
    }
    
    logger.info(
      { reqId, userCp, solutionCp, evalDiff, isCorrect, userIsMate, solutionIsMate },
      "puzzle_validation_complete"
    );
    
    return res.json({
      isCorrect,
      userCp,
      solutionCp,
      evalDiff,
      threshold,
      userIsMate,
      solutionIsMate,
      userFen,
      solutionFen,
    });
  } catch (error) {
    logger.error({ reqId, err: String(error), stack: error.stack }, "puzzle_validation_error");
    return res.status(500).json({
      error: "Validation failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// GET /api/health/engine
export async function engineHealth(req, res) {
  try {
    const status = EnginePool.getStatus();
    const response = {
      ready: status.ready,
      busy: status.busy,
      pid: status.pid,
    };
    
    // Add diagnostic info if engine is not ready
    if (!status.ready) {
      // Try to detect if binary exists
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const { dirname, join } = path;
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const projectRoot = join(__dirname, "../../..");
      const stockfishDir = join(projectRoot, "stockfish");
      
      const binaryCandidates = [
        join(stockfishDir, "stockfish-windows-x86-64-avx2.exe"),
        join(stockfishDir, "stockfish.exe"),
        join(stockfishDir, "stockfish"),
      ];
      
      const foundBinary = binaryCandidates.find(candidate => {
        try {
          return fs.existsSync(candidate);
        } catch {
          return false;
        }
      });
      
      response.diagnostic = {
        binaryFound: !!foundBinary,
        binaryPath: foundBinary || null,
        stockfishDir: stockfishDir,
        lastStdout: status.lastStdout?.slice(-5) || [],
      };
      
      // If binary found but engine not started, try to initialize it
      if (foundBinary && !status.pid && req.query.init === "true") {
        try {
          // Trigger engine initialization by calling ensureStarted
          EnginePool.ensureStarted();
          // Wait a moment for initialization and UCI handshake
          await new Promise(resolve => setTimeout(resolve, 2000));
          const newStatus = EnginePool.getStatus();
          response.pid = newStatus.pid;
          response.ready = newStatus.ready;
          response.initialized = true;
          response.lastStdout = newStatus.lastStdout?.slice(-10) || [];
          
          // If still not ready, check if there were errors
          if (!newStatus.ready && newStatus.pid) {
            response.warning = "Engine spawned but not ready yet - may need more time or check stderr";
          } else if (!newStatus.pid) {
            response.error = "Engine failed to spawn - check server logs for details";
          }
        } catch (error) {
          response.initError = error.message;
          response.initErrorStack = process.env.NODE_ENV === "development" ? error.stack : undefined;
        }
      }
    }
    
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      error: "Engine health check failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

