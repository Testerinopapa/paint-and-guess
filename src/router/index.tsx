import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Suspense, lazy, useMemo, type ComponentType, type ReactNode } from "react";
import { useGameRegistry } from "@/games/registry";
import { getGameRouteLoader, type GameRouteLoader } from "@/games/registry/loaders";
import { SharedGameBoundary } from "@/games/registry/boundaries";

const HubLayout = lazy(() => import("@/components/HubLayout"));
const AllGames = lazy(() => import("@/pages/AllGames"));

const RoomRedirect = () => {
  const { roomId } = useParams();
  if (!roomId) return <Navigate to="/" replace />;
  return <Navigate to={`/games/paint-and-guess/room/${roomId}`} replace />;
};

const GameProviderBoundary = ({ slug, children }: { slug: string; children: ReactNode }) => {
  const { games } = useGameRegistry();
  const Provider = useMemo(() => games.find((game) => game.route.slug === slug)?.Provider, [games, slug]);

  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
};

const GameBoundary = ({ slug, children }: { slug: string; children: ReactNode }) => {
  const location = useLocation();
  const { games } = useGameRegistry();
  const Boundary = useMemo(() => games.find((game) => game.route.slug === slug)?.Boundary ?? SharedGameBoundary, [games, slug]);

  return <Boundary resetKeys={[location.pathname]}>{children}</Boundary>;
};

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    Loading experience…
  </div>
);

function createLazyGameComponent(
  loader: GameRouteLoader,
  exportName: keyof Awaited<ReturnType<GameRouteLoader>>,
  preloadedModule?: Promise<Awaited<ReturnType<GameRouteLoader>>>,
) {
  return lazy(async () => {
    const module = await (preloadedModule ?? loader());
    const Component = module[exportName] as ComponentType | undefined;
    if (!Component) {
      throw new Error(`Game module is missing export: ${String(exportName)}`);
    }
    return { default: Component };
  });
}

const PaintAndGuessRoutes = ({ loader }: { loader: GameRouteLoader }) => (
  <GameProviderBoundary slug="paint-and-guess">
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  </GameProviderBoundary>
);

const AppRoutes = () => {
  const { games } = useGameRegistry();
  const paintAndGuessLoader = useMemo(
    () => getGameRouteLoader(games.find((game) => game.route.slug === "paint-and-guess")) ?? (() => import("@/games/paint-and-guess/router")),
    [games],
  );

  const preloadedPaintAndGuessModule = useMemo(() => paintAndGuessLoader(), [paintAndGuessLoader]);

  const paintAndGuessRoutes = useMemo(() => {
    const Lobby = createLazyGameComponent(paintAndGuessLoader, "Lobby", preloadedPaintAndGuessModule);
    const Index = createLazyGameComponent(paintAndGuessLoader, "Index", preloadedPaintAndGuessModule);
    const Room = createLazyGameComponent(paintAndGuessLoader, "Room", preloadedPaintAndGuessModule);
    const NotFound = createLazyGameComponent(paintAndGuessLoader, "NotFound", preloadedPaintAndGuessModule);

    return { Lobby, Index, Room, NotFound };
  }, [paintAndGuessLoader, preloadedPaintAndGuessModule]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<RouteFallback />}>
            <HubLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<RouteFallback />}>
              <AllGames />
            </Suspense>
          }
        />
        <Route path="games">
          <Route path="paint-and-guess" element={<PaintAndGuessRoutes loader={paintAndGuessLoader} />}>
            <Route
              index
              element={
                  <GameBoundary slug="paint-and-guess">
                    <Suspense fallback={<RouteFallback />}>
                      <paintAndGuessRoutes.Lobby />
                    </Suspense>
                  </GameBoundary>
              }
            />
            <Route
              path="single"
              element={
                  <GameBoundary slug="paint-and-guess">
                    <Suspense fallback={<RouteFallback />}>
                      <paintAndGuessRoutes.Index />
                    </Suspense>
                  </GameBoundary>
              }
            />
            <Route
              path="room/:roomId"
              element={
                  <GameBoundary slug="paint-and-guess">
                    <Suspense fallback={<RouteFallback />}>
                      <paintAndGuessRoutes.Room />
                    </Suspense>
                  </GameBoundary>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="/single" element={<Navigate to="/games/paint-and-guess/single" replace />} />
      <Route path="/room/:roomId" element={<RoomRedirect />} />
      <Route
        path="*"
        element={
          <GameBoundary slug="paint-and-guess">
            <Suspense fallback={<RouteFallback />}>
              <paintAndGuessRoutes.NotFound />
            </Suspense>
          </GameBoundary>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

