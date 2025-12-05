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

// GET /api/health/engine
export async function engineHealth(req, res) {
  try {
    const status = EnginePool.getStatus();
    return res.json({
      ready: status.ready,
      busy: status.busy,
      pid: status.pid,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Engine health check failed",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

