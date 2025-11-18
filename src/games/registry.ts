import { fallbackGameRegistry } from "@/games/registry/fallback";
import { gameRegistryPayloadSchema, type GameRegistryEntry, type GameRegistryPayload } from "@/games/registry/schema";
import { isFeatureEnabled } from "@/lib/featureFlags";

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }) : undefined;

const DEFAULT_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60 * 1000;
const apiBaseUrl = (metaEnv?.env?.VITE_API_BASE_URL as string | undefined) ?? "";
const registryEndpoint = `${apiBaseUrl || ""}/api/games/registry`;

const DEBUG = Boolean(metaEnv?.env?.DEV || metaEnv?.env?.MODE === "development");

function debugLog(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.debug(`[Registry] ${message}`, ...args);
  }
}

let cachedRegistry: GameRegistryPayload | null = null;
let cacheTimestamp = 0;

async function fetchWithTimeout(input: RequestInfo | URL, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    debugLog(`Fetching registry from: ${input}`, { timeout: `${timeout}ms` });
    const fetchStart = Date.now();
    const response = await fetch(input, { signal: controller.signal });
    const fetchDuration = Date.now() - fetchStart;
    debugLog(`Fetch completed`, {
      status: response.status,
      statusText: response.statusText,
      duration: `${fetchDuration}ms`,
      ok: response.ok,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      debugLog(`Fetch timeout after ${timeout}ms`);
      throw new Error(`Registry request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestRegistry(): Promise<GameRegistryPayload> {
  debugLog(`Requesting registry from API`, { endpoint: registryEndpoint });
  const requestStart = Date.now();
  
  try {
    const response = await fetchWithTimeout(registryEndpoint);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response");
      console.error(`[Registry] API request failed`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200),
      });
      throw new Error(`Registry request failed with status ${response.status}: ${response.statusText}`);
    }

    const parseStart = Date.now();
    const payload = await response.json();
    const parseDuration = Date.now() - parseStart;
    debugLog(`Response parsed in ${parseDuration}ms`, {
      hasEntries: Array.isArray(payload.entries),
      entryCount: payload.entries?.length ?? 0,
    });

    debugLog(`Validating registry schema...`);
    const validationStart = Date.now();
    const parsed = gameRegistryPayloadSchema.parse(payload);
    const validationDuration = Date.now() - validationStart;
    debugLog(`Schema validation passed in ${validationDuration}ms`, {
      entryCount: parsed.entries.length,
      source: parsed.source,
    });

    const totalDuration = Date.now() - requestStart;
    debugLog(`Registry request completed successfully`, {
      totalDuration: `${totalDuration}ms`,
      source: parsed.source,
      entryCount: parsed.entries.length,
    });

    return {
      ...parsed,
      updatedAt: parsed.updatedAt.toISOString(),
    };
  } catch (error) {
    const totalDuration = Date.now() - requestStart;
    if (error instanceof Error) {
      console.error(`[Registry] Request failed after ${totalDuration}ms`, {
        error: error.message,
        endpoint: registryEndpoint,
      });
    }
    throw error;
  }
}

export async function loadGameRegistry(options: { forceRefresh?: boolean } = {}): Promise<GameRegistryPayload> {
  const now = Date.now();
  const cacheAge = cachedRegistry ? now - cacheTimestamp : Infinity;
  const shouldUseCache = !options.forceRefresh && cachedRegistry && cacheAge < CACHE_TTL_MS;

  debugLog(`loadGameRegistry called`, {
    forceRefresh: options.forceRefresh,
    hasCache: !!cachedRegistry,
    cacheAge: cachedRegistry ? `${cacheAge}ms` : "N/A",
    cacheValid: shouldUseCache,
    cacheTTL: `${CACHE_TTL_MS}ms`,
  });

  if (shouldUseCache && cachedRegistry) {
    debugLog(`Returning cached registry`, {
      source: cachedRegistry.source,
      entryCount: cachedRegistry.entries.length,
      cacheAge: `${cacheAge}ms`,
    });
    return cachedRegistry;
  }

  if (options.forceRefresh) {
    debugLog(`Force refresh requested, bypassing cache`);
  } else if (cachedRegistry) {
    debugLog(`Cache expired (age: ${cacheAge}ms > TTL: ${CACHE_TTL_MS}ms), fetching fresh registry`);
  } else {
    debugLog(`No cache available, fetching registry`);
  }

  try {
    const registry = await requestRegistry();
    cachedRegistry = registry;
    cacheTimestamp = Date.now();
    debugLog(`Registry cached successfully`, {
      source: registry.source,
      entryCount: registry.entries.length,
      entryIds: registry.entries.map((e) => e.id),
    });
    return registry;
  } catch (error) {
    console.warn("[Registry] Falling back to bundled registry", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: registryEndpoint,
    });
    debugLog(`Using fallback registry`, {
      entryCount: fallbackGameRegistry.entries.length,
      entryIds: fallbackGameRegistry.entries.map((e) => e.id),
    });
    cachedRegistry = fallbackGameRegistry;
    cacheTimestamp = Date.now();
    return fallbackGameRegistry;
  }
}

export function getVisibleGames(entries: GameRegistryEntry[]): GameRegistryEntry[] {
  debugLog(`getVisibleGames called`, { totalEntries: entries.length });
  const visible = entries.filter((entry) => {
    if (entry.featureFlag && !isFeatureEnabled(entry.featureFlag)) {
      debugLog(`Game filtered by feature flag`, {
        gameId: entry.id,
        featureFlag: entry.featureFlag,
        enabled: isFeatureEnabled(entry.featureFlag),
      });
      return false;
    }
    if (entry.status === "retired") {
      debugLog(`Game filtered by status`, { gameId: entry.id, status: entry.status });
      return false;
    }
    return true;
  });
  debugLog(`getVisibleGames result`, {
    total: entries.length,
    visible: visible.length,
    filtered: entries.length - visible.length,
    visibleIds: visible.map((e) => e.id),
  });
  return visible;
}

export function getCachedRegistry(): GameRegistryPayload {
  return cachedRegistry ?? fallbackGameRegistry;
}

export function getGameById(id: string): GameRegistryEntry | undefined {
  const registry = getCachedRegistry();
  return registry.entries.find((entry) => entry.id === id);
}

export const gameRegistry = fallbackGameRegistry.entries;

export type { GameRegistryEntry, GameRegistryPayload };

export default gameRegistry;

