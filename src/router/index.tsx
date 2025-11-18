import { Fragment, Suspense, lazy, useMemo, type ComponentType, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";

import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import NotFound from "@/games/paint-and-guess/pages/NotFound";
import {
  getCachedRoutableGames,
  getGameRouteRecord,
  getNavigationFromRoutes,
  getRedirects,
  type RouteDefinition,
} from "./gameRouteRegistry";

const LoadingFallback = () => <div className="p-4 text-muted-foreground">Loading...</div>;

const LazyRouteElement = ({ loader, guards }: RouteDefinition) => {
  const Component = useMemo(() => lazy(loader), [loader]);
  const content = <Component />;
  const guardedContent = guards?.reduceRight((children, Guard) => <Guard>{children}</Guard>, content) ?? content;

  return <Suspense fallback={<LoadingFallback />}>{guardedContent}</Suspense>;
};

const LayoutWrapper = ({
  LayoutComponent = Fragment,
}: {
  LayoutComponent?: ComponentType<{ children: ReactNode }> | typeof Fragment;
}) => {
  const Wrapper = LayoutComponent ?? Fragment;
  return (
    <Wrapper>
      <Outlet />
    </Wrapper>
  );
};

const RouteRedirect = ({
  to,
  fallback = "/",
}: {
  to: string | ((params: Record<string, string | undefined>) => string | undefined);
  fallback?: string;
}) => {
  const params = useParams();
  const destination = typeof to === "function" ? to(params) : to;
  if (!destination) return <Navigate to={fallback} replace />;
  return <Navigate to={destination} replace />;
};

function stripGamesPrefix(basePath: string) {
  const withoutLeading = basePath.replace(/^\/+/, "");
  return withoutLeading.startsWith("games/") ? withoutLeading.replace(/^games\//, "") : withoutLeading;
}

const AppRoutes = () => {
  const routableGames = useMemo(() => getCachedRoutableGames(), []);
  const navigation = useMemo(
    () => [{ label: "All Games", to: "/" }, ...getNavigationFromRoutes(routableGames)],
    [routableGames],
  );
  const redirects = useMemo(() => getRedirects(routableGames) ?? [], [routableGames]);
  const paintAndGuessRoutes = useMemo(() => getGameRouteRecord("paint-and-guess"), [routableGames]);

  return (
    <Routes>
      <Route path="/" element={<HubLayout navigation={navigation} />}> 
        <Route index element={<AllGames />} />
        <Route path="games">
          {routableGames.map((game) => {
            const basePath = stripGamesPrefix(game.basePath);
            const Layout = game.layout ?? Fragment;
            return (
              <Route key={game.entry.id} path={basePath} element={<LayoutWrapper LayoutComponent={Layout} />}>
                {game.routes.map((route) => {
                  const element = <LazyRouteElement {...route} />;
                  if (route.index) {
                    return <Route key={`${game.entry.id}-index`} index element={element} />;
                  }
                  return <Route key={`${game.entry.id}-${route.path}`} path={route.path} element={element} />;
                })}
              </Route>
            );
          })}
        </Route>
      </Route>

      {redirects.map((redirect) => (
        <Route key={redirect.from} path={redirect.from} element={<RouteRedirect to={redirect.to} />} />
      ))}
      {paintAndGuessRoutes ? null : (
        <Route path="/room/:roomId" element={<RouteRedirect to={() => undefined} />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

