import { useGame } from "@/games/paint-and-guess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Star, Users } from "lucide-react";

export function RoundSummary() {
  const { gameState } = useGame();

  // Only show during round-ended phase
  if (gameState.gamePhase !== "round-ended" && gameState.gamePhase !== "game-ended") {
    return null;
  }

  // Sort players by score (descending)
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const topPlayer = sortedPlayers[0];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center pb-2">
          {gameState.gamePhase === "game-ended" ? (
            <>
              <div className="flex justify-center mb-2">
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl">Game Over!</CardTitle>
              {topPlayer && (
                <p className="text-lg text-muted-foreground mt-2">
                  🎉 <span className="font-bold text-foreground">{topPlayer.name}</span> wins with {topPlayer.score} points!
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl">Round {gameState.roundNumber} Complete</CardTitle>
              {gameState.revealedWord && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">The word was</p>
                  <p className="text-2xl font-bold tracking-wider">{gameState.revealedWord.toUpperCase()}</p>
                </div>
              )}
              {gameState.roundWinner && (
                <Badge className="mt-3 text-sm px-3 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                  <Star className="w-4 h-4 mr-1" />
                  {gameState.roundWinner.name} guessed it first!
                </Badge>
              )}
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="w-4 h-4" />
              <span>Scoreboard</span>
            </div>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${index === 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                    #{index + 1}
                  </span>
                  <span className="font-medium">{player.name}</span>
                  {player.id === gameState.roundWinner?.id && (
                    <Badge variant="outline" className="text-xs">
                      +Points
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                  <span className="font-bold">{player.score}</span>
                </div>
              </div>
            ))}
          </div>
          
          {gameState.gamePhase === "round-ended" && (
            <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">
              Next round starting soon...
            </p>
          )}
          
          {gameState.gamePhase === "game-ended" && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Thanks for playing! Start a new game when ready.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

