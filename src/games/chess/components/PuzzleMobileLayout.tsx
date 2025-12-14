import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Puzzle as PuzzleIcon } from "lucide-react";
import { usePuzzle } from "../state/PuzzleContext";
import { ChessBoard } from "./ChessBoard";
import { NotificationBanner } from "./NotificationBanner";
import { PuzzleScoreSection } from "./PuzzleScoreSection";
import { PuzzleActionBar } from "./PuzzleActionBar";
import { useState, useMemo } from "react";

export function PuzzleMobileLayout() {
  const navigate = useNavigate();
  const {
    pz,
    fen,
    idx,
    solved,
    message,
    playerSide,
    pv,
    boardFen,
    loading,
    error,
    mistakes,
    hintsUsed,
    showSolution,
    onPieceDrop,
    resetPuzzle,
    showHintAction,
    toggleSolution,
    loadRandomPuzzle,
  } = usePuzzle();

  // Calculate progress through puzzle
  const progress = useMemo(() => {
    if (!pv.length) return 0;
    return Math.round((idx / pv.length) * 100);
  }, [idx, pv.length]);

  // Puzzle rating (from puzzle data)
  const puzzleRating = pz?.rating || 1500;
  
  // Current user rating (placeholder - would come from user profile/context)
  const currentRating = 625;
  
  // Score change (placeholder - would be calculated based on puzzle difficulty and performance)
  const scoreChange = solved ? 56 : 0; // Example: +56 when solved
  
  // Streak (placeholder - would come from user stats)
  const streak = 11;
  
  // Next puzzle number (placeholder - could be based on puzzle count)
  const nextPuzzleNumber = pz ? 7 : undefined;

  const handleMove = (from: string, to: string) => {
    return onPieceDrop({ sourceSquare: from, targetSquare: to });
  };

  const handleRestart = () => {
    resetPuzzle();
  };

  const handleAnalysis = () => {
    toggleSolution();
  };

  const handleNext = () => {
    // Load next random puzzle
    loadRandomPuzzle();
  };

  const handleOptions = () => {
    // TODO: Open puzzle options/settings
    console.log("Options clicked");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <PuzzleIcon className="w-5 h-5 text-amber-700" />
          <span className="text-lg font-bold">Puzzles</span>
          {pz && (
            <span className="text-sm text-muted-foreground">#{pz.id.slice(-3)}</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOptions}
          className="h-9 w-9"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Puzzle Solved Notification */}
      {solved && (
        <NotificationBanner message="Puzzle Solved!" variant="success" />
      )}

      {/* Score/Progress Section */}
      {pz && (
        <PuzzleScoreSection
          rating={currentRating}
          scoreChange={scoreChange}
          streak={streak}
          progress={progress}
          nextPuzzleNumber={nextPuzzleNumber}
        />
      )}

      {/* Chess Board - Fixed size, no scroll */}
      <div 
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        {boardFen ? (
          <ChessBoard 
            fen={boardFen}
            orientation={playerSide}
            onMove={handleMove}
            disabled={solved || showSolution || !pz}
            responsive={true}
          />
        ) : (
          <div className="text-center text-muted-foreground p-8">
            {loading ? (
              <p>Loading puzzle...</p>
            ) : error ? (
              <div>
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => loadRandomPuzzle()} variant="default">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-lg mb-2">No puzzle loaded</p>
                  <p className="text-sm mb-4">Start solving puzzles to improve your chess skills</p>
                </div>
                <Button onClick={() => loadRandomPuzzle()} variant="default" size="lg">
                  Load Puzzle
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <PuzzleActionBar
        onRestart={handleRestart}
        onAnalysis={handleAnalysis}
        onNext={handleNext}
        canRestart={!!pz}
        canNext={solved || !!error}
      />
    </div>
  );
}
