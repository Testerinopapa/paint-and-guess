import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getWordRallyEntry(): NormalizedGameEntry {
  return {
    id: "word-rally",
    version: "0.1.0",
    name: { default: "Word Rally" },
    description: {
      default: "Chain clever clues and race to finish line prompts in this experimental word game.",
    },
    status: "alpha",
    supportedPlayers: { min: 1, max: 6, recommended: 4 },
    monetization: "free",
    category: ["word", "party"],
    badges: ["new"],
    assets: { thumbnail: "/placeholder.svg" },
    navigation: { category: "featured", priority: 40 },
    visibleIf: ["public"],
    featureFlags: [],
    route: { slug: "word-rally" },
    plugin: {
      moduleId: "@/games/word-rally",
      providerComponent: "@/games/word-rally",
      boundaryComponent: "@/games/word-rally",
    },
  };
}
