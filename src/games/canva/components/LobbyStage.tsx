import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Play, Users } from "lucide-react";
import { useCanva } from "../state/CanvaContext";

interface LobbyStageProps {
  onLeaveRoom: () => void;
}

export function LobbyStage({ onLeaveRoom }: LobbyStageProps) {
  const { gameState, isHost, setReady, startGame } = useCanva();
  const playerCount = gameState.players.length;

  const handleReadyToggle = () => {
    setReady(!gameState.isReady);
  };

  const handleStartGame = () => {
    startGame();
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 h-[calc(100vh-5rem)] max-h-screen overflow-y-auto">
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
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
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
                      {player.isReady && (
                        <span className="text-xs text-green-600 font-semibold">✓ Ready</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ready Up Section */}
          <Card className="flex-shrink-0 mb-3 sm:mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Ready Up
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {playerCount < 2
                  ? "Waiting for more players..."
                  : gameState.allPlayersReady
                  ? "All players ready!"
                  : "Click ready when you're prepared to start"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleReadyToggle}
                variant={gameState.isReady ? "default" : "outline"}
                className="w-full"
                disabled={playerCount < 2}
              >
                {gameState.isReady ? "✓ Ready" : "Not Ready"}
              </Button>

              {isHost && (
                <Button
                  onClick={handleStartGame}
                  disabled={!gameState.allPlayersReady || playerCount < 2}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              )}

              <Button
                onClick={onLeaveRoom}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Leave Room
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Area - Instructions */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Canva - Collaborative Drawing Game</CardTitle>
              <CardDescription>
                Draw and guess words in real-time with your friends!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Play:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base">
                  <li>Wait for all players to ready up</li>
                  <li>The host will start the game</li>
                  <li>One player will be chosen to draw a word</li>
                  <li>Other players try to guess the word</li>
                  <li>Points are awarded for correct guesses</li>
                  <li>The drawer rotates each round</li>
                </ol>
              </div>

              {gameState.gamePin && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Room PIN:</p>
                  <p className="text-2xl font-bold">{gameState.gamePin}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this PIN with friends to join
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

