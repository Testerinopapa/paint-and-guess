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

export const logger = {
  error: (message, metadata) => logAtLevel("error", message, metadata),
  warn: (message, metadata) => logAtLevel("warn", message, metadata),
  info: (message, metadata) => logAtLevel("info", message, metadata),
  debug: (message, metadata) => logAtLevel("debug", message, metadata),
};
