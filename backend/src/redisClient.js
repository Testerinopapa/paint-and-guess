import Redis from "ioredis";
import { EventEmitter } from "events";

// Increase default max listeners globally for Redis sockets
// This prevents MaxListenersExceededWarning for internal Socket objects
EventEmitter.defaultMaxListeners = Math.max(EventEmitter.defaultMaxListeners || 10, 20);

// Suppress MaxListenersExceededWarning for Socket objects when Redis connection fails
// This is expected behavior when Redis isn't running - we handle it gracefully
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  // Suppress MaxListenersExceededWarning for Socket objects when Redis is enabled but not running
  const warningStr = typeof warning === 'string' ? warning : (warning?.message || String(warning));
  const warningName = warning?.name || '';
  
  if (
    (warningStr.includes('MaxListenersExceededWarning') || warningName === 'MaxListenersExceededWarning') &&
    (warningStr.includes('Socket') || warningStr.includes('close listeners')) &&
    (process.env.REDIS_ENABLED === 'true' || process.env.REDIS_URL)
  ) {
    // This is expected when Redis connection fails - we handle it gracefully
    // The warning is harmless since we properly disconnect and clean up
    return;
  }
  // Call original emitWarning for all other warnings
  return originalEmitWarning.call(this, warning, ...args);
};

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);
const REDIS_URL = process.env.REDIS_URL; // Full Redis URL (overrides individual settings)

// Determine if Redis should be enabled
// Enable if REDIS_ENABLED is explicitly "true" OR if REDIS_URL is set
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true" || Boolean(REDIS_URL);

let redisClient = null;
let redisSubscriber = null;
let redisPublisher = null;

/**
 * Create Redis client connection
 */
function createRedisClient() {
  if (!REDIS_ENABLED) {
    return null;
  }

  let config;
  if (REDIS_URL) {
    // If using URL, parse it and add our config options
    config = REDIS_URL;
  } else {
    config = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
      retryStrategy: (times) => {
        // Limit retries to prevent infinite reconnection attempts
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false, // Connect immediately
      connectTimeout: 3000, // 3 second timeout
      enableOfflineQueue: false, // Don't queue commands when disconnected
      showFriendlyErrorStack: false,
    };
  }

  const client = new Redis(config);
  
  // Increase max listeners to prevent warnings (Redis clients can have many listeners)
  // This prevents the MaxListenersExceededWarning
  client.setMaxListeners(20);
  
  // Set max listeners on the socket stream as soon as it's available
  // This prevents warnings about Socket listeners (internal to ioredis)
  const setSocketMaxListeners = () => {
    if (client.stream && typeof client.stream.setMaxListeners === 'function') {
      client.stream.setMaxListeners(20);
    }
    // Also check for the socket property (different versions of ioredis)
    if (client.connector && client.connector.stream) {
      if (typeof client.connector.stream.setMaxListeners === 'function') {
        client.connector.stream.setMaxListeners(20);
      }
    }
  };
  
  // Set immediately if stream already exists
  setSocketMaxListeners();
  
  // Set when connection is established
  client.once("connect", setSocketMaxListeners);
  
  // Also set on ready (in case stream is created later)
  client.once("ready", setSocketMaxListeners);
  
  // Use a small delay to catch socket creation
  setTimeout(setSocketMaxListeners, 100);
  
  return client;
}

/**
 * Initialize Redis connections
 * Returns { client, subscriber, publisher } or null if Redis is disabled
 */
export async function initializeRedis() {
  if (!REDIS_ENABLED) {
    console.log("[Redis] Redis is disabled (REDIS_ENABLED=false or REDIS_URL not set)");
    return null;
  }

  let connectionFailed = false;
  let errorLogged = false;

  try {
    redisClient = createRedisClient();
    redisSubscriber = createRedisClient();
    redisPublisher = createRedisClient();

    // Set up error handlers before connecting
    [redisClient, redisSubscriber, redisPublisher].forEach((client, index) => {
      const name = ["client", "subscriber", "publisher"][index];
      client.on("error", (error) => {
        // Only log connection errors once
        if (errorLogged) {
          return; // Already logged, suppress further errors
        }
        
        // Check if it's a connection refused error (Redis not running)
        if (error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED") || 
            (error.errors && error.errors.some(e => e.code === "ECONNREFUSED"))) {
          console.warn(`[Redis] ⚠️  Cannot connect to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
          console.warn(`[Redis]    Redis is not running. Server will continue in single-instance mode.`);
          console.warn(`[Redis]    To enable Redis: Start Redis server or set REDIS_ENABLED=false to disable.`);
          errorLogged = true;
          connectionFailed = true;
          // Disconnect clients to stop retry attempts and remove listeners
          try {
            client.removeAllListeners();
            client.disconnect(false); // false = don't reconnect
          } catch (e) {
            // Ignore disconnect errors
          }
        } else {
          // Other errors - log once
          console.error(`[Redis] ${name} error:`, error.message || error);
          errorLogged = true;
        }
      });
      client.on("connect", () => {
        if (!connectionFailed) {
          console.log(`[Redis] ${name} connected`);
        }
      });
      client.on("ready", () => {
        if (!connectionFailed) {
          console.log(`[Redis] ${name} ready`);
        }
      });
      client.on("close", () => {
        // Only log if we were actually connected
        if (!connectionFailed) {
          console.log(`[Redis] ${name} connection closed`);
        }
      });
    });

    // ioredis connects automatically when instantiated
    // Wait for ready state with timeout - but don't block too long
    const waitForReady = (client, name) => {
      return new Promise((resolve, reject) => {
        if (client.status === "ready") {
          resolve();
          return;
        }
        
        // Short timeout - fail fast if Redis isn't available
        const timeout = setTimeout(() => {
          // If connection failed or timed out, disconnect and reject
          if (client.status === "end" || client.status === "close" || client.status === "end") {
            try {
              client.disconnect(false);
            } catch (e) {
              // Ignore
            }
            reject(new Error(`Redis ${name} connection failed`));
          } else {
            // Still trying to connect - disconnect and fail
            try {
              client.disconnect(false);
            } catch (e) {
              // Ignore
            }
            reject(new Error(`Redis ${name} connection timeout`));
          }
        }, 2000); // 2 second timeout - fail fast
        
        client.once("ready", () => {
          clearTimeout(timeout);
          resolve();
        });
        
        // If we get an error, disconnect immediately and reject
        client.once("error", (err) => {
          clearTimeout(timeout);
          try {
            client.disconnect(false);
          } catch (e) {
            // Ignore
          }
          // Don't reject here - let timeout handle it to avoid duplicate errors
        });
      });
    };

    try {
      await Promise.all([
        waitForReady(redisClient, "client"),
        waitForReady(redisSubscriber, "subscriber"),
        waitForReady(redisPublisher, "publisher"),
      ]);
    } catch (error) {
      // If connection fails, disconnect all clients to stop retry attempts
      [redisClient, redisSubscriber, redisPublisher].forEach((client) => {
        if (client) {
          try {
            // Remove all listeners to prevent memory leaks
            client.removeAllListeners();
            // Disconnect and don't reconnect
            client.disconnect(false); // false = don't reconnect
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      throw error;
    }

    const connectionInfo = REDIS_URL ? REDIS_URL : `${REDIS_HOST}:${REDIS_PORT}`;
    console.log(`[Redis] ✅ Connected to Redis at ${connectionInfo}`);
    return {
      client: redisClient,
      subscriber: redisSubscriber,
      publisher: redisPublisher,
    };
  } catch (error) {
    // Clean up any partially created clients
    [redisClient, redisSubscriber, redisPublisher].forEach((client) => {
      if (client) {
        try {
          // Remove all listeners to prevent memory leaks
          client.removeAllListeners();
          // Disconnect and don't reconnect
          client.disconnect(false); // false = don't reconnect
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
    redisClient = null;
    redisSubscriber = null;
    redisPublisher = null;
    
    // Only log if we haven't already logged the connection error
    if (!errorLogged) {
      console.warn("[Redis] ❌ Failed to connect to Redis");
      console.warn("[Redis] Server will continue without Redis (single-instance mode)");
    }
    return null;
  }
}

/**
 * Get Redis client (for direct Redis operations)
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Get Redis subscriber (for Socket.io adapter)
 */
export function getRedisSubscriber() {
  return redisSubscriber;
}

/**
 * Get Redis publisher (for Socket.io adapter)
 */
export function getRedisPublisher() {
  return redisPublisher;
}

/**
 * Check if Redis is enabled and connected
 */
export function isRedisEnabled() {
  return REDIS_ENABLED && redisClient && (redisClient.status === "ready" || redisClient.status === "connect");
}

/**
 * Gracefully shutdown Redis connections
 */
export async function shutdownRedis() {
  if (!redisClient) {
    return;
  }

  try {
    const quitPromises = [];
    
    // Only try to quit if client is connected
    [redisClient, redisSubscriber, redisPublisher].forEach((client, index) => {
      if (client && (client.status === "ready" || client.status === "connect" || client.status === "connecting")) {
        quitPromises.push(
          client.quit().catch((err) => {
            // Ignore errors if connection is already closed
            if (err.message?.includes("Connection is closed") || err.message?.includes("Connection closed")) {
              return; // Expected, connection was already closed
            }
            throw err;
          })
        );
      } else if (client) {
        // Client exists but not connected, just disconnect
        client.disconnect();
      }
    });

    if (quitPromises.length > 0) {
      await Promise.all(quitPromises);
      console.log("[Redis] ✅ All connections closed");
    } else {
      // All clients were already disconnected
      [redisClient, redisSubscriber, redisPublisher].forEach((client) => {
        if (client) {
          client.disconnect();
        }
      });
    }
  } catch (error) {
    // Ignore shutdown errors - connections may already be closed
    if (!error.message?.includes("Connection is closed") && !error.message?.includes("Connection closed")) {
      console.error("[Redis] Error during shutdown:", error);
    }
    // Ensure clients are disconnected even if quit() failed
    [redisClient, redisSubscriber, redisPublisher].forEach((client) => {
      if (client) {
        try {
          client.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    });
  }
}

// Handle process termination
process.on("SIGINT", shutdownRedis);
process.on("SIGTERM", shutdownRedis);
process.on("beforeExit", shutdownRedis);

