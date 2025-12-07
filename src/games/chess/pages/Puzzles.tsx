import { useState } from "react";
import { PuzzleProvider, usePuzzle } from "../state/PuzzleContext";
import { ChessProvider } from "../state/ChessContext";
import { PuzzleBoard } from "../components/PuzzleBoard";
import { PuzzleSidebar } from "../components/PuzzleSidebar";
import type { PuzzleDifficulty, PuzzleFilters } from "../state/puzzleTypes";

function PuzzlesContent() {
  const { loadRandomPuzzle, loading } = usePuzzle();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("medium");
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [motif, setMotif] = useState<string>("");

  const handleLoadPuzzle = () => {
    const filters: PuzzleFilters = {
      difficulty: difficulty === "custom" ? undefined : difficulty,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      motif: motif || undefined,
    };
    loadRandomPuzzle(filters);
  };

  return (
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
  );
}

export default function PuzzlesPage() {
  return (
    <ChessProvider>
      <PuzzleProvider>
        <PuzzlesContent />
      </PuzzleProvider>
    </ChessProvider>
  );
}

