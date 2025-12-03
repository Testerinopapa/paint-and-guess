import { useEffect, useState } from "react";
import { PuzzleProvider, usePuzzle } from "../state/PuzzleContext";
import { PuzzleBoard } from "../components/PuzzleBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { PuzzleDifficulty, PuzzleMotif } from "../state/puzzleTypes";

const DIFFICULTIES: PuzzleDifficulty[] = ["easy", "medium", "hard", "expert"];
const MOTIFS: PuzzleMotif[] = [
  "tactics",
  "endgame",
  "checkmate",
  "fork",
  "pin",
  "skewer",
  "discovery",
  "deflection",
  "sacrifice",
  "backrank",
  "promotion",
];

function PuzzleContent() {
  const {
    puzzleState,
    loadPuzzle,
    makeMove,
    getHint,
    resetPuzzle,
    nextPuzzle,
    currentFen,
    solutionMoves,
    currentMoveIndex,
  } = usePuzzle();

  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficulty | undefined>();
  const [selectedMotif, setSelectedMotif] = useState<PuzzleMotif | undefined>();
  const [hintText, setHintText] = useState<string | null>(null);

  useEffect(() => {
    // Load initial puzzle
    loadPuzzle();
  }, [loadPuzzle]);

  const handleLoadPuzzle = async () => {
    await loadPuzzle(selectedDifficulty, selectedMotif);
    setHintText(null);
  };

  const handleGetHint = () => {
    const hint = getHint();
    if (hint) {
      setHintText(hint);
      toast.info(hint);
    } else {
      toast.info("No more hints available");
    }
  };

  const handleMove = (from: string, to: string) => {
    const success = makeMove(from, to);
    if (!success) {
      toast.error("Incorrect move! Try again.");
    } else if (puzzleState.isSolved) {
      toast.success("Puzzle solved! 🎉");
    }
  };

  const progress = solutionMoves.length > 0 
    ? Math.round((currentMoveIndex / solutionMoves.length) * 100)
    : 0;

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chess Puzzle</CardTitle>
              <CardDescription>
                {puzzleState.currentPuzzle?.description || "Find the best move sequence"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {puzzleState.currentPuzzle && (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {puzzleState.currentPuzzle.difficulty}
                    </Badge>
                    {puzzleState.currentPuzzle.rating && (
                      <Badge variant="secondary">
                        Rating: {puzzleState.currentPuzzle.rating}
                      </Badge>
                    )}
                    {puzzleState.currentPuzzle.motifs.map((motif) => (
                      <Badge key={motif} variant="outline">
                        {motif}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <PuzzleBoard 
                      fen={currentFen}
                      orientation={puzzleState.currentPuzzle.fen.includes(" w ") ? "white" : "black"}
                      onMove={handleMove}
                      disabled={puzzleState.isSolved}
                    />
                  </div>

                  {puzzleState.isSolved && (
                    <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 font-semibold">
                        ✅ Puzzle Solved! Great job!
                      </p>
                    </div>
                  )}

                  {hintText && (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <p className="text-blue-800 dark:text-blue-200">
                        💡 Hint: {hintText}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentMoveIndex} / {solutionMoves.length} moves</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              {!puzzleState.currentPuzzle && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading puzzle...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Puzzle Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={selectedDifficulty || "all"}
                  onValueChange={(value) =>
                    setSelectedDifficulty(value === "all" ? undefined : (value as PuzzleDifficulty))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All difficulties</SelectItem>
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff} value={diff}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motif</label>
                <Select
                  value={selectedMotif || "all"}
                  onValueChange={(value) =>
                    setSelectedMotif(value === "all" ? undefined : (value as PuzzleMotif))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All motifs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All motifs</SelectItem>
                    {MOTIFS.map((motif) => (
                      <SelectItem key={motif} value={motif}>
                        {motif.charAt(0).toUpperCase() + motif.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleLoadPuzzle} size="lg">
                  Load Puzzle
                </Button>
                <Button onClick={nextPuzzle} variant="outline">
                  Next Puzzle
                </Button>
                <Button onClick={resetPuzzle} variant="outline" disabled={!puzzleState.currentPuzzle}>
                  Reset Puzzle
                </Button>
                <Button onClick={handleGetHint} variant="outline" disabled={puzzleState.isSolved}>
                  Get Hint
                </Button>
              </div>
            </CardContent>
          </Card>

          {puzzleState.currentPuzzle && (
            <Card>
              <CardHeader>
                <CardTitle>Puzzle Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Moves to solve:</span> {solutionMoves.length}
                </div>
                <div>
                  <span className="font-medium">Current move:</span> {currentMoveIndex + 1}
                </div>
                {puzzleState.attempt && (
                  <div>
                    <span className="font-medium">Mistakes:</span> {puzzleState.attempt.attempts}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PuzzlePage() {
  return (
    <PuzzleProvider>
      <PuzzleContent />
    </PuzzleProvider>
  );
}

