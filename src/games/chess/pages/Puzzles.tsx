import { useState, useEffect } from "react";
import { PuzzleProvider, usePuzzle } from "../state/PuzzleContext";
import { PuzzleRushProvider, usePuzzleRush } from "../state/PuzzleRushContext";
import { PuzzleBoard } from "../components/PuzzleBoard";
import { PuzzleSidebar } from "../components/PuzzleSidebar";
import { PuzzleMobileLayout } from "../components/PuzzleMobileLayout";
import { PuzzleRushOverlay } from "../components/PuzzleRushOverlay";
import { PuzzleRushBridge } from "../components/PuzzleRushBridge";
import { PuzzleRushResults } from "../components/PuzzleRushResults";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import type { PuzzleDifficulty, PuzzleFilters } from "../state/puzzleTypes";

function PuzzlesContent() {
  const { loadRandomPuzzle, loading } = usePuzzle();
  const { stats, session, startSession } = usePuzzleRush();
  const isMobile = useIsMobile();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("medium");
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [motif, setMotif] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const handleLoadPuzzle = () => {
    const filters: PuzzleFilters = {
      difficulty: difficulty === "custom" ? undefined : difficulty,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      motif: motif || undefined,
    };
    loadRandomPuzzle(filters);
  };

  // Render mobile layout on mobile devices
  if (isMobile) {
    return (
      <div className="md:hidden -m-4 md:m-0 h-[calc(100vh-4rem)]">
        <PuzzleMobileLayout />
      </div>
    );
  }

  // Watch for session end to show results
  useEffect(() => {
    // Only auto-open when stats are first set (new session ended)
    if (stats && !showResults) {
      setShowResults(true);
    }
    // Reset showResults when stats are cleared (new session started)
    if (!stats && showResults) {
      setShowResults(false);
    }
  }, [stats, showResults]);

  // Desktop layout
  return (
    <>
      <PuzzleRushOverlay />
      <PuzzleRushBridge />
      <PuzzleRushResults
        open={showResults}
        onOpenChange={setShowResults}
        stats={stats}
        onPlayAgain={() => {
          setShowResults(false);
          // Restart with the same mode as the previous session
          if (stats?.mode) {
            startSession(stats.mode, loadRandomPuzzle);
          }
        }}
      />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] w-full gap-4 p-4">
        {/* Center: Chess Board */}
        <div className="flex flex-1 items-center justify-center min-h-0">
          <PuzzleBoard />
        </div>

        {/* Right Sidebar: Puzzle Controls */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:max-h-full overflow-y-auto">
          <PuzzleSidebar
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            minRating={minRating}
            setMinRating={setMinRating}
            maxRating={maxRating}
            setMaxRating={setMaxRating}
            motif={motif}
            setMotif={setMotif}
            onLoadPuzzle={handleLoadPuzzle}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}

export default function PuzzlesPage() {
  return (
    <PuzzleProvider>
      <PuzzleRushProvider>
        <PuzzlesContent />
      </PuzzleRushProvider>
    </PuzzleProvider>
  );
}

