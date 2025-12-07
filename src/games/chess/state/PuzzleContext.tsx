import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { Puzzle, PuzzleState, PuzzleFilters, PuzzleDifficulty } from "./puzzleTypes";
import { apiPath } from "@/config/api";
import { debugPuzzle, debugMove, debugState, debugPuzzleState, isDebugEnabled, debugBoard } from "../utils/debug";
import { useChess } from "./ChessContext";

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
    loadedOntoBoard: false,
  };
}

export function PuzzleProvider({ children }: { children: ReactNode }) {
  // Use ChessContext for board state instead of maintaining our own game
  const chessContext = useChess();
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(createInitialState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store original makeMove to wrap it
  const originalMakeMove = chessContext.makeMove;

  const loadRandomPuzzle = useCallback(async (filters?: PuzzleFilters) => {
    console.log("[PUZZLE DEBUG] loadRandomPuzzle called", { filters, debugEnabled: isDebugEnabled() });
    debugPuzzle.load(filters);
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
        debugPuzzle.error("No puzzle found", "loadRandomPuzzle");
        setError("No puzzle found matching your criteria");
        setLoading(false);
        return;
      }

      debugPuzzle.loaded(puzzle);

      // Parse solution PV
      const solutionPv = typeof puzzle.solutionPv === "string" 
        ? JSON.parse(puzzle.solutionPv) 
        : puzzle.solutionPv;

      // Load puzzle FEN into ChessContext
      let initialFen = puzzle.fen;
      let initialMoveIndex = 0;
      
      // For mate puzzles, ensure player is on the side that delivers mate
      const tempGame = new Chess(puzzle.fen);
      const isMatePuzzle = puzzle.motifs.some(m => m.includes("mate"));
      if (isMatePuzzle && puzzle.sideToMove !== (tempGame.turn() === "w" ? "white" : "black")) {
        // Auto-advance one move if needed
        if (solutionPv.length > 0) {
          const firstMove = solutionPv[0];
          try {
            const from = firstMove.slice(0, 2);
            const to = firstMove.slice(2, 4);
            tempGame.move({ from, to });
            initialFen = tempGame.fen();
            initialMoveIndex = 1;
            debugPuzzle.autoAdvance(from, to, initialFen, initialMoveIndex);
          } catch (e) {
            debugPuzzle.error(e, "auto-advance");
            console.error("Error auto-advancing puzzle:", e);
          }
        }
      }

      // Load puzzle position into ChessContext immediately
      chessContext.loadFromFen(initialFen);
      chessContext.setGameMode("local");

      // Store puzzle data and mark as loaded onto board immediately
      const newState = {
        puzzle,
        currentFen: initialFen,
        moveIndex: initialMoveIndex,
        solutionPv,
        solved: false,
        mistakes: 0,
        startTime: Date.now(), // Start timer immediately
        hintsUsed: 0,
        showSolution: false,
        loadedOntoBoard: true, // Puzzle loaded onto board immediately
      };

      setPuzzleState(newState);
      debugPuzzleState(newState);
      debugState.fen(puzzle.fen, initialFen, "puzzle loaded onto board");
      
      if (isDebugEnabled()) {
        debugBoard.fenUpdate(undefined, initialFen);
        console.log("[PUZZLE] Puzzle loaded onto board:", puzzle.id);
      }
    } catch (err) {
      debugPuzzle.error(err, "loadRandomPuzzle");
      console.error("Error loading puzzle:", err);
      setError(err instanceof Error ? err.message : "Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }, []);

  const makeMove = useCallback((from: string, to: string): boolean => {
    console.log("[PUZZLE DEBUG] makeMove called", { from, to, hasPuzzle: !!puzzleState.puzzle, solved: puzzleState.solved });
    if (!puzzleState.puzzle || puzzleState.solved) {
      debugMove.error("Invalid move attempt", `puzzle: ${!!puzzleState.puzzle}, solved: ${puzzleState.solved}`);
      return false;
    }

    const expectedMove = puzzleState.solutionPv[puzzleState.moveIndex];
    if (!expectedMove) {
      debugMove.error("No expected move", `moveIndex: ${puzzleState.moveIndex}, solutionLength: ${puzzleState.solutionPv.length}`);
      return false;
    }

    // Normalize move (ignore promotion)
    const userMove = `${from}${to}`;
    const expectedMoveNormalized = expectedMove.slice(0, 4);

    debugMove.attempt(from, to, expectedMoveNormalized);

    if (userMove === expectedMoveNormalized) {
      // Correct move - apply it to ChessContext
      try {
        const oldFen = chessContext.game.fen();
        const oldMoveIndex = puzzleState.moveIndex;
        
        // Apply player's move via ChessContext
        const moveSuccess = originalMakeMove(from, to);
        if (!moveSuccess) {
          debugMove.error("Failed to apply move", "ChessContext makeMove returned false");
          return false;
        }
        
        debugMove.correct(from, to, chessContext.game.fen(), puzzleState.moveIndex);
        
        // Auto-play opponent reply if exists
        const nextMoveIndex = puzzleState.moveIndex + 1;
        if (nextMoveIndex < puzzleState.solutionPv.length) {
          const opponentMove = puzzleState.solutionPv[nextMoveIndex];
          const oppFrom = opponentMove.slice(0, 2);
          const oppTo = opponentMove.slice(2, 4);
          originalMakeMove(oppFrom, oppTo);
          debugMove.autoReply(oppFrom, oppTo, chessContext.game.fen());
        }

        const isComplete = nextMoveIndex + 1 >= puzzleState.solutionPv.length;
        const newMoveIndex = isComplete ? puzzleState.moveIndex : nextMoveIndex + 1;

        // Update puzzle state - sync currentFen with ChessContext
        setPuzzleState((prev) => {
          const newFen = chessContext.game.fen();
          const newState = {
            ...prev,
            currentFen: newFen, // Keep in sync with ChessContext
            moveIndex: newMoveIndex,
            solved: isComplete,
          };
          debugState.update(prev, newState, "correct move");
          debugState.fen(oldFen, newFen, "player move + auto-reply");
          debugState.moveIndex(oldMoveIndex, newMoveIndex, "correct move");
          if (isComplete) {
            debugState.solved(true);
          }
          return newState;
        });

        return true;
      } catch (error) {
        debugMove.error(error, "applying move");
        console.error("Error applying move:", error);
        return false;
      }
    } else {
      // Incorrect move
      const newMistakes = puzzleState.mistakes + 1;
      debugMove.incorrect(from, to, expectedMoveNormalized, newMistakes);
      setPuzzleState((prev) => ({
        ...prev,
        mistakes: newMistakes,
      }));
      return false;
    }
  }, [puzzleState, chessContext, originalMakeMove]);


  const resetPuzzle = useCallback(() => {
    if (!puzzleState.puzzle) {
      debugPuzzle.error("No puzzle to reset", "resetPuzzle");
      return;
    }

    debugPuzzle.reset();
    const oldState = { ...puzzleState };

    // Calculate initial FEN (same logic as loadRandomPuzzle)
    let initialFen = puzzleState.puzzle.fen;
    let initialMoveIndex = 0;
    
    const tempGame = new Chess(puzzleState.puzzle.fen);
    if (puzzleState.puzzle.motifs.some(m => m.includes("mate"))) {
      const solutionPv = typeof puzzleState.puzzle.solutionPv === "string"
        ? JSON.parse(puzzleState.puzzle.solutionPv)
        : puzzleState.puzzle.solutionPv;
      
      if (solutionPv.length > 0 && puzzleState.puzzle.sideToMove !== (tempGame.turn() === "w" ? "white" : "black")) {
        const firstMove = solutionPv[0];
        try {
          const from = firstMove.slice(0, 2);
          const to = firstMove.slice(2, 4);
          tempGame.move({ from, to });
          initialFen = tempGame.fen();
          initialMoveIndex = 1;
          debugPuzzle.autoAdvance(from, to, initialFen, initialMoveIndex);
        } catch (e) {
          debugPuzzle.error(e, "reset auto-advance");
          console.error("Error resetting puzzle:", e);
        }
      }
    }

    // Reset ChessContext to puzzle position
    chessContext.loadFromFen(initialFen);

    const newState = {
      ...puzzleState,
      currentFen: initialFen,
      moveIndex: initialMoveIndex,
      solved: false,
      mistakes: 0,
      startTime: Date.now(),
      hintsUsed: 0,
      showSolution: false,
      loadedOntoBoard: true, // Reset keeps puzzle on board
    };

    setPuzzleState(newState);
    debugState.update(oldState, newState, "reset");
    debugState.fen(oldState.currentFen, initialFen, "reset");
    debugState.moveIndex(oldState.moveIndex, initialMoveIndex, "reset");
    debugState.solved(false);
  }, [puzzleState, chessContext]);

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

