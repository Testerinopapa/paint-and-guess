import { spawn } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger helper
const logger = {
  info: (metadata, message) => {
    console.log(`[EnginePool] ${message}`, metadata || "");
  },
  warn: (metadata, message) => {
    console.warn(`[EnginePool] ${message}`, metadata || "");
  },
  error: (metadata, message) => {
    console.error(`[EnginePool] ${message}`, metadata || "");
  },
  debug: (metadata, message) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[EnginePool] ${message}`, metadata || "");
    }
  },
};

function isExecutable(p) {
  try {
    // On Windows, .exe files don't need X_OK, just check if file exists
    if (process.platform === "win32" && p.endsWith(".exe")) {
      return fs.existsSync(p);
    }
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findStockfishBinary() {
  // First, check for Docker path (production deployment)
  const dockerPath = "/app/stockfish/stockfish";
  if (fs.existsSync(dockerPath) && isExecutable(dockerPath)) {
    logger.info({ path: dockerPath }, "Found Docker Stockfish binary");
    return dockerPath;
  }

  // Then, check for local Stockfish binary in project's stockfish folder
  // This takes priority over system installations
  const projectRoot = join(__dirname, "../../..");
  const localStockfishCandidates = [
    join(projectRoot, "stockfish", "stockfish-windows-x86-64-avx2.exe"), // Windows AVX2
    join(projectRoot, "stockfish", "stockfish.exe"), // Generic Windows
    join(projectRoot, "stockfish", "stockfish"), // Linux/macOS
    join(projectRoot, "stockfish", "stockfish-windows-x86-64.exe"), // Windows x86-64
    join(projectRoot, "stockfish", "stockfish-windows-x86-64-modern.exe"), // Windows modern
  ];

  for (const candidate of localStockfishCandidates) {
    try {
      if (fs.existsSync(candidate) && isExecutable(candidate)) {
        logger.info({ path: candidate }, "Found local Stockfish binary");
        return candidate;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Fallback to system PATH and common installation paths
  const systemCandidates = [
    "stockfish", // System PATH
    "/usr/bin/stockfish",
    "/usr/local/bin/stockfish",
    "/opt/homebrew/bin/stockfish", // macOS Homebrew
    "C:\\Program Files\\Stockfish\\stockfish.exe", // Windows
    "C:\\stockfish\\stockfish.exe",
  ];

  for (const candidate of systemCandidates) {
    try {
      if (isExecutable(candidate)) {
        logger.info({ path: candidate }, "Found system Stockfish binary");
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Try to find in node_modules if installed
  try {
    const possiblePath = join(__dirname, "../../node_modules/stockfishjs/bin/stockfish");
    if (fs.existsSync(possiblePath) && isExecutable(possiblePath)) {
      logger.info({ path: possiblePath }, "Found node_modules Stockfish binary");
      return possiblePath;
    }
  } catch {}

  throw new Error(
    "Stockfish binary not found. Please ensure stockfish-windows-x86-64-avx2.exe exists in the stockfish/ folder, " +
    "or install Stockfish system-wide and ensure it's in your PATH."
  );
}

class EnginePoolImpl {
  constructor() {
    this.engine = null;
    this.ready = false;
    this.busy = false;
    this.queue = [];
    this.lastStdoutLines = [];
    this.activeDedupe = new Map();
    this.backoffMs = 0;
    this.optionsInitialized = false;
    this.currentJob = null; // Track active job for timeout handling
    this.jobTimeout = null; // Timeout timer for current job
  }

  getStatus() {
    return {
      ready: this.ready,
      busy: this.busy,
      pid: this.engine?.pid ?? null,
      lastStdout: this.lastStdoutLines.slice(-10),
    };
  }

  ensureStarted() {
    if (this.engine) return;

    let bin;
    try {
      bin = findStockfishBinary();
    } catch (error) {
      logger.error({ err: String(error) }, "binary_not_found");
      throw error;
    }

    const reqId = `start-${Date.now()}`;

    if (this.backoffMs > 0) {
      const until = Date.now() + this.backoffMs;
      while (Date.now() < until) {
        // Simple sync backoff
      }
    }

    try {
      this.engine = spawn(bin);
      this.ready = false;
      this.optionsInitialized = false;
      logger.info({ reqId, bin, pid: this.engine.pid }, "spawned");
    } catch (error) {
      logger.error({ reqId, err: String(error), bin }, "spawn_failed");
      throw error;
    }

    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue;
        this.lastStdoutLines.push(line);
        if (this.lastStdoutLines.length > 100) {
          this.lastStdoutLines.shift();
        }
        if (line === "uciok") {
          this.ready = true;
          this.initializeOptions(reqId);
          logger.info({ reqId }, "ready");
        }
      }
    };

    this.engine.stdout.on("data", onData);
    this.engine.stderr.on("data", (c) => {
      const errText = c.toString("utf8");
      this.lastStdoutLines.push(`[stderr] ${errText}`);
      if (this.lastStdoutLines.length > 100) {
        this.lastStdoutLines.shift();
      }
      logger.warn({ err: errText }, "stderr");
    });
    this.engine.on("error", (error) => {
      logger.error({ err: String(error), code: error.code }, "engine_error");
      this.bumpBackoff();
      this.reset();
    });
    this.engine.on("close", (code, signal) => {
      logger.warn({ code, signal, pid: this.engine?.pid }, "closed");
      this.bumpBackoff();
      this.reset();
    });

    try {
      this.engine.stdin.write("uci\n");
    } catch (e) {
      logger.error({ err: String(e) }, "write_failed");
    }
  }

  initializeOptions(reqId) {
    if (this.optionsInitialized) return;
    
    try {
      // Set base options once at initialization - these don't need to change
      // Use conservative settings for API stability
      this.engine.stdin.write(`setoption name Threads value 1\n`);
      this.engine.stdin.write(`setoption name Hash value 64\n`); // Increased from 16 to 64 for better performance
      // Don't set LimitStrength here - it changes per request based on elo
      this.optionsInitialized = true;
      logger.info({ reqId }, "options_initialized");
    } catch (e) {
      logger.error({ reqId, err: String(e) }, "options_init_failed");
    }
  }

  reset() {
    // Clear any active timeout
    if (this.jobTimeout) {
      clearTimeout(this.jobTimeout);
      this.jobTimeout = null;
    }
    this.currentJob = null;
    
    if (this.engine) {
      try {
        this.engine.kill();
      } catch {}
      this.engine = null;
    }
    this.ready = false;
    this.busy = false;
    this.optionsInitialized = false;
    while (this.queue.length) {
      const q = this.queue.shift();
      q.reject(new Error("Engine unavailable"));
    }
  }

  bumpBackoff() {
    // Exponential backoff up to 2s
    this.backoffMs = Math.min(2000, this.backoffMs > 0 ? this.backoffMs * 2 : 200);
  }

  analyze(params) {
    const key = `${params.fen}|d${params.depth}|e${params.elo ?? "-"}|sm${params.searchMoves?.join(",") ?? "-"}|mpv${params.multiPv ?? 1}`;
    const now = Date.now();
    const existing = this.activeDedupe.get(key);
    if (existing && now - existing.ts < 5000) {
      return existing.promise;
    }

    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const promise = new Promise((resolve, reject) => {
      this.queue.push({ params, resolve, reject, reqId });
      this.pump();
    });

    this.activeDedupe.set(key, { ts: now, promise });
    setTimeout(() => {
      if (this.activeDedupe.get(key)?.ts === now) {
        this.activeDedupe.delete(key);
      }
    }, 6000);

    return promise;
  }

  pump() {
    if (this.busy || this.queue.length === 0) return;
    this.busy = true;
    this.ensureStarted();

    if (!this.ready) {
      setTimeout(() => {
        this.busy = false;
        this.pump();
      }, 100);
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      this.busy = false;
      return;
    }

    this.runJob(job);
  }

  // Calculate movetime from depth - approximate conversion
  // Depth-based estimates: depth 4 ~1s, depth 6 ~2s, depth 8 ~5s, depth 12 ~15s
  // We add a safety margin and cap at 25s for API timeout (30s client timeout)
  calculateMovetime(depth) {
    const depthTimeMap = {
      1: 500, 2: 800, 3: 1000, 4: 1500,
      5: 2000, 6: 3000, 7: 5000, 8: 8000,
      9: 12000, 10: 15000, 11: 18000, 12: 20000,
      13: 22000, 14: 24000, 15: 25000, 16: 25000,
      17: 25000, 18: 25000, 19: 25000, 20: 25000,
    };
    return depthTimeMap[Math.min(depth, 20)] || 25000;
  }

  runJob(job) {
    const { params, resolve, reject, reqId } = job;
    logger.debug({ reqId, params }, "job_start");

    // Clear any existing timeout
    if (this.jobTimeout) {
      clearTimeout(this.jobTimeout);
      this.jobTimeout = null;
    }

    this.currentJob = job;
    let bestmove = null;
    let bestInfo = null;
    let finished = false;
    const infoLines = [];
    const multiMap = new Map();
    const jobStartTime = Date.now();

    // Calculate movetime from depth for predictable timing
    const movetimeMs = this.calculateMovetime(params.depth);
    const serverTimeoutMs = 25000; // 25 seconds - leave 5s buffer for client timeout

    const finish = (timedOut = false) => {
      if (finished) return;
      finished = true;

      // Clear timeout
      if (this.jobTimeout) {
        clearTimeout(this.jobTimeout);
        this.jobTimeout = null;
      }

      try {
        this.engine.stdout.off("data", onData);
      } catch {}
      
      const jobDuration = Date.now() - jobStartTime;
      this.currentJob = null;
      this.busy = false;

      const infosArr =
        multiMap.size > 0
          ? Array.from([...multiMap.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v))
          : undefined;
      
      const result = {
        bestmove: bestmove || (bestInfo?.pv?.[0] || null), // Use PV[0] if no bestmove yet
        info: bestInfo,
        infos: infosArr,
        raw: infoLines.slice(-50),
        reqId,
        timedOut,
        duration: jobDuration,
      };

      if (timedOut) {
        logger.warn({ reqId, duration: jobDuration, bestmove: result.bestmove }, "job_timeout");
        // Still resolve with best move found so far, don't reject
        resolve(result);
      } else {
        logger.info({ reqId, bestmove, duration: jobDuration }, "job_done");
        resolve(result);
      }
      
      setImmediate(() => this.pump());
    };

    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue;
        if (line.startsWith("info ")) {
          infoLines.push(line);
          const parsed = parseInfoLine(line);
          if (parsed) {
            if (parsed.multipv != null) {
              multiMap.set(parsed.multipv, parsed);
              if (parsed.multipv === 1) bestInfo = parsed;
            } else {
              bestInfo = parsed;
            }
          }
        }
        if (line.startsWith("bestmove ")) {
          const parts = line.split(" ");
          bestmove = parts[1];
          if (bestmove === "(none)" || !bestmove) {
            // Handle edge case where Stockfish returns no move
            bestmove = null;
          }
          finish(false);
          return;
        }
      }
    };

    this.engine.stdout.on("data", onData);

    // Set up server-side timeout
    this.jobTimeout = setTimeout(() => {
      if (!finished) {
        logger.warn({ reqId, duration: serverTimeoutMs }, "job_timeout_triggered");
        try {
          // Send stop command to Stockfish
          this.engine.stdin.write("stop\n");
        } catch (e) {
          logger.error({ reqId, err: String(e) }, "stop_command_failed");
        }
        // Give it 1 second to respond to stop, then finish
        setTimeout(() => {
          finish(true);
        }, 1000);
      }
    }, serverTimeoutMs);

    try {
      // Only set options that can change per request
      // Base options (Threads, Hash) are set once at initialization
      if (params.limitStrength) {
        this.engine.stdin.write(`setoption name UCI_LimitStrength value true\n`);
        if (params.elo) {
          this.engine.stdin.write(`setoption name UCI_Elo value ${params.elo}\n`);
        }
      } else {
        // Disable strength limiting if not needed
        this.engine.stdin.write(`setoption name UCI_LimitStrength value false\n`);
      }
      
      const desiredMulti = Math.max(1, Math.min(10, params.multiPv ?? 1));
      this.engine.stdin.write(`setoption name MultiPV value ${desiredMulti}\n`);
      
      this.engine.stdin.write(`position fen ${params.fen}\n`);
      
      // Use time-based search for predictable timing
      // movetime is in milliseconds
      let goCmd;
      if (params.searchMoves && params.searchMoves.length > 0) {
        goCmd = `go movetime ${movetimeMs} searchmoves ${params.searchMoves.join(" ")}`;
      } else {
        goCmd = `go movetime ${movetimeMs}`;
      }
      
      this.engine.stdin.write(`${goCmd}\n`);
      logger.debug({ reqId, movetime: movetimeMs, depth: params.depth }, "search_started");
    } catch (e) {
      try {
        this.engine.stdout.off("data", onData);
      } catch {}
      if (this.jobTimeout) {
        clearTimeout(this.jobTimeout);
        this.jobTimeout = null;
      }
      this.currentJob = null;
      this.busy = false;
      reject(new Error("Engine write failed"));
      setImmediate(() => this.pump());
    }
  }
}

function parseInfoLine(line) {
  // Parse Stockfish info line: info depth 10 seldepth 12 multipv 1 score cp 25 nodes 12345 nps 1000000 pv e2e4 e7e5
  const parts = line.split(" ");
  const result = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "depth" && parts[i + 1]) {
      result.depth = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "seldepth" && parts[i + 1]) {
      result.seldepth = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "multipv" && parts[i + 1]) {
      result.multipv = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "score") {
      if (parts[i + 1] === "cp" && parts[i + 2]) {
        result.score = { type: "cp", value: parseInt(parts[i + 2], 10) };
      } else if (parts[i + 1] === "mate" && parts[i + 2]) {
        result.score = { type: "mate", value: parseInt(parts[i + 2], 10) };
      }
    } else if (parts[i] === "nodes" && parts[i + 1]) {
      result.nodes = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "nps" && parts[i + 1]) {
      result.nps = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "time" && parts[i + 1]) {
      result.timeMs = parseInt(parts[i + 1], 10);
    } else if (parts[i] === "pv") {
      result.pv = parts.slice(i + 1);
      break;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

const EnginePool = new EnginePoolImpl();

// Expose ensureStarted for manual initialization
EnginePool.ensureStarted = EnginePool.ensureStarted.bind(EnginePool);

export default EnginePool;

