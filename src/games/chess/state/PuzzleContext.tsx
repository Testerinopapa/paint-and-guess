import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { parseFen } from "chessops/fen";
import { Chess as ChessOps } from "chessops/chess";
import { parseUci, makeUci } from "chessops/util";
import { isNormal } from "chessops";
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

  const loadRandomPuzzle = useCallback(async (filters?: PuzzleFilters, retryCount = 0) => {
    const maxRetries = 3;
    console.log("[PUZZLE DEBUG] loadRandomPuzzle called", { filters, debugEnabled: isDebugEnabled(), retryCount });
    if (retryCount === 0) {
      debugPuzzle.load(filters);
      setLoading(true);
      setError(null);
    }

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
      
      // Validate solutionPv is not empty
      if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
        debugPuzzle.error("Invalid solution PV", `type: ${typeof solutionPv}, length: ${solutionPv?.length}`);
        // Auto-retry with a new puzzle
        if (retryCount < maxRetries) {
          console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries}) - invalid PV`);
          setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
          return;
        }
        setError("Puzzle configuration error - please try another puzzle");
        setLoading(false);
        return;
      }

      // Validate that first move in solutionPv matches sideToMove
      // solutionPv should start with the player's move, not the opponent's
      if (solutionPv.length > 0) {
        const firstMove = solutionPv[0];
        try {
          // Check who's turn it is in the FEN (before any moves)
          const fenTurn = tempGame.turn() === "w" ? "white" : "black";
          const expectedTurn = puzzle.sideToMove;
          
          // The first move should be made by the side whose turn it is in the FEN
          // If sideToMove is "white", then tempGame.turn() should be "w"
          if (fenTurn !== expectedTurn) {
            debugPuzzle.error("FEN turn doesn't match sideToMove", {
              fenTurn,
              expectedTurn,
              fen: puzzle.fen,
            });
            // This is a data integrity issue - skip this puzzle
            if (retryCount < maxRetries) {
              console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries}) - FEN/sideToMove mismatch`);
              setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
              return;
            }
            setError("Puzzle configuration error - please try another puzzle");
            setLoading(false);
            return;
          }
          
          // Verify the first move is legal for the expected side
          const from = firstMove.slice(0, 2);
          const to = firstMove.slice(2, 4);
          const testMove = tempGame.move({ from, to });
          
          if (!testMove) {
            debugPuzzle.error("First move is illegal", {
              firstMove,
              fen: puzzle.fen,
              sideToMove: puzzle.sideToMove,
            });
            // Auto-retry with a new puzzle
            if (retryCount < maxRetries) {
              console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries}) - illegal first move`);
              setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
              return;
            }
            setError("Puzzle configuration error - please try another puzzle");
            setLoading(false);
            return;
          }
          
          // Reset tempGame for further checks (auto-advance logic)
          tempGame = new Chess(puzzle.fen);
        } catch (e) {
          debugPuzzle.error("Error validating first move", e);
          // Auto-retry with a new puzzle
          if (retryCount < maxRetries) {
            console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries}) - validation error`);
            setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
            return;
          }
          setError("Puzzle configuration error - please try another puzzle");
          setLoading(false);
          return;
        }
      }

      // For mate puzzles, ensure player is on the side that delivers mate
      const tempGame = new Chess(puzzle.fen);
      const isMatePuzzle = puzzle.motifs.some(m => m.includes("mate"));
      if (isMatePuzzle && puzzle.sideToMove !== (tempGame.turn() === "w" ? "white" : "black")) {
        // Auto-advance one move if needed to get player on the correct side
        // solutionPv structure: [playerMove1, opponentReply1, playerMove2, opponentReply2, ...]
        // Player moves are at even indices (0, 2, 4...)
        // After auto-advancing move 0, we need moveIndex to point to the NEXT player move (index 2)
        if (solutionPv.length > 0) {
          const firstMove = solutionPv[0];
          try {
            const from = firstMove.slice(0, 2);
            const to = firstMove.slice(2, 4);
            const moveResult = tempGame.move({ from, to });
            if (!moveResult) {
              throw new Error(`Invalid move: ${from}${to}`);
            }
            initialFen = tempGame.fen();
            
            // After auto-advancing move 0 (player's first move), the next player move is at index 2
            // We need at least 3 moves total (move0, reply1, move2) for puzzle to have moves after auto-advance
            // If solutionPv.length < 3, there's no next player move, so puzzle would be immediately complete
            if (solutionPv.length < 3) {
              debugPuzzle.error("Puzzle too short for auto-advance", `length: ${solutionPv.length}, needs at least 3`);
              // Auto-retry with a new puzzle
              if (retryCount < maxRetries) {
                console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries})`);
                setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
                return;
              }
              setError("Puzzle configuration error - please try another puzzle");
              setLoading(false);
              return;
            }
            
            // After auto-advancing move 0, next player move is at index 2
            initialMoveIndex = 2;
            debugPuzzle.autoAdvance(from, to, initialFen, initialMoveIndex);
          } catch (e) {
            debugPuzzle.error(e, "auto-advance");
            console.error("Error auto-advancing puzzle:", e);
            // If auto-advance fails, don't auto-advance - keep moveIndex at 0
            initialMoveIndex = 0;
            initialFen = puzzle.fen;
          }
        }
      }
      
      // CRITICAL: Ensure puzzle is not already complete when loaded
      // moveIndex must be less than solutionPv.length for puzzle to have moves remaining
      if (initialMoveIndex >= solutionPv.length) {
        const errorDetails = `moveIndex: ${initialMoveIndex}, length: ${solutionPv.length}, isMatePuzzle: ${isMatePuzzle}, sideToMove: ${puzzle.sideToMove}, fenTurn: ${tempGame.turn() === "w" ? "white" : "black"}`;
        debugPuzzle.error("Puzzle would be complete on load", errorDetails);
        console.error("[PUZZLE] Validation failed:", {
          moveIndex: initialMoveIndex,
          length: solutionPv.length,
          isMatePuzzle,
          sideToMove: puzzle.sideToMove,
          fenTurn: tempGame.turn() === "w" ? "white" : "black"
        });
        // Auto-retry with a new puzzle
        if (retryCount < maxRetries) {
          console.log(`[PUZZLE] Retrying puzzle load (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => loadRandomPuzzle(filters, retryCount + 1), 100);
          return;
        }
        setError("Puzzle configuration error - please try another puzzle");
        setLoading(false);
        return;
      }

      // Apply the same reset pattern as "New Game" button - reset first, then load puzzle
      // This ensures pieces reset properly, just like when clicking "New Game"
      chessContext.resetGame();
      chessContext.loadFromFen(initialFen);
      chessContext.setGameMode("local");

      // Store puzzle data and mark as loaded onto board immediately
      const newState = {
        puzzle,
        currentFen: initialFen,
        moveIndex: initialMoveIndex,
        solutionPv,
        solved: false, // Always start as unsolved
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

  // Helper function to validate move with engine evaluation
  const validateMoveWithEngine = useCallback(async (
    fen: string,
    userMoveUci: string,
    solutionMoveUci: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(apiPath("/api/puzzles/validate-move"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen,
          userMove: userMoveUci,
          solutionMove: solutionMoveUci,
          depth: 8, // Fast depth for puzzle validation
        }),
      });

      if (!response.ok) {
        console.error("[PUZZLE] Engine validation failed:", response.statusText);
        return false;
      }

      const result = await response.json();
      return result.isCorrect === true;
    } catch (error) {
      console.error("[PUZZLE] Engine validation error:", error);
      return false;
    }
  }, []);

  const makeMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    console.log("[PUZZLE DEBUG] makeMove called", { from, to, promotion, hasPuzzle: !!puzzleState.puzzle, solved: puzzleState.solved });
    
    // Pre-validation checks
    if (!puzzleState.puzzle || puzzleState.solved) {
      debugMove.error("Invalid move attempt", `puzzle: ${!!puzzleState.puzzle}, solved: ${puzzleState.solved}`);
      return false;
    }

    const expectedMove = puzzleState.solutionPv[puzzleState.moveIndex];
    if (!expectedMove) {
      debugMove.error("No expected move", `moveIndex: ${puzzleState.moveIndex}, solutionLength: ${puzzleState.solutionPv.length}`);
      return false;
    }

    try {
      // Parse current FEN using chessops for robust validation
      const setupResult = parseFen(chessContext.game.fen());
      if (!setupResult.isOk) {
        debugMove.error("Invalid FEN", chessContext.game.fen());
        return false;
      }

      // Create chessops position for move validation
      const posResult = ChessOps.fromSetup(setupResult.unwrap());
      if (!posResult.isOk) {
        debugMove.error("Invalid position", "Failed to create chessops position");
        return false;
      }
      const pos = posResult.unwrap();

      // Build UCI move string from user input
      let userMoveUci = `${from}${to}`;
      if (promotion) {
        userMoveUci += promotion.toLowerCase();
      }

      // Parse user's move as UCI using chessops
      const userMove = parseUci(userMoveUci);
      if (!userMove || !isNormal(userMove)) {
        debugMove.error("Invalid UCI move", userMoveUci);
        return false;
      }

      // Get context for move validation
      const ctx = pos.ctx();

      // Check if move is legal using chessops
      if (!pos.isLegal(userMove, ctx)) {
        debugMove.error("Illegal move", userMoveUci);
        return false;
      }

      // Normalize moves for comparison (handle promotions)
      const normalizeUci = (uci: string): string => {
        // Compare first 4 characters (from-to squares), ignoring promotion
        return uci.slice(0, 4).toLowerCase();
      };

      const userMoveUciNormalized = makeUci(userMove);
      const userMoveNormalized = normalizeUci(userMoveUciNormalized);
      const expectedMoveNormalized = normalizeUci(expectedMove);

      debugMove.attempt(from, to, expectedMoveNormalized);

      // Check if move matches expected solution (exact match)
      const matchesSolution = userMoveNormalized === expectedMoveNormalized;

      // For mate puzzles, also check if move delivers mate (alternative solution)
      const isMatePuzzle = puzzleState.puzzle.motifs.some(m => 
        m.toLowerCase().includes("mate") && !m.toLowerCase().includes("matein")
      );

      let isCorrectMove = matchesSolution;

      // If it's a mate puzzle and move doesn't match, check if it delivers mate
      if (!matchesSolution && isMatePuzzle) {
        // Create a copy of position and play the move
        const testPos = pos.clone();
        testPos.play(userMove);
        const testCtx = testPos.ctx();
        
        isCorrectMove = testPos.isCheckmate(testCtx);
        if (isCorrectMove) {
          console.log("[PUZZLE] Alternative mate solution found:", userMoveUci);
        }
      }

      // For non-matching moves in non-mate puzzles, check if move is equivalent via evaluation
      // Note: This is a synchronous check, so we reject immediately if not exact match
      // Engine-based validation for equivalent moves would require async interface changes
      // For now, we require exact match for non-mate puzzles to ensure correctness
      if (!isCorrectMove && !isMatePuzzle) {
        // Log for debugging - in future could add async validation
        console.log("[PUZZLE] Move rejected (not exact match):", {
          user: userMoveUciNormalized,
          expected: expectedMoveNormalized,
          note: "Exact match required for non-mate puzzles"
        });
      }

      if (isCorrectMove) {
        // Correct move - apply it to ChessContext
        try {
          const oldFen = chessContext.game.fen();
          const oldMoveIndex = puzzleState.moveIndex;
          
          // Apply player's move via ChessContext (still using chess.js for board state)
          // But we've validated with chessops first
          const moveSuccess = originalMakeMove(from, to, promotion);
          if (!moveSuccess) {
            debugMove.error("Failed to apply move", "ChessContext makeMove returned false");
            return false;
          }
          
          debugMove.correct(from, to, chessContext.game.fen(), puzzleState.moveIndex);
          
          // Auto-play opponent reply if exists
          const nextMoveIndex = puzzleState.moveIndex + 1;
          if (nextMoveIndex < puzzleState.solutionPv.length) {
            const opponentMove = puzzleState.solutionPv[nextMoveIndex];
            
            // Parse opponent move properly
            const oppFrom = opponentMove.slice(0, 2);
            const oppTo = opponentMove.slice(2, 4);
            const oppPromotion = opponentMove.length > 4 ? opponentMove[4] : undefined;
            
            originalMakeMove(oppFrom, oppTo, oppPromotion);
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
    } catch (error) {
      debugMove.error(error, "validation");
      console.error("Error validating move:", error);
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
          // After auto-advancing move 0, next player move is at index 2 (same as loadRandomPuzzle)
          initialMoveIndex = 2;
          debugPuzzle.autoAdvance(from, to, initialFen, initialMoveIndex);
        } catch (e) {
          debugPuzzle.error(e, "reset auto-advance");
          console.error("Error resetting puzzle:", e);
        }
      }
    }
    
    // CRITICAL: Ensure puzzle is not already complete when reset
    const solutionPv = typeof puzzleState.puzzle.solutionPv === "string"
      ? JSON.parse(puzzleState.puzzle.solutionPv)
      : puzzleState.puzzle.solutionPv;
    if (initialMoveIndex >= solutionPv.length) {
      debugPuzzle.error("Puzzle would be complete on reset", `moveIndex: ${initialMoveIndex}, length: ${solutionPv.length}`);
      // Fallback: reset to beginning
      initialMoveIndex = 0;
      initialFen = puzzleState.puzzle.fen;
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

