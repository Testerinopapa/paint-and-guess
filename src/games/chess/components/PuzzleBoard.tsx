import { useState, useCallback, useMemo, useEffect } from "react";
import { usePuzzle } from "../state/PuzzleContext";
import { ChessBoard } from "./ChessBoard";
import { debugBoard, isDebugEnabled } from "../utils/debug";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Lightbulb, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

export function PuzzleBoard() {
  const { 
    pz, fen, idx, solved, message, showHint, playerSide,
    pv, boardFen, sideToMove,
    onPieceDrop, resetPuzzle, showHintAction, toggleSolution,
    loading, error, mistakes, hintsUsed, showSolution
  } = usePuzzle();
  
  const [hintSquares, setHintSquares] = useState<string[]>([]);
  const [lastMoveResult, setLastMoveResult] = useState<"correct" | "incorrect" | null>(null);

  // Expected move computation
  const expectedMove = useMemo(() => {
    if (!pv || idx >= pv.length) {
      return null;
    }
    const move = pv[idx];
    return {
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      uci: move,
    };
  }, [pv, idx]);

  // Square styles for hints (following document pattern)
  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (showHint && pv[idx]) {
      const uci = pv[idx];
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      styles[from] = { 
        outline: "2px solid rgba(234,179,8,.9)", 
        outlineOffset: "-2px", 
        backgroundColor: "rgba(234,179,8,.15)" 
      };
      styles[to] = { 
        outline: "2px solid rgba(234,179,8,.9)", 
        outlineOffset: "-2px", 
        backgroundColor: "rgba(234,179,8,.15)" 
      };
    }
    return styles;
  }, [showHint, pv, idx]);

  const handleMove = useCallback((from: string, to: string) => {
    if (isDebugEnabled()) {
      console.log("[PUZZLE BOARD] Move received from ChessBoard", { from, to });
    }
    const success = onPieceDrop({ sourceSquare: from, targetSquare: to });
    setLastMoveResult(success ? "correct" : "incorrect");
    
    if (success) {
      setTimeout(() => setLastMoveResult(null), 2000);
    } else {
      setTimeout(() => setLastMoveResult(null), 3000);
    }
    
    return success;
  }, [onPieceDrop]);

  const handleShowHint = useCallback(() => {
    if (expectedMove) {
      setHintSquares([expectedMove.from, expectedMove.to]);
      showHintAction();
      setTimeout(() => setHintSquares([]), 3000);
    }
  }, [expectedMove, showHintAction]);

  const progress = useMemo(() => {
    if (!pv.length) return 0;
    return Math.round((idx / pv.length) * 100);
  }, [idx, pv.length]);

  // Debug: Log FEN changes
  useEffect(() => {
    if (isDebugEnabled() && fen) {
      debugBoard.fenUpdate(undefined, fen);
    }
  }, [fen]);

  // Always render the board - use conditional overlays for different states
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 relative">
      {/* Move Feedback */}
      {(lastMoveResult || message) && (
        <Alert 
          variant={lastMoveResult === "correct" || !lastMoveResult ? "default" : "destructive"}
          className="max-w-md z-10"
        >
          <AlertDescription className="flex items-center gap-2">
            {lastMoveResult === "correct" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Correct! {solved ? "Puzzle solved!" : "Opponent's move played automatically."}
              </>
            ) : message ? (
              <>
                <XCircle className="w-4 h-4" />
                {message}
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

      {/* Chess Board - Only render when we have a valid FEN */}
      {boardFen && (
        <div className="relative">
          <ChessBoard 
            fen={boardFen}
            orientation={playerSide}
            onMove={pz ? handleMove : undefined}
            disabled={!pz || solved || showSolution}
          />
          {isDebugEnabled() && pz && (
            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-2 rounded font-mono z-20">
              <div>FEN: {fen || "N/A"}</div>
              <div>Move: {idx + 1}/{pv.length}</div>
              <div>Solved: {solved ? "Yes" : "No"}</div>
              <div>Mistakes: {mistakes}</div>
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
      )}


      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Empty State Message */}
      {!loading && !error && !pz && (
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground text-center text-lg">
            No puzzle loaded.<br />
            <span className="text-sm">Click "Solve Puzzles" to start.</span>
          </p>
        </div>
      )}

      {/* Controls - Only show when puzzle is active */}
      {pz && (
        <>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleShowHint}
              variant="outline"
              disabled={solved || showSolution}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({hintsUsed})
            </Button>
            <Button
              onClick={resetPuzzle}
              variant="outline"
              disabled={solved}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={toggleSolution}
              variant="outline"
            >
              <Info className="w-4 h-4 mr-2" />
              {showSolution ? "Hide" : "Show"} Solution
            </Button>
          </div>

          {/* Solution Display */}
          {showSolution && (
            <div className="max-w-md p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Solution:</p>
              <div className="flex flex-wrap gap-2">
                {pv.map((move, moveIdx) => {
                  const from = move.slice(0, 2);
                  const to = move.slice(2, 4);
                  return (
                    <Badge
                      key={moveIdx}
                      variant={moveIdx < idx ? "default" : "outline"}
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

