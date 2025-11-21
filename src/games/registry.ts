import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { matchesTargeting, isFeatureEnabled } from "@/lib/featureFlags";
import { fallbackRegistry } from "./registry/fallback";
import { NormalizedGameEntry, RegistryResponse, registryResponseSchema } from "./registry/schema";
import { getPaintPreviewComponent } from "@/games/paint-and-guess/hubEntry";
import { getPingPongPreviewComponent } from "@/games/ping-pong/hubEntry";

const registryEndpoint = import.meta.env.VITE_GAME_REGISTRY_URL ?? "/api/games";
const CACHE_TTL_MS = 60 * 1000;
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_GAME_REGISTRY_DEBUG === "true";

let cachedRegistry: RegistryResponse | null = null;
let cacheTimestamp = 0;

export type HubGame = NormalizedGameEntry & {
  displayName: string;
  displayDescription: string;
  derivedRoute: string;
  isEnabled: boolean;
  PreviewComponent?: React.ComponentType;
  navLabel: string;
  navCategory: string;
  navPriority: number;
  navHidden: boolean;
};

function debugLog(message: string, detail?: Record<string, unknown>) {
  if (!DEBUG) return;
  if (detail) {
    console.debug(`[registry] ${message}`, detail);
  } else {
    console.debug(`[registry] ${message}`);
  }
}

function localizeCopy(localized: { default?: string; locales?: Record<string, string> }) {
  const fallback = localized.default ?? "";
  if (!localized.locales) return fallback;
  if (typeof navigator === "undefined") return fallback;
  const locale = navigator.language;
  if (localized.locales[locale]) return localized.locales[locale];
  const base = locale.split("-")[0];
  return localized.locales[base] ?? fallback;
}

function getPreviewComponent(entry: NormalizedGameEntry) {
  if (entry.plugin?.previewComponent === "paintPreview") {
    return getPaintPreviewComponent();
  }
  if (entry.plugin?.previewComponent === "pingPongPreview") {
    return getPingPongPreviewComponent();
  }
  return undefined;
}

function attachPlugin(entry: NormalizedGameEntry): HubGame {
  debugLog("Attaching plugin metadata", { id: entry.id, status: entry.status, flagCount: entry.featureFlags.length });
  const displayName = localizeCopy(entry.name);
  const displayDescription = localizeCopy(entry.description);
  const navCategory = entry.navigation?.category ?? entry.category?.[0] ?? "uncategorized";
  return {
    ...entry,
    displayName,
    displayDescription,
    derivedRoute: entry.route.path,
    isEnabled:
      entry.featureFlags.every((flag) => isFeatureEnabled(flag)) &&
      matchesTargeting(entry.visibleIf ?? []),
    PreviewComponent: getPreviewComponent(entry),
    navLabel: entry.navigation?.label ?? displayName ?? entry.id,
    navCategory,
    navPriority: entry.navigation?.priority ?? 0,
    navHidden: entry.navigation?.hidden ?? false,
  };
}

async function fetchRegistryFromCms(): Promise<RegistryResponse> {
  debugLog("Requesting registry from endpoint", { endpoint: registryEndpoint });
  const response = await fetch(registryEndpoint, { cache: "no-store" });
  if (!response.ok) {
    debugLog("Registry request failed", { status: response.status, statusText: response.statusText });
    throw new Error(`Failed to load registry: ${response.status}`);
  }
  const payload = await response.json();
  const parsed = registryResponseSchema.parse(payload);
  debugLog("Registry request succeeded", { entryCount: parsed.entries.length, source: parsed.source });
  return { ...parsed, source: parsed.source ?? "cms" };
}

function getFreshRegistry(): Promise<RegistryResponse> {
  const now = Date.now();
  if (cachedRegistry && now - cacheTimestamp < CACHE_TTL_MS) {
    debugLog("Returning cached CMS registry", {
      age: `${now - cacheTimestamp}ms`,
      entryCount: cachedRegistry.entries.length,
    });
    return Promise.resolve(cachedRegistry);
  }

  return fetchRegistryFromCms()
    .then((registry) => {
      cachedRegistry = registry;
      cacheTimestamp = now;
      debugLog("Cached CMS registry payload", { entryCount: registry.entries.length, updatedAt: registry.updatedAt });
      return registry;
    })
    .catch((error) => {
      debugLog("Falling back to baked registry", { error: error instanceof Error ? error.message : String(error) });
      console.warn("[registry] Falling back to baked config", error);
      cachedRegistry = fallbackRegistry;
      cacheTimestamp = now;
      return fallbackRegistry;
    });
}

export async function loadGameRegistry() {
  const registry = await getFreshRegistry();
  debugLog("Preparing hub entries", { entryCount: registry.entries.length, source: registry.source });
  return {
    entries: registry.entries.map(attachPlugin),
    source: registry.source ?? "fallback",
    updatedAt: registry.updatedAt,
  };
}

const fallbackGames = fallbackRegistry.entries.map(attachPlugin);

export function useGameRegistry() {
  const query = useQuery({
    queryKey: ["game-registry"],
    queryFn: loadGameRegistry,
    staleTime: CACHE_TTL_MS,
  });

  useEffect(() => {
    if (!DEBUG) return;
    debugLog("Query state updated", {
      status: query.status,
      isFetching: query.isFetching,
      error: query.error instanceof Error ? query.error.message : query.error ?? null,
    });
  }, [query.status, query.isFetching, query.error]);

  return useMemo(
    () => ({
      ...query,
      games: query.data?.entries ?? fallbackGames,
      source: query.data?.source ?? fallbackRegistry.source,
      updatedAt: query.data?.updatedAt ?? fallbackRegistry.updatedAt,
    }),
    [query],
  );
}

