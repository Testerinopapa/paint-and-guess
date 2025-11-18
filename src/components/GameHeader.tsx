import { useGame } from "@/contexts/GameContext";
import { Badge } from "@/shared/ui/badge";
import { Timer, Users } from "lucide-react";

export function GameHeader() {
  const { gameState } = useGame();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-r from-primary to-secondary py-4 shadow-medium">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-foreground">
              Room: {gameState.roomId}
            </h1>
            {gameState.isDrawer && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                You're Drawing!
              </Badge>
            )}
          </div>

          {gameState.isGameActive && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Timer className="w-5 h-5" />
                <span className="text-xl font-bold">
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

          {gameState.currentWord && gameState.isDrawer && (
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground font-bold text-xl">
                Word: {gameState.currentWord.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

