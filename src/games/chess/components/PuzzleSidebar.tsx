import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePuzzle } from "../state/PuzzleContext";
import { Settings, Puzzle, Flame, Calendar, Shield, Book, BarChart3 } from "lucide-react";
import type { PuzzleDifficulty } from "../state/puzzleTypes";

// Motifs removed - no longer needed for hardcoded puzzles

interface PuzzleSidebarProps {
  difficulty: PuzzleDifficulty;
  setDifficulty: (d: PuzzleDifficulty) => void;
  minRating: string;
  setMinRating: (r: string) => void;
  maxRating: string;
  setMaxRating: (r: string) => void;
  motif: string;
  setMotif: (m: string) => void;
  onLoadPuzzle: () => void;
  loading: boolean;
}

// Note: Filters are kept for API compatibility but ignored (hardcoded puzzle)

export function PuzzleSidebar({
  difficulty,
  setDifficulty,
  minRating,
  setMinRating,
  maxRating,
  setMaxRating,
  motif,
  setMotif,
  onLoadPuzzle,
  loading,
}: PuzzleSidebarProps) {
  const { pz, idx, solved, pv } = usePuzzle();
  const puzzleRating = pz?.rating || 0;
  const streak = 6; // TODO: Implement streak tracking

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            <CardTitle className="text-xl">Puzzles</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info Section */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Think you're faster than most solvers? Try warming up with a Puzzle Battle!
              </p>
            </div>
          </div>

          {/* Rating Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{puzzleRating || 0}</span>
            </div>
            
            {/* Streak Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={(streak / 10) * 100} className="h-2" />
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">{streak}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Button */}
      <Button
        onClick={onLoadPuzzle}
        size="lg"
        className="w-full h-12 text-base font-semibold"
        disabled={loading}
      >
        {loading ? "Loading..." : "Solve Puzzles"}
      </Button>

      {/* Puzzle Settings - Simplified (no database filters) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
          <CardDescription>Puzzle mode (hardcoded puzzle)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Using a simple hardcoded puzzle. Filters are disabled.
          </div>
        </CardContent>
      </Card>

      {/* Other Puzzle Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">More Puzzles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Flame className="mr-2 h-4 w-4" />
            Puzzle Rush
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Daily Puzzle
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Shield className="mr-2 h-4 w-4" />
            Puzzle Battle
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Book className="mr-2 h-4 w-4" />
            Custom Puzzles
          </Button>
        </CardContent>
      </Card>

      {/* Stats Link */}
      <Button variant="ghost" className="w-full justify-start" disabled>
        <BarChart3 className="mr-2 h-4 w-4" />
        Stats
      </Button>

      {/* Current Puzzle Info */}
      {pz && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Puzzle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-semibold">
                You are: <span className="capitalize ml-1">{pz.sideToMove}</span>
              </Badge>
            </div>
            {pz.rating && (
              <div className="text-sm text-muted-foreground">
                Rating: {pz.rating}
              </div>
            )}
            {pz.motifs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pz.motifs.slice(0, 3).map((m, moveIdx) => (
                  <Badge key={moveIdx} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
            {!solved && (
              <div className="text-sm text-muted-foreground">
                Move {idx + 1} / {pv.length}
              </div>
            )}
            {solved && (
              <Badge variant="default" className="bg-green-600">
                ✓ Solved!
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

