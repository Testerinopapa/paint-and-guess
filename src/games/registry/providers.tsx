import type { ReactNode, ComponentType } from "react";
import type { NormalizedGameEntry } from "./schema";
import { createRegistryKeyVariants, extractGameId } from "./moduleKeys";

export type GameProviderComponent = ComponentType<{ children: ReactNode }>;

type ProviderRegistry = Record<string, GameProviderComponent>;

type ProviderModule = {
  GameProvider?: GameProviderComponent;
};

const providerModules = import.meta.glob<ProviderModule>("../*/index.{ts,tsx}", { eager: true });

const providerRegistry: ProviderRegistry = Object.entries(providerModules).reduce((registry, [path, module]) => {
  if (!module.GameProvider) return registry;

  const gameId = extractGameId(path);
  if (!gameId) return registry;

  for (const key of createRegistryKeyVariants(gameId)) {
    registry[key] = module.GameProvider;
  }

  return registry;
}, {} as ProviderRegistry);

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

