import { describe, expect, it, vi } from "vitest";
import { getGameRouteLoader } from "./loaders";
import { getPaintPreviewEntry } from "@/games/paint-and-guess/hubEntry";

// Mock the router module to avoid actual imports in tests
vi.mock("@/games/paint-and-guess/router", () => ({
  default: {
    Lobby: () => null,
    Index: () => null,
    Room: () => null,
    NotFound: () => null,
  },
  Lobby: () => null,
  Index: () => null,
  Room: () => null,
  NotFound: () => null,
}));

describe("game registry loaders", () => {
  it(
    "returns a lazy-loadable module for paint-and-guess entries",
    async () => {
      const loader = getGameRouteLoader(getPaintPreviewEntry());
      expect(loader).toBeTypeOf("function");

      const module = await loader?.();

      expect(module?.Lobby).toBeTypeOf("function");
      expect(module?.Index).toBeTypeOf("function");
      expect(module?.Room).toBeTypeOf("function");
    },
    10000,
  );

  it(
    "supports direct dynamic imports for routing modules",
    async () => {
      const module = await import("@/games/paint-and-guess/router");

      expect(module.NotFound).toBeTypeOf("function");
    },
    10000,
  );
});

