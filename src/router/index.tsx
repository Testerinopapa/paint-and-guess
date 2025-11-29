import { Navigate, Route, Routes } from "react-router-dom";
import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PingPongIndex from "@/games/ping-pong/pages/Index";
import RpgIndex from "@/games/rpg/pages/Index";
import TriviaBlitzLobby from "@/games/trivia-blitz/pages/Lobby";
import TriviaBlitzRoom from "@/games/trivia-blitz/pages/Room";
import { TriviaBlitzApp } from "@/games/trivia-blitz/pages/TriviaBlitzApp";
import { CanvaLobby, CanvaRoom, CanvaApp } from "@/games/canva";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<HubLayout />}>
        <Route index element={<AllGames />} />
        <Route path="games">
          <Route path="ping-pong">
            <Route index element={<PingPongIndex />} />
          </Route>
          <Route path="chronicles-of-the-abyss">
            <Route index element={<RpgIndex />} />
          </Route>
          <Route path="trivia-blitz" element={<TriviaBlitzApp />}>
            <Route index element={<TriviaBlitzLobby />} />
            <Route path="room/:roomId" element={<TriviaBlitzRoom />} />
          </Route>
          <Route path="canva" element={<CanvaApp />}>
            <Route index element={<CanvaLobby />} />
            <Route path="room/:roomId" element={<CanvaRoom />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

