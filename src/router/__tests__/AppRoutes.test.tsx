import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import AppRoutes from "../index";

// Inform React testing utilities that act() is available.
// @ts-expect-error global flag used for suppressing act warnings
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/components/HubLayout", () => ({
  default: () => (
    <div data-testid="hub-layout">
      <Outlet />
    </div>
  ),
}));

vi.mock("@/pages/AllGames", () => ({
  default: () => <div data-testid="all-games">All Games Hub</div>,
}));

vi.mock("@/games/paint-and-guess/pages/Index", () => ({
  __esModule: true,
  default: () => <div data-testid="paint-single">Paint &amp; Guess Single</div>,
}));

vi.mock("@/games/paint-and-guess/pages/Lobby", () => ({
  __esModule: true,
  default: () => <div data-testid="paint-lobby">Paint &amp; Guess Lobby</div>,
}));

vi.mock("@/games/paint-and-guess/pages/Room", () => ({
  __esModule: true,
  default: () => <div data-testid="paint-room">Paint &amp; Guess Room</div>,
}));

vi.mock("@/games/paint-and-guess/pages/NotFound", () => ({
  __esModule: true,
  default: () => <div data-testid="not-found">Not Found</div>,
}));

function createProvider(id: string) {
  return function Provider({ children }: { children: ReactNode }) {
    return (
      <div data-testid={`${id}-provider`} data-provider={id}>
        {children}
      </div>
    );
  };
}

vi.mock("@/games/registry", () => {
  const provider = createProvider("paint-and-guess");
  return {
    useGameRegistry: () => ({
      games: [
        {
          id: "paint-and-guess",
          version: "1.0.0",
          name: { default: "Paint" },
          description: { default: "" },
          status: "stable",
          supportedPlayers: { min: 1, max: 8 },
          monetization: "free",
          category: [],
          badges: [],
          assets: { thumbnail: "/placeholder.svg" },
          featureFlags: [],
          visibleIf: ["public"],
          navigation: {},
          route: { slug: "paint-and-guess", path: "/games/paint-and-guess" },
          displayName: "Paint",
          displayDescription: "",
          derivedRoute: "/games/paint-and-guess",
          isEnabled: true,
          Provider: provider,
          navLabel: "Paint",
          navCategory: "featured",
          navPriority: 0,
          navHidden: false,
        },
      ],
      isFetching: false,
      status: "success",
      error: null,
      data: null,
      refetch: vi.fn(),
    }),
  };
});

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

function renderWithRoute(path: string) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const client = createTestClient();

  const renderAt = (entry: string) => {
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[entry]} key={entry}>
            <AppRoutes />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
  };

  renderAt(path);

  return {
    container,
    renderAt,
    unmount: () => root.unmount(),
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AppRoutes provider wiring", () => {
  it("wraps paint-and-guess routes with the registered provider", () => {
    const app = renderWithRoute("/games/paint-and-guess/single");

    expect(app.container.querySelector('[data-testid="paint-and-guess-provider"]')).not.toBeNull();
    expect(app.container.querySelector('[data-testid="paint-single"]')).not.toBeNull();

    app.unmount();
  });

  it("does not mount game providers for non-game routes", () => {
    const app = renderWithRoute("/");

    expect(app.container.querySelector('[data-testid="paint-and-guess-provider"]')).toBeNull();
    expect(app.container.querySelector('[data-testid="all-games"]')).not.toBeNull();

    app.unmount();
  });

  it("tears down the provider when navigating between game and hub routes", () => {
    const app = renderWithRoute("/games/paint-and-guess/room/room-123");

    expect(app.container.querySelector('[data-testid="paint-and-guess-provider"]')).not.toBeNull();
    expect(app.container.querySelector('[data-testid="paint-room"]')).not.toBeNull();

    app.renderAt("/");

    expect(app.container.querySelector('[data-testid="paint-and-guess-provider"]')).toBeNull();
    expect(app.container.querySelector('[data-testid="all-games"]')).not.toBeNull();

    app.unmount();
  });
});
