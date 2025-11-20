import { describe, expect, it, vi } from "vitest";
import { getGameRouteLoader } from "./loaders";
import { getPaintPreviewEntry } from "@/games/paint-and-guess/hubEntry";
import { getWordRallyEntry } from "@/games/word-rally/hubEntry";

const mockModule = {
  Lobby: () => null,
  Index: () => null,
  Room: () => null,
  NotFound: () => null,
};

vi.mock("../paint-and-guess/router.ts", () => ({
  default: mockModule,
  ...mockModule,
}));

vi.mock("../word-rally/router.tsx", () => ({
  default: mockModule,
  ...mockModule,
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
    "resolves loaders when the registry provides a module id",
    async () => {
      const loader = getGameRouteLoader(getWordRallyEntry());
      expect(loader).toBeTypeOf("function");

      const module = await loader?.();
      expect(module?.NotFound).toBeTypeOf("function");
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

