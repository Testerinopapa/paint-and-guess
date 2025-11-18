import { Navigate, Route, Routes, useParams } from "react-router-dom";
import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import Index from "@/pages/Index";
import Lobby from "@/pages/Lobby";
import NotFound from "@/pages/NotFound";
import Room from "@/pages/Room";

const RoomRedirect = () => {
  const { roomId } = useParams();
  if (!roomId) return <Navigate to="/" replace />;
  return <Navigate to={`/games/paint-and-guess/room/${roomId}`} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HubLayout />}>
        <Route index element={<AllGames />} />
        <Route path="games">
          <Route path="paint-and-guess">
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
