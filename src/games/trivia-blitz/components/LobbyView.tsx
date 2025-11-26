import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import { Users } from "lucide-react";

interface LobbyViewProps {
  onLeaveRoom: () => void;
}

export default function LobbyView({ onLeaveRoom }: LobbyViewProps) {
  const { gameState, isHost, startGame } = useTrivia();

  const handleStartGame = () => {
    if (gameState.players.length < 2) {
      return;
    }
    startGame();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
          <CardDescription>
            {gameState.gamePin && `Share PIN: ${gameState.gamePin}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({gameState.players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gameState.players.map((player) => (
                <Card key={player.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {player.avatar && (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {typeof player.avatar === 'string' ? (
                          <span className="text-sm">{player.avatar[0]}</span>
                        ) : (
                          <span className="text-sm">{player.name[0]}</span>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{player.name}</p>
                      {player.id === gameState.ownerId && (
                        <p className="text-xs text-muted-foreground">Host</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {isHost && (
            <div className="flex justify-center">
              <Button
                onClick={handleStartGame}
                disabled={gameState.players.length < 2}
                size="lg"
                className="w-full md:w-auto"
              >
                {gameState.players.length < 2
                  ? "Waiting for players..."
                  : "Start Game"}
              </Button>
            </div>
          )}

          {!isHost && (
            <div className="text-center text-muted-foreground">
              Waiting for host to start the game...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

