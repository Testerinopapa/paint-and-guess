import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWhiteboard } from "./state/WhiteboardContext";
import { toast } from "sonner";

export default function WhiteboardLobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, roomState, isConnected } = useWhiteboard();
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Load avatar from localStorage if available
    const savedAvatar = localStorage.getItem("avatarConfig");
    if (savedAvatar) {
      try {
        setAvatar(savedAvatar);
      } catch (error) {
        // Ignore
      }
    }

    // Load player name from localStorage if available
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  useEffect(() => {
    // Navigate to room when room is created/joined
    if (roomState.roomId) {
      navigate(`/hub/whiteboard/room/${roomState.roomId}`);
    }
  }, [roomState.roomId, navigate]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!isConnected) {
      toast.error("Not connected to server");
      return;
    }

    localStorage.setItem("playerName", playerName);
    createRoom(roomName, playerName, avatar || undefined);
  };

  const handleJoinRoom = () => {
    if (!gamePin.trim()) {
      toast.error("Please enter a game PIN");
      return;
    }
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!isConnected) {
      toast.error("Not connected to server");
      return;
    }

    localStorage.setItem("playerName", playerName);
    joinRoom(gamePin, playerName, avatar || undefined);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Whiteboard</h1>
        <p className="text-muted-foreground">
          Create or join a collaborative whiteboard room
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Room</CardTitle>
            <CardDescription>
              Start a new collaborative whiteboard session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-room-name">Room Name</Label>
              <Input
                id="create-room-name"
                placeholder="My Whiteboard"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateRoom();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-player-name">Your Name</Label>
              <Input
                id="create-player-name"
                placeholder="Player"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateRoom();
                }}
              />
            </div>
            <Button 
              onClick={handleCreateRoom} 
              className="w-full"
              disabled={!isConnected}
            >
              Create Room
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Room</CardTitle>
            <CardDescription>
              Join an existing whiteboard room with a PIN
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-pin">Game PIN</Label>
              <Input
                id="join-pin"
                placeholder="123456"
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinRoom();
                }}
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-player-name">Your Name</Label>
              <Input
                id="join-player-name"
                placeholder="Player"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinRoom();
                }}
              />
            </div>
            <Button 
              onClick={handleJoinRoom} 
              className="w-full"
              variant="outline"
              disabled={!isConnected}
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>

      {!isConnected && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Connecting to server...
        </div>
      )}
    </div>
  );
}

