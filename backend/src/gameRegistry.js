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
      id: "trivia-blitz",
      version: "1.0.0",
      name: { default: "Trivia Blitz" },
      description: { default: "Fast-paced quiz game where speed and accuracy win. Answer questions faster than your friends!" },
      status: "stable",
      supportedPlayers: { min: 2, max: 12, recommended: 6 },
      monetization: "free",
      category: ["trivia", "party"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: [],
      visibleIf: ["public"],
      route: { slug: "trivia-blitz" },
      plugin: {
        previewComponent: "triviaBlitzPreview",
        moduleId: "@/games/trivia-blitz",
      },
      navigation: {
        category: "trivia",
        priority: 90,
      },
    },
    {
      id: "ping-pong",
      version: "1.0.0",
      name: { default: "Ping Pong" },
      description: { default: "Classic table tennis game. Play solo or challenge friends in real-time multiplayer!" },
      status: "stable",
      supportedPlayers: { min: 1, max: 2, recommended: 2 },
      monetization: "free",
      category: ["sports", "multiplayer"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: [],
      visibleIf: ["public"],
      route: { slug: "ping-pong" },
      plugin: {
        previewComponent: "pingPongPreview",
        moduleId: "@/games/ping-pong",
      },
      navigation: {
        category: "sports",
        priority: 75,
      },
    },
    {
      id: "chronicles-of-the-abyss",
      version: "1.0.0",
      name: { default: "Chronicles of the Abyss" },
      description: { default: "Embark on an epic dark fantasy text-based adventure. Explore ancient ruins, battle monsters, and uncover hidden secrets." },
      status: "stable",
      supportedPlayers: { min: 1, max: 1, recommended: 1 },
      monetization: "free",
      category: ["rpg", "adventure"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: [],
      visibleIf: ["public"],
      route: { slug: "chronicles-of-the-abyss" },
      plugin: {
        previewComponent: "rpgPreview",
        moduleId: "@/games/rpg",
      },
      navigation: {
        category: "adventure",
        priority: 80,
      },
    },
    {
      id: "canva",
      version: "0.1.0",
      name: { default: "Canva" },
      description: { default: "Collaborative drawing canvas. Draw together with friends in real-time!" },
      status: "stable",
      supportedPlayers: { min: 1, max: 10, recommended: 4 },
      monetization: "free",
      category: ["drawing", "creative"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: [],
      visibleIf: ["public"],
      route: { slug: "canva" },
      plugin: {
        previewComponent: "canvaPreview",
        moduleId: "@/games/canva",
      },
      navigation: {
        category: "creative",
        priority: 85,
      },
    },
  ],
});

let cachedRegistry = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

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
    return cachedRegistry;
  }

  if (forceRefresh) {
    debugLog("Force refresh requested, clearing cache");
  }

  const registry = await loadGitRegistry();
  cachedRegistry = registry;
  cachedAt = now;
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

