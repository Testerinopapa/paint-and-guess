import { usePuzzleRush } from "../state/PuzzleRushContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, X, Trophy } from "lucide-react";

// Helper function to format time (MM:SS)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PuzzleRushOverlay() {
  const { session, timeRemaining, isActive } = usePuzzleRush();

  if (!isActive || !session) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-64 shadow-lg">
        <CardContent className="p-4 space-y-3">
          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Score</span>
            </div>
            <Badge variant="default" className="text-lg font-bold">
              {session.score}
            </Badge>
          </div>

          {/* Timer (only for timed modes) */}
          {timeRemaining !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <Badge
                variant={timeRemaining < 30 ? "destructive" : "secondary"}
                className="font-mono text-base"
              >
                {formatTime(timeRemaining)}
              </Badge>
            </div>
          )}

          {/* Strikes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Strikes</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((strike) => (
                <div
                  key={strike}
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    strike < session.strikes
                      ? "bg-red-500 border-red-600"
                      : "bg-muted border-muted-foreground/30"
                  }`}
                >
                  {strike < session.strikes && (
                    <X className="h-3 w-3 text-white" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Puzzle Number */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Puzzle #{session.currentPuzzleNumber + 1}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

