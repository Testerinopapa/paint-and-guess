import { Navigate, Route, Routes } from "react-router-dom";
import HubLayout from "@/components/HubLayout";
import AllGames from "@/pages/AllGames";
import GameDetail from "@/pages/GameDetail";
import Library from "@/pages/Library";
import Friends from "@/pages/Friends";
import Whiteboard from "@/pages/Whiteboard";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { AuthRedirect } from "@/components/AuthRedirect";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GameRouteRedirect } from "@/components/GameRouteRedirect";
import PingPongIndex from "@/games/ping-pong/pages/Index";
import RpgIndex from "@/games/rpg/pages/Index";
import TriviaBlitzLobby from "@/games/trivia-blitz/pages/Lobby";
import TriviaBlitzRoom from "@/games/trivia-blitz/pages/Room";
import { TriviaBlitzApp } from "@/games/trivia-blitz/pages/TriviaBlitzApp";
import { CanvaLobby, CanvaRoom, CanvaApp } from "@/games/canva";
import ChessIndex from "@/games/chess/pages/Index";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirect /index.html to root (handles direct access to index.html) */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      
      {/* Root redirects based on auth status */}
      <Route path="/" element={<AuthRedirect />} />
      
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Redirect old game routes to new hub routes - preserves full path */}
      <Route path="/games/*" element={<GameRouteRedirect />} />
      
      {/* Protected hub routes - require authentication */}
      <Route
        path="/hub"
        element={
          <ProtectedRoute>
            <HubLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AllGames />} />
        <Route path="library" element={<Library />} />
        <Route path="friends" element={<Friends />} />
        <Route path="whiteboard/*" element={<Whiteboard />} />
        <Route path="games/:gameId" element={<GameDetail />} />
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
          <Route path="chess">
            <Route index element={<ChessIndex />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

