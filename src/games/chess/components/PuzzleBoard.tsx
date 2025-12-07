import { useState, useCallback, useMemo, useEffect } from "react";
import { usePuzzle } from "../state/PuzzleContext";
import { useChess } from "../state/ChessContext";
import { ChessBoard } from "./ChessBoard";
import { debugBoard, debugPuzzleState, isDebugEnabled } from "../utils/debug";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Lightbulb, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

export function PuzzleBoard() {
  const { puzzleState, makeMove, showHint, resetPuzzle, toggleSolution, loading, error } = usePuzzle();
  const chessContext = useChess();
  const [hintSquares, setHintSquares] = useState<string[]>([]);
  const [lastMoveResult, setLastMoveResult] = useState<"correct" | "incorrect" | null>(null);

  const expectedMove = useMemo(() => {
    if (!puzzleState.solutionPv || puzzleState.moveIndex >= puzzleState.solutionPv.length) {
      return null;
    }
    const move = puzzleState.solutionPv[puzzleState.moveIndex];
    return {
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      uci: move,
    };
  }, [puzzleState.solutionPv, puzzleState.moveIndex]);

  const handleMove = useCallback((from: string, to: string) => {
    if (isDebugEnabled()) {
      console.log("[PUZZLE BOARD] Move received from ChessBoard", { from, to });
    }
    const success = makeMove(from, to);
    setLastMoveResult(success ? "correct" : "incorrect");
    
    if (success) {
      setTimeout(() => setLastMoveResult(null), 2000);
    } else {
      setTimeout(() => setLastMoveResult(null), 3000);
    }
    
    return success;
  }, [makeMove]);

  const handleShowHint = useCallback(() => {
    if (expectedMove) {
      setHintSquares([expectedMove.from, expectedMove.to]);
      showHint();
      setTimeout(() => setHintSquares([]), 3000);
    }
  }, [expectedMove, showHint]);

  const progress = useMemo(() => {
    if (!puzzleState.solutionPv.length) return 0;
    return Math.round((puzzleState.moveIndex / puzzleState.solutionPv.length) * 100);
  }, [puzzleState.moveIndex, puzzleState.solutionPv.length]);


  // Debug: Log state changes
  useEffect(() => {
    if (isDebugEnabled() && puzzleState.puzzle) {
      debugPuzzleState(puzzleState);
    }
  }, [puzzleState.currentFen, puzzleState.moveIndex, puzzleState.solved]);

  // Debug: Log FEN changes
  useEffect(() => {
    if (isDebugEnabled() && puzzleState.currentFen) {
      debugBoard.fenUpdate(undefined, puzzleState.currentFen);
    }
  }, [puzzleState.currentFen]);

  // Determine board FEN - show puzzle FEN as soon as puzzle data is loaded (even before "Start Puzzle")
  // This allows pieces to appear immediately, and clicking "Start Puzzle" just enables interaction
  const boardFen = puzzleState.puzzle 
    ? puzzleState.currentFen 
    : undefined;

  // Determine board orientation - use puzzle sideToMove when puzzle exists, otherwise default to white
  const boardOrientation = puzzleState.puzzle 
    ? (puzzleState.puzzle.sideToMove === "white" ? "white" : "black")
    : "white";

  // Always render the board - use conditional overlays for different states
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 relative">
      {/* Move Feedback */}
      {lastMoveResult && (
        <Alert 
          variant={lastMoveResult === "correct" ? "default" : "destructive"}
          className="max-w-md z-10"
        >
          <AlertDescription className="flex items-center gap-2">
            {lastMoveResult === "correct" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Correct! {puzzleState.solved ? "Puzzle solved!" : "Opponent's move played automatically."}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Incorrect. Try again.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Chess Board - ALWAYS RENDERED */}
      <div className="relative">
        <ChessBoard 
          fen={boardFen}
          orientation={boardOrientation}
          onMove={puzzleState.loadedOntoBoard ? handleMove : undefined}
          disabled={!puzzleState.loadedOntoBoard || puzzleState.solved || puzzleState.showSolution}
        />
        {isDebugEnabled() && puzzleState.loadedOntoBoard && (
          <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-2 rounded font-mono z-20">
            <div>FEN: {puzzleState.currentFen}</div>
            <div>Move: {puzzleState.moveIndex + 1}/{puzzleState.solutionPv.length}</div>
            <div>Solved: {puzzleState.solved ? "Yes" : "No"}</div>
            <div>Mistakes: {puzzleState.mistakes}</div>
          </div>
        )}
        {/* Hint Overlay */}
        {hintSquares.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {hintSquares.map((square, idx) => (
              <div
                key={idx}
                className="absolute border-4 border-yellow-400 rounded"
                style={{
                  left: `${((square.charCodeAt(0) - 97) * 60)}px`,
                  top: `${((8 - parseInt(square[1])) * 60)}px`,
                  width: "60px",
                  height: "60px",
                  animation: "pulse 1s infinite",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <p className="text-muted-foreground text-lg">Loading puzzle...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Empty State Overlay */}
      {!loading && !error && !puzzleState.puzzle && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <p className="text-muted-foreground text-center text-lg">
            No puzzle loaded.<br />
            <span className="text-sm">Click "Solve Puzzles" to start.</span>
          </p>
        </div>
      )}


      {/* Controls - Only show when puzzle is active */}
      {puzzleState.loadedOntoBoard && (
        <>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleShowHint}
              variant="outline"
              disabled={puzzleState.solved || puzzleState.showSolution}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({puzzleState.hintsUsed})
            </Button>
            <Button
              onClick={resetPuzzle}
              variant="outline"
              disabled={puzzleState.solved}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={toggleSolution}
              variant="outline"
            >
              <Info className="w-4 h-4 mr-2" />
              {puzzleState.showSolution ? "Hide" : "Show"} Solution
            </Button>
          </div>

          {/* Solution Display */}
          {puzzleState.showSolution && (
            <div className="max-w-md p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Solution:</p>
              <div className="flex flex-wrap gap-2">
                {puzzleState.solutionPv.map((move, idx) => {
                  const from = move.slice(0, 2);
                  const to = move.slice(2, 4);
                  return (
                    <Badge
                      key={idx}
                      variant={idx < puzzleState.moveIndex ? "default" : "outline"}
                    >
                      {from}→{to}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

