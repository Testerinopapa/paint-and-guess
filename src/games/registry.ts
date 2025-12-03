import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { matchesTargeting, isFeatureEnabled } from "@/lib/featureFlags";
import { fallbackRegistry } from "./registry/fallback";
import { NormalizedGameEntry, RegistryResponse, registryResponseSchema } from "./registry/schema";
import { getPaintPreviewComponent, getPaintPreviewEntry } from "@/games/paint-and-guess/hubEntry";
import { getPingPongPreviewComponent, getPingPongPreviewEntry } from "@/games/ping-pong/hubEntry";
import { getRpgPreviewComponent, getRpgPreviewEntry } from "@/games/rpg/hubEntry";
import { getTriviaBlitzPreviewComponent, getTriviaBlitzPreviewEntry } from "@/games/trivia-blitz/hubEntry";
import { getCanvaPreviewComponent, getCanvaPreviewEntry } from "@/games/canva/hubEntry";
import { apiPath } from "@/config/api";

const registryEndpoint = import.meta.env.VITE_GAME_REGISTRY_URL ?? apiPath("/api/games");
const CACHE_TTL_MS = 60 * 1000;
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
  if (entry.plugin?.previewComponent === "rpgPreview") {
    return getRpgPreviewComponent();
  }
  if (entry.plugin?.previewComponent === "triviaBlitzPreview") {
    return getTriviaBlitzPreviewComponent();
  }
  if (entry.plugin?.previewComponent === "canvaPreview") {
    return getCanvaPreviewComponent();
  }
  return undefined;
}

function normalizeRoutePath(path: string): string {
  // If path starts with /games/, prepend /hub
  if (path.startsWith("/games/") && !path.startsWith("/hub/games/")) {
    return `/hub${path}`;
  }
  // If path doesn't start with /hub/games/, construct it from the path
  if (!path.startsWith("/hub/games/")) {
    // Extract slug from path (e.g., "/games/trivia-blitz" -> "trivia-blitz")
    const slug = path.replace(/^\/games\//, "").replace(/^\//, "");
    return `/hub/games/${slug}`;
  }
  return path;
}

// Map of game IDs to their local hubEntry functions for asset overrides
const localHubEntries: Record<string, () => NormalizedGameEntry> = {
  "trivia-blitz": getTriviaBlitzPreviewEntry,
  "canva": getCanvaPreviewEntry,
  "paint-and-guess": getPaintPreviewEntry,
  "ping-pong": getPingPongPreviewEntry,
  "chronicles-of-the-abyss": getRpgPreviewEntry, // RPG game ID
};

function attachPlugin(entry: NormalizedGameEntry): HubGame {
  
  // Get local hubEntry if it exists to override assets
  const localEntry = localHubEntries[entry.id]?.();
  
  // Merge assets: prefer local assets if they exist and provide better images
  // (either have background image, or thumbnail is not placeholder)
  const assets = localEntry?.assets && (
    localEntry.assets.background || 
    localEntry.assets.thumbnail !== "/placeholder.svg"
  )
    ? localEntry.assets
    : entry.assets;
  
  const displayName = localizeCopy(entry.name);
  const displayDescription = localizeCopy(entry.description);
  const navCategory = entry.navigation?.category ?? entry.category?.[0] ?? "uncategorized";
  const normalizedRoute = normalizeRoutePath(entry.route.path);
  return {
    ...entry,
    assets, // Use merged/overridden assets
    displayName,
    displayDescription,
    derivedRoute: normalizedRoute,
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
  const response = await fetch(registryEndpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load registry: ${response.status}`);
  }
  const payload = await response.json();
  const parsed = registryResponseSchema.parse(payload);
  return { ...parsed, source: parsed.source ?? "cms" };
}

function getFreshRegistry(): Promise<RegistryResponse> {
  const now = Date.now();
  if (cachedRegistry && now - cacheTimestamp < CACHE_TTL_MS) {
      age: `${now - cacheTimestamp}ms`,
      entryCount: cachedRegistry.entries.length,
    });
    return Promise.resolve(cachedRegistry);
  }

  return fetchRegistryFromCms()
    .then((registry) => {
      cachedRegistry = registry;
      cacheTimestamp = now;
      return registry;
    })
    .catch((error) => {
      cachedRegistry = fallbackRegistry;
      cacheTimestamp = now;
      return fallbackRegistry;
    });
}

export async function loadGameRegistry() {
  const registry = await getFreshRegistry();
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

