import { z } from "zod";

export const gameStatusSchema = z.enum(["available", "coming-soon", "prototype", "retired"]);
export const gameModeSchema = z.enum(["singleplayer", "party", "live-multiplayer", "async", "coop"]);

export const ctaSchema = z.object({
  label: z.string(),
  href: z.string().optional(),
  to: z.string().optional(),
  external: z.boolean().optional(),
});

export const gameHubHighlightSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

export const gameHubChecklistSchema = z.object({
  label: z.string(),
  complete: z.boolean().default(false),
});

export const gameHubEntrySchema = z.object({
  heroEyebrow: z.string().optional(),
  heroTitle: z.string(),
  heroDescription: z.string(),
  heroImage: z.string().optional(),
  primaryCta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  highlights: z.array(gameHubHighlightSchema).default([]),
  checklist: z.array(gameHubChecklistSchema).default([]),
});

export const gameRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  status: gameStatusSchema.default("coming-soon"),
  thumbnail: z.string().default("/placeholder.svg"),
  route: z.string().default("#"),
  featureFlag: z.string().optional(),
  tags: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  modes: z.array(gameModeSchema).default(["party"]),
  players: z
    .object({
      min: z.number().int().nonnegative().optional(),
      max: z.number().int().nonnegative().optional(),
    })
    .default({}),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  cta: ctaSchema.optional(),
  metadata: z.record(z.unknown()).default({}),
  hub: gameHubEntrySchema.optional(),
});

export const gameRegistryPayloadSchema = z.object({
  updatedAt: z.coerce.date().default(() => new Date()),
  source: z.string().default("runtime"),
  entries: z.array(gameRegistryEntrySchema),
});

export type GameRegistryPayload = z.infer<typeof gameRegistryPayloadSchema> & {
  updatedAt: string;
};
export type GameRegistryEntry = z.infer<typeof gameRegistryEntrySchema>;
export type GameHubEntry = z.infer<typeof gameHubEntrySchema>;
export type GameStatus = z.infer<typeof gameStatusSchema>;

