import { describe, expect, it } from "vitest";
import { buildNavigationLinks } from "../HubLayout";
import type { HubGame } from "@/games/registry";

const createGame = (overrides: Partial<HubGame> = {}): HubGame => ({
  id: "game",
  version: "1.0.0",
  name: { default: "Game" },
  description: { default: "Description" },
  status: "stable",
  supportedPlayers: { min: 1, max: 4 },
  monetization: "free",
  category: [],
  badges: [],
  assets: { thumbnail: "/placeholder.svg" },
  featureFlags: [],
  visibleIf: ["public"],
  navigation: {},
  route: { slug: "game", path: "/games/game" },
  displayName: "Game",
  displayDescription: "Description",
  derivedRoute: "/games/game",
  isEnabled: true,
  PreviewComponent: undefined,
  navLabel: "Game",
  navCategory: "uncategorized",
  navPriority: 0,
  navHidden: false,
  ...overrides,
});

describe("buildNavigationLinks", () => {
  it("orders games by category then priority", () => {
    const navigation = buildNavigationLinks([
      createGame({
        id: "beta",
        navLabel: "Beta",
        navCategory: "featured",
        navPriority: 10,
        derivedRoute: "/games/beta",
        route: { slug: "beta", path: "/games/beta" },
      }),
      createGame({
        id: "alpha",
        navLabel: "Alpha",
        navCategory: "featured",
        navPriority: 20,
        derivedRoute: "/games/alpha",
        route: { slug: "alpha", path: "/games/alpha" },
      }),
      createGame({
        id: "mystery",
        navLabel: "Mystery",
        navCategory: "mystery",
        navPriority: 5,
        derivedRoute: "/games/mystery",
        route: { slug: "mystery", path: "/games/mystery" },
      }),
    ]);

    expect(navigation.map((item) => item.label)).toEqual(["All Games", "Alpha", "Beta", "Mystery"]);
    expect(navigation.map((item) => item.to)).toEqual(["/", "/games/alpha", "/games/beta", "/games/mystery"]);
  });

  it("falls back when navigation metadata is missing", () => {
    const navigation = buildNavigationLinks([
      {
        ...createGame({
          id: "navless",
          displayName: "Navless",
          derivedRoute: "/games/navless",
          route: { slug: "navless", path: "/games/navless" },
          category: [],
        }),
        navLabel: undefined as unknown as string,
        navCategory: undefined as unknown as string,
        navPriority: undefined as unknown as number,
      } as HubGame,
    ]);

    expect(navigation[1]).toMatchObject({
      label: "Navless",
      to: "/games/navless",
      category: "uncategorized",
      priority: 0,
    });
  });

  it("omits hidden or disabled games", () => {
    const navigation = buildNavigationLinks([
      createGame({ id: "visible", navLabel: "Visible" }),
      createGame({ id: "hidden", navLabel: "Hidden", navHidden: true }),
      createGame({ id: "disabled", navLabel: "Disabled", isEnabled: false }),
    ]);

    expect(navigation.map((item) => item.label)).toEqual(["All Games", "Visible"]);
  });
});


