import type { ComponentType, ReactNode } from "react";
import { getCachedRegistry, getVisibleGames, type GameRegistryEntry } from "@/games/registry";

export type RouteGuard = ComponentType<{ children: ReactNode }>;

export type RouteDefinition = {
  path?: string;
  index?: boolean;
  loader: () => Promise<{ default: ComponentType<any> }>;
  guards?: RouteGuard[];
};

export type GameRouteRecord = {
  entry: GameRegistryEntry;
  basePath: string;
  layout?: ComponentType<{ children: ReactNode }>;
  routes: RouteDefinition[];
  redirects?: { from: string; to: string | ((params: Record<string, string | undefined>) => string | undefined) }[];
};

const gameRouteRegistry: Record<string, Omit<GameRouteRecord, "entry">> = {
  "paint-and-guess": {
    basePath: "/games/paint-and-guess",
    routes: [
      { index: true, loader: () => import("@/games/paint-and-guess/pages/Lobby") },
      { path: "single", loader: () => import("@/games/paint-and-guess/pages/Index") },
      { path: "room/:roomId", loader: () => import("@/games/paint-and-guess/pages/Room") },
    ],
    redirects: [
      { from: "/single", to: "/games/paint-and-guess/single" },
      {
        from: "/room/:roomId",
        to: (params) => (params.roomId ? `/games/paint-and-guess/room/${params.roomId}` : undefined),
      },
    ],
  },
};

function normalizeBasePath(basePath: string): string {
  return basePath.startsWith("/") ? basePath : `/${basePath}`;
}

export function selectRoutableGames(entries: GameRegistryEntry[]): GameRouteRecord[] {
  const visibleGames = getVisibleGames(entries);

  return visibleGames
    .map((entry) => {
      const definition = gameRouteRegistry[entry.id];
      if (!definition) return null;

      const resolvedBasePath = normalizeBasePath(definition.basePath ?? entry.route ?? `/games/${entry.id}`);

      return {
        entry,
        ...definition,
        basePath: resolvedBasePath,
      } satisfies GameRouteRecord;
    })
    .filter((value): value is GameRouteRecord => value !== null);
}

export function getCachedRoutableGames(): GameRouteRecord[] {
  return selectRoutableGames(getCachedRegistry().entries);
}

export function getNavigationFromRoutes(records: GameRouteRecord[]): { label: string; to: string }[] {
  return records.map((record) => ({ label: record.entry.name, to: record.basePath }));
}

export function getRedirects(records: GameRouteRecord[]): GameRouteRecord["redirects"] {
  return records.flatMap((record) => record.redirects ?? []);
}

export function getGameRouteRecord(id: string): GameRouteRecord | undefined {
  return getCachedRoutableGames().find((record) => record.entry.id === id);
}
