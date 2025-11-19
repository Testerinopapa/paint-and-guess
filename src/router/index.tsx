import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import Index from "@/games/paint-and-guess/pages/Index";
import Lobby from "@/games/paint-and-guess/pages/Lobby";
import NotFound from "@/games/paint-and-guess/pages/NotFound";
import Room from "@/games/paint-and-guess/pages/Room";
import { useGameRegistry } from "@/games/registry";

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

const PaintAndGuessRoutes = () => (
  <GameProviderBoundary slug="paint-and-guess">
    <Outlet />
  </GameProviderBoundary>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HubLayout />}>
        <Route index element={<AllGames />} />
        <Route path="games">
          <Route path="paint-and-guess" element={<PaintAndGuessRoutes />}>
            <Route index element={<Lobby />} />
            <Route path="single" element={<Index />} />
            <Route path="room/:roomId" element={<Room />} />
          </Route>
        </Route>
      </Route>

      <Route path="/single" element={<Navigate to="/games/paint-and-guess/single" replace />} />
      <Route path="/room/:roomId" element={<RoomRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

