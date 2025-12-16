import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock, X, TrendingUp } from "lucide-react";
import type { PuzzleRushStats } from "../state/puzzleRushTypes";

interface PuzzleRushResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: PuzzleRushStats | null;
  onPlayAgain: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatAverageTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

export function PuzzleRushResults({ open, onOpenChange, stats, onPlayAgain }: PuzzleRushResultsProps) {
  if (!stats) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Puzzle Rush Complete!
          </DialogTitle>
          <DialogDescription>
            Great job! Here's how you performed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Score */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Puzzles Solved</span>
                </div>
                <span className="text-2xl font-bold">{stats.puzzlesSolved}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Time */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total Time</span>
                </div>
                <span className="text-lg font-semibold">{formatTime(stats.totalTime)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Average Time */}
          {stats.puzzlesSolved > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Avg. Time/Puzzle</span>
                  </div>
                  <span className="text-lg font-semibold">{formatAverageTime(stats.averageTimePerPuzzle)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strikes */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Strikes Used</span>
                </div>
                <span className="text-lg font-semibold">{stats.strikesUsed} / 3</span>
              </div>
            </CardContent>
          </Card>

          {/* Final Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Final Difficulty</span>
                </div>
                <span className="text-lg font-semibold">~{stats.finalRating} rating</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onPlayAgain}>
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

