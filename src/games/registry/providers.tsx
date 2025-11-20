import type { ReactNode, ComponentType } from "react";
import type { NormalizedGameEntry } from "./schema";
import { GameProvider as PaintAndGuessProvider } from "@/games/paint-and-guess";

export type GameProviderComponent = ComponentType<{ children: ReactNode }>;

type ProviderRegistry = Record<string, GameProviderComponent>;

const providerRegistry: ProviderRegistry = {
  "paint-and-guess": PaintAndGuessProvider,
  "@/games/paint-and-guess": PaintAndGuessProvider,
};

function getProviderKey(entry: NormalizedGameEntry) {
  return entry.plugin?.providerComponent ?? entry.plugin?.moduleId ?? entry.id;
}

export function resolveProvider(entry: NormalizedGameEntry): GameProviderComponent | undefined {
  const key = getProviderKey(entry);
  return key ? providerRegistry[key] : undefined;
}

export function getProviderByKey(providerKey?: string): GameProviderComponent | undefined {
  if (!providerKey) return undefined;
  return providerRegistry[providerKey];
}

