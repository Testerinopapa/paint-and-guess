import type { ComponentType } from "react";
import type { NormalizedGameEntry } from "./schema";

export type GameRouteModule = {
  Lobby?: ComponentType;
  Index?: ComponentType;
  Room?: ComponentType;
  NotFound?: ComponentType;
};

export type GameRouteLoader = () => Promise<GameRouteModule>;

type LoaderRegistry = Record<string, GameRouteLoader>;

const moduleLoaders: LoaderRegistry = {
  "paint-and-guess": () => import("@/games/paint-and-guess/router"),
  "@/games/paint-and-guess": () => import("@/games/paint-and-guess/router"),
};

function resolveModuleKey(entry?: NormalizedGameEntry) {
  return entry?.plugin?.moduleId ?? entry?.id;
}

export function getGameRouteLoader(entry?: NormalizedGameEntry): GameRouteLoader | undefined {
  const key = resolveModuleKey(entry);
  return key ? moduleLoaders[key] : undefined;
}

