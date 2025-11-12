import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Canvas } from "@/components/Canvas";
import { Chat } from "@/components/Chat";
import { PlayerList } from "@/components/PlayerList";
import { GameHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Play } from "lucide-react";
import { toast } from "sonner";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, leaveRoom, startGame, isConnected } = useGame();
  const [isCanvasReady, setIsCanvasReady] = useState(false);

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
    if (!isCanvasReady) {
      toast.error("Canvas is not ready yet. Please wait...");
      return;
    }
    startGame();
  };

  if (!gameState.roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p>Loading room...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GameHeader />
      
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Players */}
          <div className="lg:col-span-1">
            <PlayerList />
            {!gameState.isGameActive && gameState.players.length > 0 && (
              <Button
                onClick={handleStartGame}
                className="w-full mt-4"
                disabled={gameState.players.length < 2 || !isCanvasReady}
              >
                <Play className="w-4 h-4 mr-2" />
                {!isCanvasReady ? "Loading Canvas..." : "Start Game"}
              </Button>
            )}
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              className="w-full mt-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <Canvas onCanvasReady={setIsCanvasReady} />
            {!isCanvasReady && (
              <Card className="mt-4 p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Initializing canvas...</p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Chat */}
          <div className="lg:col-span-1">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}

