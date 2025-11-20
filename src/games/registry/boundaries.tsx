import type { ComponentType, ReactNode } from "react";
import type { NormalizedGameEntry } from "./schema";
import { SharedGameBoundary } from "@/components/ErrorBoundary";
import { createRegistryKeyVariants, extractGameId } from "./moduleKeys";

export type GameBoundaryComponent = ComponentType<{ children: ReactNode; resetKeys?: unknown[] }>;

type BoundaryRegistry = Record<string, GameBoundaryComponent>;

type BoundaryModule = {
  GameBoundary?: GameBoundaryComponent;
};

const boundaryModules = import.meta.glob<BoundaryModule>("../*/boundary.tsx", { eager: true });

const boundaryRegistry: BoundaryRegistry = Object.entries(boundaryModules).reduce((registry, [path, module]) => {
  if (!module.GameBoundary) return registry;
  const gameId = extractGameId(path);
  if (!gameId) return registry;

  for (const key of createRegistryKeyVariants(gameId)) {
    registry[key] = module.GameBoundary;
  }

  return registry;
}, {} as BoundaryRegistry);

function getBoundaryKey(entry: NormalizedGameEntry) {
  return entry.plugin?.boundaryComponent ?? entry.plugin?.moduleId ?? entry.id;
}

export function resolveBoundary(entry: NormalizedGameEntry): GameBoundaryComponent | undefined {
  const key = getBoundaryKey(entry);
  return key ? boundaryRegistry[key] : undefined;
}

export function getBoundaryByKey(boundaryKey?: string): GameBoundaryComponent | undefined {
  if (!boundaryKey) return undefined;
  return boundaryRegistry[boundaryKey];
}

export { SharedGameBoundary };

