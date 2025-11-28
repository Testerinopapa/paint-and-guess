import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrivia } from "../state/TriviaContext";
import { Users, LogOut, Play, Copy, Check } from "lucide-react";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview/AvatarPreview";
import { decodeAvatarConfig, type AvatarConfig } from "@/lib/avatar/config";
import { useState } from "react";
import { toast } from "sonner";

interface LobbyViewProps {
  onLeaveRoom: () => void;
}

export default function LobbyView({ onLeaveRoom }: LobbyViewProps) {
  const { gameState, isHost, startGame } = useTrivia();
  const [pinCopied, setPinCopied] = useState(false);

  const handleStartGame = () => {
    if (gameState.players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }
    startGame();
  };

  const handleCopyPin = () => {
    if (gameState.gamePin) {
      navigator.clipboard.writeText(gameState.gamePin);
      setPinCopied(true);
      toast.success("PIN copied to clipboard!");
      setTimeout(() => setPinCopied(false), 2000);
    }
  };

  const playerCount = gameState.players.length;
  const minPlayers = 2;
  const maxPlayers = 12;
  const canStart = playerCount >= minPlayers;

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 h-[calc(100vh-8rem)] max-h-screen overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
        {/* Left Sidebar - Players */}
        <div className="lg:col-span-1 flex flex-col min-h-[200px] lg:min-h-0 lg:max-h-full">
          <div className="flex-shrink-0 overflow-y-auto mb-3 sm:mb-4 max-h-[300px] lg:max-h-none">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Players ({playerCount})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {playerCount < minPlayers
                    ? `Need ${minPlayers - playerCount} more player${minPlayers - playerCount > 1 ? 's' : ''}`
                    : `${playerCount} / ${maxPlayers} players`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  {gameState.players.map((player) => {
                    // Get avatar config from player.avatar (string or object)
                    let avatarConfig: AvatarConfig | null = null;
                    if (player.avatar) {
                      if (typeof player.avatar === 'string') {
                        avatarConfig = decodeAvatarConfig(player.avatar);
                      } else {
                        avatarConfig = player.avatar as AvatarConfig;
                      }
                    }

                    const isHostPlayer = player.id === gameState.ownerId;
                    
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isHostPlayer
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {avatarConfig ? (
                            <AvatarPreview config={avatarConfig} size={32} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">{player.name[0].toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{player.name}</p>
                            {isHostPlayer && (
                              <p className="text-xs text-muted-foreground">Host</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game PIN Section */}
          {gameState.gamePin && (
            <Card className="flex-shrink-0 mb-3 sm:mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Game PIN</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Share this PIN with friends to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-center">
                    <span className="text-2xl sm:text-3xl font-bold tracking-wider">
                      {gameState.gamePin}
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyPin}
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                  >
                    {pinCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Game Section */}
          <Card className="flex-shrink-0 mb-3 sm:mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                {isHost ? "Start Game" : "Waiting"}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {playerCount < minPlayers
                  ? "Waiting for more players..."
                  : isHost
                  ? "Ready to start when you are"
                  : "Waiting for host to start"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {isHost && (
                <Button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {canStart ? "Start Game" : "Waiting for players..."}
                </Button>
              )}

              {!isHost && (
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {canStart
                      ? "Ready! Waiting for host to start."
                      : "Waiting for more players to join."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={onLeaveRoom}
            variant="outline"
            className="w-full flex-shrink-0 text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>

        {/* Main Area - Game Rules */}
        <div className="lg:col-span-1 flex flex-col min-h-[250px] lg:min-h-0 lg:max-h-full">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-base sm:text-lg">Game Rules</CardTitle>
              <CardDescription className="text-xs sm:text-sm">How to play Trivia Blitz</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 min-h-0">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">⚡ Fast-Paced Questions</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Answer questions as quickly as possible. Faster correct answers earn more points!
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">🎯 Scoring System</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Base points: 1000. Speed bonus: Up to 2x multiplier. Streak bonus: Up to 500 points for consecutive correct answers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">🏆 Leaderboard</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    See your ranking after each question. Climb to the top by answering correctly and quickly!
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">⏱️ Timer</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Each question has a time limit. The question ends automatically when all players answer or time runs out.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">👑 Host Role</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    The host can see answer statistics in real-time but doesn't participate in answering questions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Room Info */}
        <div className="lg:col-span-1 flex flex-col min-h-[300px] lg:min-h-0 lg:max-h-full">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-base sm:text-lg">Room Info</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Game settings</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 min-h-0">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Room Name</p>
                  <p className="font-semibold text-sm sm:text-base">{gameState.roomId || "Loading..."}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Players</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {playerCount} / {maxPlayers}
                    </Badge>
                    {playerCount < minPlayers && (
                      <span className="text-xs text-muted-foreground">
                        Need {minPlayers - playerCount} more
                      </span>
                    )}
                  </div>
                </div>
                {gameState.quizName && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Quiz Set</p>
                    <p className="font-semibold text-sm sm:text-base">{gameState.quizName}</p>
                  </div>
                )}
                {gameState.totalQuestions > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Questions</p>
                    <p className="font-semibold text-sm sm:text-base">{gameState.totalQuestions} questions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

