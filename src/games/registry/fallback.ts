import { registryResponseSchema, RegistryResponse } from "./schema";

const now = new Date().toISOString();

export const fallbackRegistry: RegistryResponse = registryResponseSchema.parse({
  updatedAt: now,
  source: "fallback",
  entries: [
    {
      id: "paint-and-guess",
      version: "1.1.0",
      name: {
        default: "Paint & Guess",
      },
      description: {
        default: "Draw prompts, guess sketches, and keep the points flowing.",
      },
      status: "stable",
      supportedPlayers: {
        min: 2,
        max: 12,
        recommended: 6,
      },
      monetization: "free",
      category: ["party", "drawing"],
      badges: ["hot"],
      assets: {
        thumbnail: "/placeholder.svg",
        patchNotesUrl: "https://example.com/paint-and-guess/patch-notes",
      },
      visibleIf: ["public"],
      route: {
        slug: "paint-and-guess",
      },
      metrics: {
        concurrentUsers: 1200,
        uptimePercentage: 99.9,
      },
      plugin: {
        previewComponent: "paintPreview",
        moduleId: "@/games/paint-and-guess",
      },
    },
    {
      id: "mystery-mashup",
      version: "0.3.0",
      name: {
        default: "Mystery Mashup",
      },
      description: {
        default: "A surprise party experience is brewing. Stay tuned!",
      },
      status: "beta",
      supportedPlayers: {
        min: 3,
        max: 8,
      },
      monetization: "premium",
      category: ["mystery"],
      schedule: {
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      badges: ["limited", "beta"],
      assets: {
        thumbnail: "/placeholder.svg",
        trailerUrl: "https://example.com/mystery-mashup/trailer",
      },
      featureFlags: ["feature:mystery_beta"],
      visibleIf: ["cohort:beta"],
      route: {
        slug: "mystery-mashup",
      },
      metrics: {
        concurrentUsers: 0,
      },
    },
    {
      id: "trivia-trails",
      version: "0.1.0",
      name: {
        default: "Trivia Trails",
        locales: { es: "Rutas de Trivias" },
      },
      description: {
        default: "Battle your friends with rapid-fire questions soon.",
        locales: { es: "Enfrenta a tus amigos con preguntas rápidas muy pronto." },
      },
      status: "alpha",
      supportedPlayers: {
        min: 2,
        max: 6,
        recommended: 4,
      },
      monetization: "iap",
      category: ["trivia"],
      badges: ["new"],
      assets: {
        thumbnail: "/placeholder.svg",
      },
      featureFlags: ["feature:trivia_alpha"],
      visibleIf: ["internal"],
      route: {
        slug: "trivia-trails",
      },
    },
  ],
});
