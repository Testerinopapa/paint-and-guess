import type { ComponentType } from "react";
import type { NormalizedGameEntry } from "./schema";
import { createRegistryKeyVariants, extractGameId, getFileExtension } from "./moduleKeys";

export type GameRouteModule = {
  Lobby?: ComponentType;
  Index?: ComponentType;
  Room?: ComponentType;
  NotFound?: ComponentType;
};

export type GameRouteLoader = () => Promise<GameRouteModule>;

type LoaderRegistry = Record<string, GameRouteLoader>;

const routeModuleImports = import.meta.glob<GameRouteModule>("../*/router.{ts,tsx}");

const moduleLoaders: LoaderRegistry = Object.entries(routeModuleImports).reduce((registry, [path, loader]) => {
  const gameId = extractGameId(path);
  if (!gameId) return registry;

  const extension = getFileExtension(path);
  for (const key of createRegistryKeyVariants(gameId)) {
    registry[key] = loader;
  }
  for (const key of createRegistryKeyVariants(gameId, { resource: "router", extension })) {
    registry[key] = loader;
  }
  return registry;
}, {} as LoaderRegistry);

function resolveModuleKey(entry?: NormalizedGameEntry) {
  return entry?.plugin?.moduleId ?? entry?.id;
}

export function getGameRouteLoader(entry?: NormalizedGameEntry): GameRouteLoader | undefined {
  const key = resolveModuleKey(entry);
  return key ? moduleLoaders[key] : undefined;
}

