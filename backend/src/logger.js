const LEVELS = ["error", "warn", "info", "debug"];
const currentLevel = process.env.LOG_LEVEL?.toLowerCase() ?? "info";
const threshold = LEVELS.indexOf(currentLevel);

function formatMessage(level, message, meta) {
  if (!meta || typeof meta !== "object") {
    return { level, msg: message };
  }
  return { level, msg: message, ...meta };
}

function log(level, message, meta) {
  const levelIndex = LEVELS.indexOf(level);
  if (levelIndex === -1 || (threshold !== -1 && levelIndex > threshold)) {
    return;
  }

  const payload = formatMessage(level, message, meta);
  // Use console methods to avoid adding new dependencies while keeping a consistent API.
  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export const logger = {
  error(meta, message) {
    log("error", message ?? meta, message ? meta : undefined);
  },
  warn(meta, message) {
    log("warn", message ?? meta, message ? meta : undefined);
  },
  info(meta, message) {
    log("info", message ?? meta, message ? meta : undefined);
  },
  debug(meta, message) {
    log("debug", message ?? meta, message ? meta : undefined);
  },
};
