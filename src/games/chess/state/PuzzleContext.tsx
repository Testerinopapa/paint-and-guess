import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { Puzzle, PuzzleState, PuzzleFilters, PuzzleDifficulty } from "./puzzleTypes";
import { apiPath } from "@/config/api";

interface PuzzleContextType {
  puzzleState: PuzzleState;
  loading: boolean;
  error: string | null;
  loadRandomPuzzle: (filters?: PuzzleFilters) => Promise<void>;
  makeMove: (from: string, to: string) => boolean;
  resetPuzzle: () => void;
  showHint: () => void;
  toggleSolution: () => void;
  recordAttempt: (solved: boolean) => Promise<void>;
}

const PuzzleContext = createContext<PuzzleContextType | undefined>(undefined);

const RATING_PRESETS: Record<PuzzleDifficulty, { min: number; max: number }> = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
  custom: { min: 0, max: 10000 },
};

function createInitialState(): PuzzleState {
  return {
    puzzle: null,
    currentFen: "",
    moveIndex: 0,
    solutionPv: [],
    solved: false,
    mistakes: 0,
    startTime: 0,
    hintsUsed: 0,
    showSolution: false,
  };
}

export function PuzzleProvider({ children }: { children: ReactNode }) {
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(createInitialState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<Chess | null>(null);

  const loadRandomPuzzle = useCallback(async (filters?: PuzzleFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters?.difficulty && filters.difficulty !== "custom") {
        const preset = RATING_PRESETS[filters.difficulty];
        params.append("minRating", preset.min.toString());
        params.append("maxRating", preset.max.toString());
      } else {
        if (filters?.minRating !== undefined) {
          params.append("minRating", filters.minRating.toString());
        }
        if (filters?.maxRating !== undefined) {
          params.append("maxRating", filters.maxRating.toString());
        }
      }

      if (filters?.motif) {
        params.append("motif", filters.motif);
      }

      const response = await fetch(`${apiPath("/api/puzzles/random")}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to load puzzle");
      }

      const puzzle: Puzzle | null = await response.json();

      if (!puzzle) {
        setError("No puzzle found matching your criteria");
        setLoading(false);
        return;
      }

      // Parse solution PV
      const solutionPv = typeof puzzle.solutionPv === "string" 
        ? JSON.parse(puzzle.solutionPv) 
        : puzzle.solutionPv;

      // Initialize game from puzzle FEN
      const newGame = new Chess(puzzle.fen);
      
      // Determine if we need to auto-advance (for mate puzzles)
      let initialFen = puzzle.fen;
      let initialMoveIndex = 0;
      
      // For mate puzzles, ensure player is on the side that delivers mate
      const isMatePuzzle = puzzle.motifs.some(m => m.includes("mate"));
      if (isMatePuzzle && puzzle.sideToMove !== (newGame.turn() === "w" ? "white" : "black")) {
        // Auto-advance one move if needed
        if (solutionPv.length > 0) {
          const firstMove = solutionPv[0];
          try {
            newGame.move({ from: firstMove.slice(0, 2), to: firstMove.slice(2, 4) });
            initialFen = newGame.fen();
            initialMoveIndex = 1;
          } catch (e) {
            console.error("Error auto-advancing puzzle:", e);
          }
        }
      }

      setGame(newGame);
      setPuzzleState({
        puzzle,
        currentFen: initialFen,
        moveIndex: initialMoveIndex,
        solutionPv,
        solved: false,
        mistakes: 0,
        startTime: Date.now(),
        hintsUsed: 0,
        showSolution: false,
      });
    } catch (err) {
      console.error("Error loading puzzle:", err);
      setError(err instanceof Error ? err.message : "Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }, []);

  const makeMove = useCallback((from: string, to: string): boolean => {
    if (!game || !puzzleState.puzzle || puzzleState.solved) {
      return false;
    }

    const expectedMove = puzzleState.solutionPv[puzzleState.moveIndex];
    if (!expectedMove) {
      return false;
    }

    // Normalize move (ignore promotion)
    const userMove = `${from}${to}`;
    const expectedMoveNormalized = expectedMove.slice(0, 4);

    if (userMove === expectedMoveNormalized) {
      // Correct move
      try {
        // Apply player's move
        game.move({ from, to });
        
        // Auto-play opponent reply if exists
        const nextMoveIndex = puzzleState.moveIndex + 1;
        if (nextMoveIndex < puzzleState.solutionPv.length) {
          const opponentMove = puzzleState.solutionPv[nextMoveIndex];
          const oppFrom = opponentMove.slice(0, 2);
          const oppTo = opponentMove.slice(2, 4);
          game.move({ from: oppFrom, to: oppTo });
        }

        const isComplete = nextMoveIndex + 1 >= puzzleState.solutionPv.length;

        setPuzzleState((prev) => ({
          ...prev,
          currentFen: game.fen(),
          moveIndex: isComplete ? prev.moveIndex : nextMoveIndex + 1,
          solved: isComplete,
        }));

        setGame(new Chess(game.fen()));
        return true;
      } catch (error) {
        console.error("Error applying move:", error);
        return false;
      }
    } else {
      // Incorrect move
      setPuzzleState((prev) => ({
        ...prev,
        mistakes: prev.mistakes + 1,
      }));
      return false;
    }
  }, [game, puzzleState]);

  const resetPuzzle = useCallback(() => {
    if (!puzzleState.puzzle) return;

    const newGame = new Chess(puzzleState.puzzle.fen);
    
    // Handle auto-advance for mate puzzles
    let initialFen = puzzleState.puzzle.fen;
    let initialMoveIndex = 0;
    
    if (puzzleState.puzzle.motifs.some(m => m.includes("mate"))) {
      const solutionPv = typeof puzzleState.puzzle.solutionPv === "string"
        ? JSON.parse(puzzleState.puzzle.solutionPv)
        : puzzleState.puzzle.solutionPv;
      
      if (solutionPv.length > 0 && puzzleState.puzzle.sideToMove !== (newGame.turn() === "w" ? "white" : "black")) {
        const firstMove = solutionPv[0];
        try {
          newGame.move({ from: firstMove.slice(0, 2), to: firstMove.slice(2, 4) });
          initialFen = newGame.fen();
          initialMoveIndex = 1;
        } catch (e) {
          console.error("Error resetting puzzle:", e);
        }
      }
    }

    setGame(newGame);
    setPuzzleState((prev) => ({
      ...prev,
      currentFen: initialFen,
      moveIndex: initialMoveIndex,
      solved: false,
      mistakes: 0,
      startTime: Date.now(),
      hintsUsed: 0,
      showSolution: false,
    }));
  }, [puzzleState.puzzle]);

  const showHint = useCallback(() => {
    if (!puzzleState.puzzle || puzzleState.solved || puzzleState.showSolution) {
      return;
    }

    setPuzzleState((prev) => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
    }));
  }, [puzzleState]);

  const toggleSolution = useCallback(() => {
    setPuzzleState((prev) => ({
      ...prev,
      showSolution: !prev.showSolution,
    }));
  }, []);

  const recordAttempt = useCallback(async (solved: boolean) => {
    if (!puzzleState.puzzle) return;

    try {
      const timeMs = Date.now() - puzzleState.startTime;
      
      await fetch(apiPath("/api/puzzles/attempt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzleState.puzzle.id,
          timeMs,
          mistakes: puzzleState.mistakes,
          solved,
        }),
      });
    } catch (error) {
      console.error("Error recording attempt:", error);
    }
  }, [puzzleState]);

  // Auto-record on solve
  useEffect(() => {
    if (puzzleState.solved) {
      recordAttempt(true);
    }
  }, [puzzleState.solved, recordAttempt]);

  return (
    <PuzzleContext.Provider
      value={{
        puzzleState,
        loading,
        error,
        loadRandomPuzzle,
        makeMove,
        resetPuzzle,
        showHint,
        toggleSolution,
        recordAttempt,
      }}
    >
      {children}
    </PuzzleContext.Provider>
  );
}

export function usePuzzle() {
  const context = useContext(PuzzleContext);
  if (context === undefined) {
    throw new Error("usePuzzle must be used within a PuzzleProvider");
  }
  return context;
}

