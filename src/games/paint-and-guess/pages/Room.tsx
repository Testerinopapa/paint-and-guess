import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/games/paint-and-guess";
import { Canvas } from "@/games/paint-and-guess/components/Canvas";
import { Chat } from "@/games/paint-and-guess/components/Chat";
import { PlayerList } from "@/games/paint-and-guess/components/PlayerList";
import { GameHeader } from "@/games/paint-and-guess/components/GameHeader";
import GameLayout from "@/games/paint-and-guess/components/GameLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Play } from "lucide-react";
import { toast } from "sonner";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, leaveRoom, startGame, isConnected, setReadyState } = useGame();

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
      return;
    }
  }, [isConnected, navigate]);

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate("/");
    toast.info("Left room");
  };

  const handleStartGame = () => {
    if (gameState.players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }
    const allReady = gameState.players.every((player) => player.isReady);
    if (!allReady) {
      toast.error("All players must be ready");
      return;
    }
    startGame();
  };

  const currentPlayer = gameState.players.find((player) => player.id === gameState.selfId);
  const isHost = gameState.ownerId === gameState.selfId;
  const isReady = currentPlayer?.isReady ?? false;
  const allPlayersReady =
    gameState.players.length >= 2 && gameState.players.every((player) => player.isReady);

  const actionSlot = (
    <Button onClick={handleLeaveRoom} variant="outline" className="gap-2">
      <LogOut className="w-4 h-4" />
      Leave Room
    </Button>
  );

  if (!gameState.roomId) {
    return (
      <GameLayout title="Paint & Guess" description="Loading your room" actionSlot={actionSlot}>
        <Card className="p-6">
          <p>Loading room...</p>
        </Card>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Paint & Guess" description={`Room ${roomId ?? gameState.roomId}`} actionSlot={actionSlot}>
      <GameHeader />

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Players */}
          <div className="lg:col-span-1">
            <PlayerList />
            {!gameState.isGameActive && gameState.players.length > 0 && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => setReadyState(!isReady)}
                  className="w-full"
                  variant={isReady ? "secondary" : "default"}
                >
                  {isReady ? "Set as Not Ready" : "Ready Up"}
                </Button>
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    className="w-full"
                    disabled={!allPlayersReady}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                )}
                {!isHost && (
                  <Button className="w-full" disabled variant="outline">
                    Waiting for host to start
                  </Button>
                )}
              </div>
            )}
            {!isHost && !gameState.isGameActive && (
              <p className="text-sm text-muted-foreground mt-2">
                {allPlayersReady
                  ? "Ready! Waiting for host to start."
                  : "Waiting for all players to ready up."}
              </p>
            )}
            <Button onClick={handleLeaveRoom} variant="outline" className="w-full mt-2">
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <Canvas />
          </div>

          {/* Right Sidebar - Chat */}
          <div className="lg:col-span-1">
            <Chat />
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
