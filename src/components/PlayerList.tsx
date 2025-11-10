import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Pencil } from "lucide-react";

export function PlayerList() {
  const { gameState } = useGame();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players ({gameState.players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted"
            >
              <div className="flex items-center gap-2">
                {gameState.currentDrawer?.id === player.id && (
                  <Pencil className="w-4 h-4 text-primary" />
                )}
                <span className="font-medium">{player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{player.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

