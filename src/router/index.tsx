import { Navigate, Route, Routes, useParams } from "react-router-dom";
import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import Index from "@/games/paint-and-guess/pages/Index";
import Lobby from "@/games/paint-and-guess/pages/Lobby";
import NotFound from "@/games/paint-and-guess/pages/NotFound";
import Room from "@/games/paint-and-guess/pages/Room";
import PingPongIndex from "@/games/ping-pong/pages/Index";
import RpgIndex from "@/games/rpg/pages/Index";
import SemanticGuessIndex from "@/games/semantic-guess/pages/Index";
import TriviaBlitzLobby from "@/games/trivia-blitz/pages/Lobby";
import TriviaBlitzRoom from "@/games/trivia-blitz/pages/Room";
import { TriviaBlitzApp } from "@/games/trivia-blitz/pages/TriviaBlitzApp";

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
          <Route path="ping-pong">
            <Route index element={<PingPongIndex />} />
          </Route>
          <Route path="chronicles-of-the-abyss">
            <Route index element={<RpgIndex />} />
          </Route>
          <Route path="semantic-guess">
            <Route index element={<SemanticGuessIndex />} />
          </Route>
          <Route path="trivia-blitz" element={<TriviaBlitzApp />}>
            <Route index element={<TriviaBlitzLobby />} />
            <Route path="room/:roomId" element={<TriviaBlitzRoom />} />
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

