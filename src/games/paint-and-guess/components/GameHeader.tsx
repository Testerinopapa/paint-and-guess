import { useGame } from "@/games/paint-and-guess";
import { Badge } from "@/components/ui/badge";
import { Timer, Users, Pencil, Eye, Trophy, Clock } from "lucide-react";

export function GameHeader() {
  const { gameState } = useGame();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate word hint (show first letter and dashes for others)
  const getWordHint = () => {
    if (!gameState.currentDrawer || gameState.gamePhase !== "drawing") return null;
    // For guessers, we don't show any hint about the word length
    // This prevents cheating by counting letters
    return null;
  };

  return (
    <div className="bg-gradient-to-r from-primary to-secondary py-4 shadow-medium">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left side - Room info and role badge */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-foreground">
              Room: {gameState.roomId}
            </h1>
            {gameState.isGameActive && (
              <>
                {gameState.isDrawer ? (
                  <Badge variant="secondary" className="text-lg px-3 py-1 flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    You're Drawing!
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-lg px-3 py-1 flex items-center gap-2 bg-background/20 text-primary-foreground border-primary-foreground/30">
                    <Eye className="w-4 h-4" />
                    {gameState.currentDrawer?.name} is drawing
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Center - Timer and Round info */}
          {gameState.isGameActive && gameState.gamePhase === "drawing" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Timer className={`w-5 h-5 ${gameState.timeLeft <= 10 ? "animate-pulse text-red-300" : ""}`} />
                <span className={`text-xl font-bold ${gameState.timeLeft <= 10 ? "text-red-300" : ""}`}>
                  {formatTime(gameState.timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <Users className="w-5 h-5" />
                <span className="text-lg">
                  Round {gameState.roundNumber} / {gameState.maxRounds}
                </span>
              </div>
            </div>
          )}

          {/* Round ended state */}
          {gameState.gamePhase === "round-ended" && (
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Round Over
              </Badge>
              {gameState.revealedWord && (
                <span className="text-primary-foreground font-bold text-xl">
                  The word was: {gameState.revealedWord.toUpperCase()}
                </span>
              )}
              {gameState.roundWinner && (
                <Badge variant="default" className="text-lg px-3 py-1 flex items-center gap-2 bg-yellow-500 text-yellow-950">
                  <Trophy className="w-4 h-4" />
                  {gameState.roundWinner.name} won!
                </Badge>
              )}
            </div>
          )}

          {/* Game ended state */}
          {gameState.gamePhase === "game-ended" && (
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Game Over!
              </Badge>
            </div>
          )}

          {/* Right side - Word for drawer only */}
          {gameState.currentWord && gameState.isDrawer && gameState.gamePhase === "drawing" && (
            <div className="flex items-center gap-2 bg-background/20 rounded-lg px-4 py-2">
              <span className="text-primary-foreground/80 text-sm">Your word:</span>
              <span className="text-primary-foreground font-bold text-xl tracking-wider">
                {gameState.currentWord.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

