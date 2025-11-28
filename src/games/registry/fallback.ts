import { registryResponseSchema } from "./schema";
import { getPaintPreviewEntry } from "@/games/paint-and-guess/hubEntry";
import { getPingPongPreviewEntry } from "@/games/ping-pong/hubEntry";
import { getRpgPreviewEntry } from "@/games/rpg/hubEntry";
import { getTriviaBlitzPreviewEntry } from "@/games/trivia-blitz/hubEntry";
import { getSemanticGuessPreviewEntry } from "@/games/semantic-guess/hubEntry";

const now = new Date().toISOString();

export const fallbackRegistry = registryResponseSchema.parse({
  updatedAt: now,
  source: "fallback",
  entries: [
    getPaintPreviewEntry(),
    getPingPongPreviewEntry(),
    getRpgPreviewEntry(),
    getTriviaBlitzPreviewEntry(),
    getSemanticGuessPreviewEntry(),
    {
      id: "mystery-mashup",
      version: "0.3.0",
      name: { default: "Mystery Mashup" },
      description: { default: "A surprise party experience is brewing. Stay tuned!" },
      status: "beta",
      supportedPlayers: { min: 3, max: 8 },
      monetization: "premium",
      category: ["mystery"],
      schedule: { startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() },
      badges: ["beta", "limited"],
      assets: {
        thumbnail: "/placeholder.svg",
        trailerUrl: "https://example.com/mystery-mashup/trailer",
      },
      navigation: { category: "mystery", priority: 50 },
      featureFlags: ["feature:mystery_beta"],
      visibleIf: ["cohort:beta"],
      route: { slug: "mystery-mashup" },
    },
    {
      id: "trivia-trails",
      version: "0.1.0",
      name: { default: "Trivia Trails", locales: { es: "Rutas de Trivias" } },
      description: {
        default: "Battle your friends with rapid-fire questions soon.",
        locales: { es: "Enfrenta a tus amigos con preguntas rápidas muy pronto." },
      },
      status: "alpha",
      supportedPlayers: { min: 2, max: 6, recommended: 4 },
      monetization: "iap",
      category: ["trivia"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      navigation: { category: "trivia" },
      featureFlags: ["feature:trivia_alpha"],
      visibleIf: ["internal"],
      route: { slug: "trivia-trails" },
    },
  ],
});

