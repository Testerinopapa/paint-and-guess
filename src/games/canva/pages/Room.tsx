import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanva } from "../state/CanvaContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanvaCanvas } from "../components/Canvas";

export function CanvaRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, isHost, leaveRoom } = useCanva();

  useEffect(() => {
    if (gameState.roomId && gameState.roomId !== roomId) {
      navigate(`/games/canva/room/${gameState.roomId}`);
    }
  }, [gameState.roomId, roomId, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/games/canva");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Canva Room</h1>
          {gameState.gamePin && (
            <p className="text-muted-foreground">PIN: {gameState.gamePin}</p>
          )}
        </div>
        <Button onClick={handleLeave} variant="outline">
          Leave Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            <CanvaCanvas />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players ({gameState.players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 rounded"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      player.connected ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className={player.id === gameState.selfId ? "font-bold" : ""}>
                    {player.name}
                    {player.id === gameState.selfId && " (You)"}
                    {player.id === gameState.ownerId && " 👑"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

