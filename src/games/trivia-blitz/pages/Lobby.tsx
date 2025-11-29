import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Users, Plus, LogIn } from "lucide-react";
import { AvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
}

export default function Lobby() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnected, gameState } = useTrivia();
  const { user, isAuthenticated } = useAuth();

  // Navigate to room when created or joined
  useEffect(() => {
    if (gameState.roomId) {
      navigate(`/games/trivia-blitz/room/${gameState.roomId}`);
    }
  }, [gameState.roomId, navigate]);

  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState(() => {
    // Auto-fill with username if authenticated
    return user?.username || "";
  });
  const [gamePin, setGamePin] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("general");
  const [quizzes] = useState<Quiz[]>([
    {
      id: "general",
      name: "General Knowledge",
      description: "Mix of science, history, geography, and more",
      icon: "🧠",
      questionCount: 5,
    },
    // Future quizzes can be added here
  ]);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    // Try to load from user first, then localStorage
    if (user?.avatarConfig) {
      try {
        return JSON.parse(user.avatarConfig);
      } catch {
        // Fall through to localStorage
      }
    }
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

  // Update player name when user changes
  useEffect(() => {
    if (user?.username && !playerName) {
      setPlayerName(user.username);
    }
  }, [user, playerName]);

  // Update avatar config when user changes
  useEffect(() => {
    if (user?.avatarConfig) {
      try {
        const parsed = JSON.parse(user.avatarConfig);
        setAvatarConfig(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, [user]);

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
    
    createRoom(roomName, playerName, avatarString, selectedQuiz);
    
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

            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Customize your avatar from the left sidebar before creating or joining a room.
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiz Set</label>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto p-1">
                      {quizzes.map((quiz) => (
                        <button
                          key={quiz.id}
                          type="button"
                          onClick={() => setSelectedQuiz(quiz.id)}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all hover:bg-accent",
                            selectedQuiz === quiz.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{quiz.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{quiz.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {quiz.description}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {quiz.questionCount} questions
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
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

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>2-12 players per game</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

