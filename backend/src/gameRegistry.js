import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.join(__dirname, "..", "data", "game-registry.json");

const statusSchema = z.enum(["alpha", "beta", "stable", "deprecated"]);
const monetizationSchema = z.enum(["free", "iap", "premium", "subscription"]);

const localizedStringSchema = z.object({
  default: z.string(),
  locales: z.record(z.string().min(2), z.string()).optional(),
});

const gameEntrySchema = z
  .object({
    id: z.string(),
    version: z.string(),
    name: localizedStringSchema,
    description: localizedStringSchema,
    status: statusSchema,
    supportedPlayers: z.object({
      min: z.number().int(),
      max: z.number().int(),
      recommended: z.number().int().optional(),
    }),
    monetization: monetizationSchema,
    category: z.array(z.string()).default([]),
    assets: z.object({
      thumbnail: z.string(),
      trailerUrl: z.string().url().optional(),
      patchNotesUrl: z.string().url().optional(),
    }),
    schedule: z
      .object({
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
      })
      .optional(),
    badges: z.array(z.string()).default([]),
    featureFlags: z.array(z.string()).default([]),
    visibleIf: z.array(z.string()).default([]),
    route: z
      .object({
        slug: z.string().optional(),
        path: z.string().optional(),
      })
      .default({}),
    metrics: z
      .object({
        concurrentUsers: z.number().int().optional(),
        uptimePercentage: z.number().optional(),
      })
      .optional(),
  })
  .transform((entry) => {
    const slug = entry.route.slug ?? entry.id;
    const routePath = entry.route.path ?? `/games/${slug}`;
    return {
      ...entry,
      route: { slug, path: routePath },
    };
  });

const registrySchema = z.object({
  updatedAt: z.string().datetime(),
  entries: z.array(gameEntrySchema),
  source: z.enum(["cms", "fallback", "git"]).default("git"),
});

const fallbackRegistry = registrySchema.parse({
  updatedAt: new Date().toISOString(),
  source: "fallback",
  entries: [
    {
      id: "paint-and-guess",
      version: "1.1.0",
      name: { default: "Paint & Guess" },
      description: { default: "Draw prompts, guess sketches, and keep the points flowing." },
      status: "stable",
      supportedPlayers: { min: 2, max: 12, recommended: 6 },
      monetization: "free",
      category: ["party", "drawing"],
      assets: {
        thumbnail: "/placeholder.svg",
        patchNotesUrl: "https://example.com/paint-and-guess/patch-notes",
      },
      badges: ["hot"],
      route: { slug: "paint-and-guess" },
      metrics: { concurrentUsers: 1200, uptimePercentage: 99.9 },
    },
    {
      id: "mystery-mashup",
      version: "0.3.0",
      name: { default: "Mystery Mashup" },
      description: { default: "A surprise party experience is brewing. Stay tuned!" },
      status: "beta",
      supportedPlayers: { min: 3, max: 8 },
      monetization: "premium",
      category: ["mystery"],
      schedule: { startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() },
      badges: ["beta", "limited"],
      assets: {
        thumbnail: "/placeholder.svg",
        trailerUrl: "https://example.com/mystery-mashup/trailer",
      },
      featureFlags: ["feature:mystery_beta"],
      visibleIf: ["cohort:beta"],
      route: { slug: "mystery-mashup" },
    },
    {
      id: "trivia-trails",
      version: "0.1.0",
      name: { default: "Trivia Trails", locales: { es: "Rutas de Trivias" } },
      description: {
        default: "Battle your friends with rapid-fire questions soon.",
        locales: { es: "Enfrenta a tus amigos con preguntas rápidas muy pronto." },
      },
      status: "alpha",
      supportedPlayers: { min: 2, max: 6, recommended: 4 },
      monetization: "iap",
      category: ["trivia"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: ["feature:trivia_alpha"],
      visibleIf: ["internal"],
      route: { slug: "trivia-trails" },
    },
	    {
	      id: "semantic-guess",
	      version: "0.1.0",
	      name: { default: "Semantic Guess" },
	      description: {
	        default: "Guess the daily word using semantic similarity hints.",
	      },
	      status: "beta",
	      supportedPlayers: { min: 1, max: 1, recommended: 1 },
	      monetization: "free",
	      category: ["word", "puzzle", "daily"],
	      badges: ["new", "daily"],
	      assets: {
	        thumbnail: "/placeholder.svg",
	      },
	      route: { slug: "semantic-guess" },
	    },
  ],
});

let cachedRegistry = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;
const DEBUG = process.env.LOG_LEVEL === "debug" || process.env.NODE_ENV === "development";

function debugLog(message, ...args) {
  if (DEBUG) {
    console.debug(`[GameRegistry] ${message}`, ...args);
  }
}

async function loadGitRegistry() {
  try {
    const file = await fs.readFile(registryPath, "utf-8");
    const data = JSON.parse(file);
    return registrySchema.parse({ ...data, source: "git" });
  } catch (error) {
    console.warn("[GameRegistry] Unable to read git-managed registry, using fallback", error);
    return fallbackRegistry;
  }
}

async function getRegistryInternal(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedRegistry && now - cachedAt < CACHE_TTL_MS) {
    debugLog("Serving registry from cache", { source: cachedRegistry.source, age: `${now - cachedAt}ms` });
    return cachedRegistry;
  }

  if (forceRefresh) {
    debugLog("Force refresh requested, clearing cache");
  }

  const registry = await loadGitRegistry();
  cachedRegistry = registry;
  cachedAt = now;
  debugLog("Registry cached", {
    entryCount: registry.entries.length,
    entryIds: registry.entries.map((entry) => entry.id),
  });
  return registry;
}

export async function getRegistry() {
  return getRegistryInternal(false);
}

export async function getRegistryResponse() {
  const registry = await getRegistryInternal(false);
  return {
    updatedAt: registry.updatedAt,
    source: registry.source,
    entries: registry.entries,
  };
}

export async function loadGameRegistry({ forceRefresh = false } = {}) {
  const registry = await getRegistryInternal(forceRefresh);
  return {
    updatedAt: registry.updatedAt,
    source: registry.source,
    entries: registry.entries,
  };
}

export async function refreshGameRegistry() {
  cachedRegistry = null;
  cachedAt = 0;
  return getRegistryInternal(true);
}

export async function getGameEntryById(gameId) {
  const registry = await getRegistryInternal(false);
  return registry.entries.find((entry) => entry.id === gameId) ?? null;
}

export function getRegistryPath() {
  return registryPath;
}

