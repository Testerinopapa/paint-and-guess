import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAME_REGISTRY_PATH = path.join(__dirname, "..", "data", "game-registry.json");
const CACHE_TTL_MS = 60 * 1000;

const gameRegistryEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  status: z.enum(["available", "coming-soon", "prototype", "retired"]).default("coming-soon"),
  route: z.string().default("#"),
  thumbnail: z.string().default("/placeholder.svg"),
  featureFlag: z.string().optional(),
  modes: z.array(z.string()).default([]),
  players: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
    })
    .partial()
    .default({}),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  cta: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
  metadata: z.record(z.unknown()).default({}),
});

const gameRegistrySchema = z.object({
  updatedAt: z.coerce.date().default(() => new Date()),
  source: z.string().default("git"),
  entries: z.array(gameRegistryEntrySchema),
});

const fallbackRegistry = {
  updatedAt: new Date().toISOString(),
  source: "fallback",
  entries: [
    {
      id: "paint-and-guess",
      name: "Paint & Guess",
      status: "available",
      description: "Draw prompts, guess quickly, and keep the energy high in live multiplayer rooms.",
      shortDescription: "Live party doodling",
      route: "/games/paint-and-guess",
      thumbnail: "/placeholder.svg",
      featureFlag: "games.paintAndGuess",
      modes: ["party", "live-multiplayer"],
      players: { min: 2, max: 12 },
      estimatedDurationMinutes: 20,
      tags: ["featured", "live"],
      technologies: ["React", "Fabric.js", "Socket.io"],
      metadata: {
        latencyBudgetMs: 200,
      },
      cta: {
        label: "Play now",
        href: "/games/paint-and-guess",
      },
    },
  ],
};

let cachedRegistry = null;
let lastLoadedAt = 0;

const DEBUG = process.env.LOG_LEVEL === "debug" || process.env.NODE_ENV === "development";

function debugLog(message, ...args) {
  if (DEBUG) {
    console.debug(`[GameRegistry] ${message}`, ...args);
  }
}

async function readRegistryFromDisk() {
  debugLog(`Reading registry from disk: ${GAME_REGISTRY_PATH}`);
  const startTime = Date.now();
  try {
    const payload = await fs.readFile(GAME_REGISTRY_PATH, "utf-8");
    const parseTime = Date.now() - startTime;
    debugLog(`File read completed in ${parseTime}ms, size: ${payload.length} bytes`);
    const parsed = JSON.parse(payload);
    debugLog(`JSON parsed successfully, entries count: ${parsed.entries?.length ?? 0}`);
    return parsed;
  } catch (error) {
    console.error(`[GameRegistry] Failed to read registry file: ${GAME_REGISTRY_PATH}`, {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

export async function loadGameRegistry({ forceRefresh = false } = {}) {
  const now = Date.now();
  const cacheAge = now - lastLoadedAt;
  const isCacheValid = cachedRegistry && cacheAge < CACHE_TTL_MS;

  debugLog(`loadGameRegistry called`, {
    forceRefresh,
    hasCache: !!cachedRegistry,
    cacheAge: `${cacheAge}ms`,
    cacheValid: isCacheValid,
    cacheTTL: `${CACHE_TTL_MS}ms`,
  });

  if (!forceRefresh && isCacheValid) {
    debugLog(`Returning cached registry (age: ${cacheAge}ms)`, {
      source: cachedRegistry.source,
      entryCount: cachedRegistry.entries?.length ?? 0,
    });
    return cachedRegistry;
  }

  if (forceRefresh) {
    debugLog(`Force refresh requested, clearing cache`);
  } else if (cachedRegistry) {
    debugLog(`Cache expired (age: ${cacheAge}ms > TTL: ${CACHE_TTL_MS}ms), reloading`);
  }

  try {
    const rawData = await readRegistryFromDisk();
    debugLog(`Validating registry schema...`);
    const validationStart = Date.now();
    const parsed = gameRegistrySchema.parse(rawData);
    const validationTime = Date.now() - validationStart;
    debugLog(`Schema validation passed in ${validationTime}ms`, {
      entryCount: parsed.entries.length,
      source: parsed.source,
      updatedAt: parsed.updatedAt,
    });

    cachedRegistry = {
      ...parsed,
      updatedAt: parsed.updatedAt.toISOString(),
    };
    lastLoadedAt = Date.now();
    debugLog(`Registry loaded and cached successfully`, {
      source: cachedRegistry.source,
      entryCount: cachedRegistry.entries.length,
      entryIds: cachedRegistry.entries.map((e) => e.id),
    });
    return cachedRegistry;
  } catch (error) {
    if (error.name === "ZodError") {
      console.error(`[GameRegistry] Schema validation failed:`, {
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    } else {
      console.error(`[GameRegistry] Unexpected error loading registry:`, {
        error: error.message,
        stack: error.stack,
      });
    }

    console.warn(`[GameRegistry] Falling back to bundled registry`);
    try {
      const parsedFallback = gameRegistrySchema.parse(fallbackRegistry);
      cachedRegistry = {
        ...parsedFallback,
        updatedAt: parsedFallback.updatedAt.toISOString(),
        source: "fallback",
      };
      lastLoadedAt = Date.now();
      debugLog(`Fallback registry loaded`, {
        entryCount: cachedRegistry.entries.length,
        entryIds: cachedRegistry.entries.map((e) => e.id),
      });
      return cachedRegistry;
    } catch (fallbackError) {
      console.error(`[GameRegistry] CRITICAL: Fallback registry also failed validation!`, fallbackError);
      throw new Error("Both primary and fallback registries failed validation");
    }
  }
}

export async function refreshGameRegistry() {
  debugLog(`refreshGameRegistry called, clearing cache`);
  cachedRegistry = null;
  lastLoadedAt = 0;
  return loadGameRegistry({ forceRefresh: true });
}

export async function getGameEntryById(gameId) {
  debugLog(`getGameEntryById called`, { gameId });
  const registry = await loadGameRegistry();
  const entry = registry.entries.find((entry) => entry.id === gameId) ?? null;
  if (entry) {
    debugLog(`Game entry found`, { gameId, name: entry.name });
  } else {
    debugLog(`Game entry not found`, { gameId, availableIds: registry.entries.map((e) => e.id) });
  }
  return entry;
}

export function getRegistryPath() {
  return GAME_REGISTRY_PATH;
}

