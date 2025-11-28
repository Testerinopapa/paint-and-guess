import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import { toast } from "sonner";
import { Plus, LogIn } from "lucide-react";
import { AvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnected, gameState } = useTrivia();

  // Navigate to room when created or joined
  useEffect(() => {
    if (gameState.roomId) {
      navigate(`/games/trivia-blitz/room/${gameState.roomId}`);
    }
  }, [gameState.roomId, navigate]);

  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [gamePin, setGamePin] = useState("");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    return safeLoadAvatarConfig() || createDefaultAvatarConfig();
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Listen for avatar updates from HubLayout
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AvatarConfig>).detail;
      if (detail) {
        setAvatarConfig(detail);
      }
    };

    window.addEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    };
  }, []);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    const latestAvatar = safeLoadAvatarConfig() || avatarConfig || createDefaultAvatarConfig();
    setAvatarConfig(latestAvatar);
    setIsCreating(true);
    
    const avatarString = typeof latestAvatar === 'object' 
      ? JSON.stringify(latestAvatar) 
      : latestAvatar;
    
    createRoom(roomName, playerName, avatarString);
    
    // Navigation will happen when room-created event is received
    setTimeout(() => {
      setIsCreating(false);
    }, 1000);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!gamePin.trim()) {
      toast.error("Please enter a game PIN");
      return;
    }

    const latestAvatar = safeLoadAvatarConfig() || avatarConfig || createDefaultAvatarConfig();
    setAvatarConfig(latestAvatar);
    setIsJoining(true);
    
    const avatarString = typeof latestAvatar === 'object' 
      ? JSON.stringify(latestAvatar) 
      : latestAvatar;
    
    joinRoom(gamePin, playerName, avatarString);
    
    // Navigation will happen when joined event is received
    setTimeout(() => {
      setIsJoining(false);
    }, 1000);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Connecting...</CardTitle>
            <CardDescription>Please wait while we connect to the server</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Trivia Blitz</CardTitle>
            <CardDescription>Create or join a quiz game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Create Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Host Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room Name</label>
                    <Input
                      placeholder="Room name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      maxLength={30}
                    />
                  </div>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? "Creating..." : "Create Game"}
                  </Button>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Join Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Game PIN</label>
                    <Input
                      placeholder="Enter 6-digit PIN"
                      value={gamePin}
                      onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={isJoining}
                    variant="outline"
                    className="w-full"
                  >
                    {isJoining ? "Joining..." : "Join Game"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

