import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanva } from "../state/CanvaContext";
import { LobbyStage } from "../components/LobbyStage";
import { GameStage } from "../components/GameStage";

export function CanvaRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, leaveRoom } = useCanva();

  useEffect(() => {
    if (gameState.roomId && gameState.roomId !== roomId) {
      navigate(`/games/canva/room/${gameState.roomId}`);
    }
  }, [gameState.roomId, roomId, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/games/canva");
  };

  // Show game stage if game is active, otherwise show lobby
  if (gameState.isGameActive) {
    return <GameStage onLeaveRoom={handleLeave} />;
  }

  return <LobbyStage onLeaveRoom={handleLeave} />;
}

