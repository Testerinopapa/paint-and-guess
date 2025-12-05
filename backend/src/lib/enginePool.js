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
  // First, check for local Stockfish binary in project's stockfish folder
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

    const bin = findStockfishBinary();
    const reqId = `start-${Date.now()}`;

    if (this.backoffMs > 0) {
      const until = Date.now() + this.backoffMs;
      while (Date.now() < until) {
        // Simple sync backoff
      }
    }

    this.engine = spawn(bin);
    this.ready = false;
    logger.info({ reqId, bin, pid: this.engine.pid }, "spawned");

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
          logger.info({ reqId }, "ready");
        }
      }
    };

    this.engine.stdout.on("data", onData);
    this.engine.stderr.on("data", (c) => {
      logger.warn({ err: c.toString("utf8") }, "stderr");
    });
    this.engine.on("error", () => {
      this.bumpBackoff();
      this.reset();
    });
    this.engine.on("close", (code, signal) => {
      logger.warn({ code, signal }, "closed");
      this.bumpBackoff();
      this.reset();
    });

    try {
      this.engine.stdin.write("uci\n");
    } catch (e) {
      logger.error({ err: String(e) }, "write_failed");
    }
  }

  reset() {
    if (this.engine) {
      try {
        this.engine.kill();
      } catch {}
      this.engine = null;
    }
    this.ready = false;
    this.busy = false;
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

  runJob(job) {
    const { params, resolve, reject, reqId } = job;
    logger.debug({ reqId, params }, "job_start");

    let bestmove = null;
    let bestInfo = null;
    const infoLines = [];
    const multiMap = new Map();

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
          bestmove = line.split(" ")[1];
          finish();
        }
      }
    };

    const finish = () => {
      try {
        this.engine.stdout.off("data", onData);
      } catch {}
      const infosArr =
        multiMap.size > 0
          ? Array.from([...multiMap.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v))
          : undefined;
      const result = {
        bestmove,
        info: bestInfo,
        infos: infosArr,
        raw: infoLines.slice(-50),
        reqId,
      };
      logger.info({ reqId, bestmove }, "job_done");
      this.busy = false;
      resolve(result);
      setImmediate(() => this.pump());
    };

    this.engine.stdout.on("data", onData);

    try {
      // Hardening: conservative defaults
      this.engine.stdin.write(`setoption name Threads value 1\n`);
      this.engine.stdin.write(`setoption name Hash value 16\n`);
      if (params.limitStrength) {
        this.engine.stdin.write(`setoption name UCI_LimitStrength value true\n`);
        if (params.elo) {
          this.engine.stdin.write(`setoption name UCI_Elo value ${params.elo}\n`);
        }
      }
      const desiredMulti = Math.max(1, Math.min(10, params.multiPv ?? 1));
      this.engine.stdin.write(`setoption name MultiPV value ${desiredMulti}\n`);
      this.engine.stdin.write(`position fen ${params.fen}\n`);
      const goCmd =
        params.searchMoves && params.searchMoves.length > 0
          ? `go depth ${params.depth} searchmoves ${params.searchMoves.join(" ")}`
          : `go depth ${params.depth}`;
      this.engine.stdin.write(`${goCmd}\n`);
    } catch (e) {
      try {
        this.engine.stdout.off("data", onData);
      } catch {}
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

export default EnginePool;

