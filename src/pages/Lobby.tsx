import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Users, Plus, LogIn } from "lucide-react";
import { AvatarSelector } from "@/components/AvatarSelector";
import { DEFAULT_AVATAR, getStoredAvatar } from "@/lib/avatars";

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnected } = useGame();
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return getStoredAvatar() || DEFAULT_AVATAR.id;
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setIsCreating(true);
    try {
      const newRoomId = await createRoom(roomName);
      joinRoom(newRoomId, playerName, selectedAvatar);
      navigate(`/room/${newRoomId}`);
      toast.success("Room created!");
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }

    setIsJoining(true);
    try {
      joinRoom(roomId.toUpperCase(), playerName, selectedAvatar);
      navigate(`/room/${roomId.toUpperCase()}`);
      toast.success("Joined room!");
    } catch (error) {
      toast.error("Failed to join room");
    } finally {
      setIsJoining(false);
    }
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
            <CardTitle className="text-2xl">Multiplayer Draw & Guess</CardTitle>
            <CardDescription>Create or join a room to start playing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onAvatarChange={setSelectedAvatar}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Create Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Room
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
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Join Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room ID</label>
                    <Input
                      placeholder="Enter room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={isJoining}
                    variant="outline"
                    className="w-full"
                  >
                    {isJoining ? "Joining..." : "Join Room"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Up to 6 players per room</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

