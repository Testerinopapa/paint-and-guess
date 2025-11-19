import { describe, expect, it } from "vitest";
import { getGameRouteLoader } from "./loaders";
import { getPaintPreviewEntry } from "@/games/paint-and-guess/hubEntry";

describe("game registry loaders", () => {
  it("returns a lazy-loadable module for paint-and-guess entries", async () => {
    const loader = getGameRouteLoader(getPaintPreviewEntry());
    expect(loader).toBeTypeOf("function");

    const module = await loader?.();

    expect(module?.Lobby).toBeTypeOf("function");
    expect(module?.Index).toBeTypeOf("function");
    expect(module?.Room).toBeTypeOf("function");
  });

  it("supports direct dynamic imports for routing modules", async () => {
    const module = await import("@/games/paint-and-guess/router");

    expect(module.NotFound).toBeTypeOf("function");
  });
});
