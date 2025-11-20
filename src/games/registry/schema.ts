import { z } from "zod";

export const gameStatusSchema = z.enum(["alpha", "beta", "stable", "deprecated"]);
export const monetizationSchema = z.enum(["free", "iap", "premium", "subscription"]);

const localizedStringSchema = z.object({
  default: z.string(),
  locales: z.record(z.string().min(2), z.string()).optional(),
});

export const registryEntrySchema = z
  .object({
    id: z.string().min(1),
    version: z.string().default("0.0.1"),
    name: localizedStringSchema,
    description: localizedStringSchema,
    status: gameStatusSchema,
    supportedPlayers: z
      .object({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
        recommended: z.number().int().positive().optional(),
      })
      .refine((value) => value.max >= value.min, {
        message: "max players must be greater than or equal to min players",
      }),
    monetization: monetizationSchema,
    category: z.array(z.string()).default([]),
    schedule: z
      .object({
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
      })
      .optional(),
    badges: z.array(z.string()).default([]),
    assets: z.object({
      thumbnail: z.string(),
      trailerUrl: z.string().url().optional(),
      patchNotesUrl: z.string().url().optional(),
    }),
    featureFlags: z.array(z.string()).default([]),
    visibleIf: z.array(z.string()).default(["public"]),
    navigation: z
      .object({
        label: z.string().optional(),
        category: z.string().optional(),
        priority: z.number().int().optional(),
        hidden: z.boolean().default(false),
      })
      .default({}),
    route: z
      .object({
        slug: z.string().optional(),
        path: z.string().optional(),
      })
      .default({}),
    metrics: z
      .object({
        concurrentUsers: z.number().int().nonnegative().optional(),
        uptimePercentage: z.number().min(0).max(100).optional(),
      })
      .optional(),
    plugin: z
      .object({
        previewComponent: z.string().optional(),
        moduleId: z.string().optional(),
        providerComponent: z.string().optional(),
      })
      .optional(),
  })
  .transform((entry) => {
    const slug = entry.route.slug ?? entry.id;
    const path = entry.route.path ?? `/games/${slug}`;
    return {
      ...entry,
      route: { slug, path },
    };
  });

export const registryResponseSchema = z.object({
  updatedAt: z.string().datetime(),
  entries: z.array(registryEntrySchema),
  source: z.enum(["cms", "fallback", "cache", "git"]).default("fallback"),
});

export type NormalizedGameEntry = z.infer<typeof registryEntrySchema>;
export type RegistryResponse = z.infer<typeof registryResponseSchema>;

