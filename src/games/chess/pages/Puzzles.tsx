import { useState, useEffect } from "react";
import { PuzzleProvider, usePuzzle } from "../state/PuzzleContext";
import { PuzzleRushProvider } from "../state/PuzzleRushContext";
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
  const { stats } = usePuzzleRush();
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
    if (stats && !showResults) {
      setShowResults(true);
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
          // Will be handled by PuzzleSidebar when user clicks Puzzle Rush again
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

