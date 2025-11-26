import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const { gameState } = useTrivia();
  const leaderboard = gameState.leaderboard.length > 0 
    ? gameState.leaderboard 
    : gameState.players
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((player, index) => (
              <Card
                key={player.id}
                className={`p-4 ${
                  index === 0
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      {player.streak > 0 && (
                        <p className="text-xs text-muted-foreground">
                          🔥 {player.streak} streak
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{player.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

