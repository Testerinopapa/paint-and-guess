import type { ComponentType, ReactNode } from "react";
import type { NormalizedGameEntry } from "./schema";
import { SharedGameBoundary } from "@/components/ErrorBoundary";

export type GameBoundaryComponent = ComponentType<{ children: ReactNode; resetKeys?: unknown[] }>;

type BoundaryRegistry = Record<string, GameBoundaryComponent>;

const boundaryRegistry: BoundaryRegistry = {
  "paint-and-guess": SharedGameBoundary,
  "@/games/paint-and-guess": SharedGameBoundary,
};

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
