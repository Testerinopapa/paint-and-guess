import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCanva } from "../state/CanvaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CanvaLobby() {
  const navigate = useNavigate();
  const { gameState, isConnected, createRoom, joinRoom } = useCanva();
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");

  const handleCreateRoom = () => {
    if (!roomName.trim() || !playerName.trim()) {
      return;
    }
    createRoom(roomName, playerName);
  };

  const handleJoinRoom = () => {
    if (!gamePin.trim() || !playerName.trim()) {
      return;
    }
    joinRoom(gamePin, playerName);
  };

  // Navigate to room when roomId is set
  if (gameState.roomId) {
    navigate(`/games/canva/room/${gameState.roomId}`);
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Canva</h1>
      <p className="text-muted-foreground mb-8">
        Collaborative drawing canvas. Draw together with friends in real-time!
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Room</CardTitle>
            <CardDescription>Start a new collaborative canvas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Input
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Button
              onClick={handleCreateRoom}
              disabled={!isConnected || !roomName.trim() || !playerName.trim()}
              className="w-full"
            >
              Create Room
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Room</CardTitle>
            <CardDescription>Enter a room PIN to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Input
              placeholder="Game PIN"
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value)}
              maxLength={6}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!isConnected || !gamePin.trim() || !playerName.trim()}
              className="w-full"
              variant="outline"
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>

      {!isConnected && (
        <div className="mt-4 text-center text-muted-foreground">
          Connecting to server...
        </div>
      )}
    </div>
  );
}

