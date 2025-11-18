import React, { useMemo } from "react";
import { matchesTargeting, isFeatureEnabled } from "@/lib/featureFlags";
import { fallbackRegistry } from "./registry/fallback";
import { NormalizedGameEntry, RegistryResponse, registryResponseSchema } from "./registry/schema";
import { getPaintPreviewComponent, getPaintPreviewEntry } from "./paint-and-guess/hubEntry";

const registryEndpoint = import.meta.env.VITE_GAME_REGISTRY_URL ?? "/api/games";
const CACHE_TTL_MS = 60_000;

let cachedRegistry: RegistryResponse | null = null;
let cacheTimestamp = 0;

export type HubGame = NormalizedGameEntry & {
  displayName: string;
  displayDescription: string;
  derivedRoute: string;
  isEnabled: boolean;
  PreviewComponent?: React.ComponentType;
};

function localizeCopy(localized: { default: string; locales?: Record<string, string> }) {
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
  if (!locale || !localized.locales) return localized.default;
  if (localized.locales[locale]) return localized.locales[locale];
  const base = locale.split("-")[0];
  return localized.locales[base] ?? localized.default;
}

function attachPlugin(entry: NormalizedGameEntry): HubGame {
  let PreviewComponent: React.ComponentType | undefined;

  if (entry.plugin?.previewComponent === "paintPreview") {
    PreviewComponent = getPaintPreviewComponent();
  }

  return {
    ...entry,
    displayName: localizeCopy(entry.name),
    displayDescription: localizeCopy(entry.description),
    derivedRoute: entry.route.path,
    isEnabled:
      entry.featureFlags.every((flag) => isFeatureEnabled(flag)) &&
      matchesTargeting(entry.visibleIf),
    PreviewComponent,
  };
}

async function fetchRegistryFromCms(): Promise<RegistryResponse> {
  const response = await fetch(registryEndpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load registry: ${response.status}`);
  }
  const parsed = registryResponseSchema.parse(await response.json());
  return { ...parsed, source: parsed.source ?? "cms" };
}

function getFreshRegistry(): Promise<RegistryResponse> {
  const now = Date.now();
  if (cachedRegistry && now - cacheTimestamp < CACHE_TTL_MS) {
    return Promise.resolve({ ...cachedRegistry, source: "cache" });
  }

  return fetchRegistryFromCms()
    .then((registry) => {
      cachedRegistry = registry;
      cacheTimestamp = now;
      return registry;
    })
    .catch((error) => {
      console.warn("[registry] Falling back to baked config", error);
      cachedRegistry = fallbackRegistry;
      cacheTimestamp = now;
      return fallbackRegistry;
    });
}

export async function loadGameRegistry(): Promise<{ entries: HubGame[]; source: string; updatedAt: string }> {
  const registry = await getFreshRegistry();
  return {
    entries: registry.entries.map(attachPlugin),
    source: registry.source,
    updatedAt: registry.updatedAt,
  };
}

export function useGameRegistry() {
  const query = useQuery({
    queryKey: ["game-registry"],
    queryFn: loadGameRegistry,
    staleTime: CACHE_TTL_MS,
  });

  return useMemo(() => {
    return {
      ...query,
      games: query.data?.entries ?? [],
      source: query.data?.source ?? fallbackRegistry.source,
    };
  }, [query]);
}

export function getLocalHubEntry(): NormalizedGameEntry {
  return getPaintPreviewEntry();
}
