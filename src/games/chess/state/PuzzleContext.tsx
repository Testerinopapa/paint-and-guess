import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { parseFen, makeFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";
import type { Position, Move } from "chessops";
import type { Puzzle, PuzzleFilters } from "./puzzleTypes";
import { apiPath } from "@/config/api";
import { debugPuzzle, debugMove, debugState, isDebugEnabled } from "../utils/debug";

interface PuzzleContextType {
  // State
  pz: Puzzle | null;
  fen: string | null;
  idx: number;
  solved: boolean;
  message: string | null;
  showHint: boolean;
  playerSide: "white" | "black";
  loading: boolean;
  error: string | null;
  mistakes: number;
  hintsUsed: number;
  showSolution: boolean;
  
  // Computed
  pv: string[];
  boardFen: string | undefined;
  sideToMove: "white" | "black";
  
  // Actions
  loadRandomPuzzle: (filters?: PuzzleFilters) => Promise<void>;
  onPieceDrop: (move: { sourceSquare: string; targetSquare: string }) => boolean;
  resetPuzzle: () => void;
  showHintAction: () => void;
  toggleSolution: () => void;
}

const PuzzleContext = createContext<PuzzleContextType | undefined>(undefined);

const RATING_PRESETS: Record<string, { min: number; max: number }> = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
  custom: { min: 0, max: 10000 },
};

export function PuzzleProvider({ children }: { children: ReactNode }) {
  // Direct state management (following React pattern from document)
  const [pz, setPz] = useState<Puzzle | null>(null);
  const [fen, setFen] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [playerSide, setPlayerSide] = useState<"white"|"black">("white");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Core move application function (following document pattern)
  const applyMoveUci = useCallback((fenStr: string, uci: string): string | null => {
    // 1. Parse FEN string
    const setupRes = parseFen(fenStr);
    if (!setupRes.isOk) return null;
    
    // 2. Setup chess position
    const res = setupPosition("chess", setupRes.unwrap());
    if (!res.isOk) return null;
    const pos: Position = res.unwrap();
    
    // 3. Parse UCI move
    const mv = parseUci(uci) as Move | undefined;
    if (!mv) return null;
    
    // 4. Validate move legality
    if (!pos.isLegal(mv)) return null;
    
    // 5. Apply move
    pos.play(mv);
    
    // 6. Return new FEN string
    return makeFen(pos.toSetup());
  }, []);

  // Parse solution PV (computed value)
  const pv = useMemo(() => {
    try { 
      return pz ? (typeof pz.solutionPv === "string" ? JSON.parse(pz.solutionPv) : pz.solutionPv) : []; 
    } catch { 
      return []; 
    }
  }, [pz]);

  // Board FEN computation (computed value)
  const boardFen = useMemo(() => {
    const f = fen ?? pz?.fen;
    if (!f) return undefined;
    try { 
      const pr = parseFen(f); 
      if (pr.isOk) return f;
    } catch {}
    return undefined;
  }, [fen, pz]);

  // Side to move computation (computed value)
  const sideToMove = useMemo<"white"|"black">(() => {
    const f = boardFen;
    try { 
      if (f) { 
        const pr = parseFen(f); 
        if (pr.isOk) return (pr.unwrap().turn as "white"|"black"); 
      } 
    } catch {}
    return (pz?.sideToMove === "black" ? "black" : "white");
  }, [boardFen, pz?.sideToMove]);

  const loadRandomPuzzle = useCallback(async (filters?: PuzzleFilters) => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log("[PUZZLE DEBUG] loadRandomPuzzle already in progress, skipping");
      return;
    }
    
    console.log("[PUZZLE DEBUG] loadRandomPuzzle called", { filters, debugEnabled: isDebugEnabled() });
    debugPuzzle.load(filters);
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
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

      // Fetch puzzle from API
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

      // Validate solutionPv is not empty
      if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
        debugPuzzle.error("Invalid solution PV", `type: ${typeof solutionPv}, length: ${solutionPv?.length}`);
        setError("Puzzle configuration error");
        setLoading(false);
        return;
      }

      // Validate FEN format
      const setupRes = parseFen(puzzle.fen);
      if (!setupRes.isOk) {
        setError("Invalid puzzle FEN");
        setLoading(false);
        return;
      }
      
      const fenTurn = setupRes.unwrap().turn as "white" | "black";
      
      // If puzzle.sideToMove doesn't match FEN turn, determine PV structure
      // Case 1: pv[0] is legal for FEN turn = opponent's move, pv[1] is player's move
      // Case 2: pv[0] is illegal for FEN turn = player's move, pv[1] is opponent's move
      let initialFen = puzzle.fen;
      let initialIdx = 0;
      const playerSideToUse = puzzle.sideToMove || fenTurn;
      
      if (puzzle.sideToMove && puzzle.sideToMove !== fenTurn && solutionPv.length > 0) {
        // Check if pv[0] is legal for FEN turn
        const firstMoveResult = applyMoveUci(initialFen, solutionPv[0]);
        if (firstMoveResult) {
          // pv[0] is opponent's move - advance it
          initialFen = firstMoveResult;
          initialIdx = 1;
        } else if (solutionPv.length > 1) {
          // pv[0] is illegal - check if pv[1] is legal (opponent's move)
          const secondMoveResult = applyMoveUci(initialFen, solutionPv[1]);
          if (secondMoveResult) {
            // pv[0] is player's move (skip), pv[1] is opponent's move (advance)
            initialFen = secondMoveResult;
            initialIdx = 2;
          }
          // If both are illegal, puzzle data is corrupted - start from beginning
        }
      }

      // Set state
      setPz(puzzle);
      setFen(initialFen);
      setIdx(initialIdx);
      setSolved(false);
      setPlayerSide(playerSideToUse);
      setMessage(null);
      setMistakes(0);
      setHintsUsed(0);
      setShowSolution(false);
      setShowHint(false);
      
      debugState.fen(puzzle.fen, puzzle.fen, "puzzle loaded");
      if (isDebugEnabled()) {
        console.log("[PUZZLE] Puzzle loaded:", puzzle.id);
      }
    } catch (err) {
      debugPuzzle.error(err, "loadRandomPuzzle");
      console.error("Error loading puzzle:", err);
      setError(err instanceof Error ? err.message : "Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }, [applyMoveUci]);

  // User move handler (following document pattern)
  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    // Early returns
    if (!pz || !fen || solved) return false;
    
    // Get expected move from solution
    const expected = pv[idx];
    if (!expected) {
      return false;
    }
    
    // Compare user move with expected move
    const attempt = `${sourceSquare}${targetSquare}`;
    const normalizedExpected = expected.slice(0, 4); // Ignore promotion suffix
    
    if (attempt !== normalizedExpected) {
      setMessage("Incorrect. Try again.");
      setMistakes(prev => prev + 1);
      debugMove.incorrect(sourceSquare, targetSquare, normalizedExpected, mistakes + 1);
      return false; // Reject move
    }
    
    // Apply player's correct move
    const next = applyMoveUci(fen, expected);
    if (!next) {
      setMessage("Invalid move");
      return false;
    }
    
    // Calculate indices before updating state
    const newIdx = idx + 1; // Index after player's move
    const opponentMoveIdx = newIdx; // Opponent's move index (if exists)
    const finalIdx = opponentMoveIdx + 1; // Index after opponent's reply (if exists)
    
    // Update state with player's move
    setFen(next);
    setIdx(newIdx);
    setMessage(null);
    setShowHint(false);
    
    debugMove.correct(sourceSquare, targetSquare, next, idx);
    
    // Auto-play opponent reply if it exists
    if (pv[opponentMoveIdx]) {
      const afterReply = applyMoveUci(next, pv[opponentMoveIdx]);
      if (afterReply) {
        setFen(afterReply);
        setIdx(finalIdx);
        debugMove.autoReply(pv[opponentMoveIdx].slice(0, 2), pv[opponentMoveIdx].slice(2, 4), afterReply);
      }
    }
    
    // Check if solved - puzzle is solved when we've reached or exceeded the end of the PV
    // After opponent's reply (if any), finalIdx should be >= pv.length
    if (finalIdx >= pv.length) {
      setSolved(true);
      debugState.solved(true);
    }
    
    return true; // Accept move
  }, [pz, fen, pv, idx, solved, applyMoveUci, mistakes]);


  const resetPuzzle = useCallback(() => {
    if (!pz) {
      debugPuzzle.error("No puzzle to reset", "resetPuzzle");
      return;
    }

    debugPuzzle.reset();

    const setupRes = parseFen(pz.fen);
    if (!setupRes.isOk) return;
    
    const fenTurn = setupRes.unwrap().turn as "white" | "black";
    const solutionPv = typeof pz.solutionPv === "string" ? JSON.parse(pz.solutionPv) : pz.solutionPv;
    
    // If puzzle.sideToMove doesn't match FEN turn, skip first move
    let initialFen = pz.fen;
    let initialIdx = 0;
    const playerSideToUse = pz.sideToMove || fenTurn;
    
    if (pz.sideToMove && pz.sideToMove !== fenTurn && Array.isArray(solutionPv) && solutionPv.length > 0) {
      const opponentMove = solutionPv[0];
      const afterOpponentMove = applyMoveUci(initialFen, opponentMove);
      if (afterOpponentMove) {
        initialFen = afterOpponentMove;
        initialIdx = 1;
      }
    }

    setPlayerSide(playerSideToUse);
    setFen(initialFen);
    setIdx(initialIdx);
    setSolved(false);
    setMessage(null);
    setMistakes(0);
    setHintsUsed(0);
    setShowSolution(false);
    setShowHint(false);
    
    debugState.fen(initialFen, pz.fen, "reset");
    debugState.moveIndex(initialIdx, 0, "reset");
    debugState.solved(false);
  }, [pz, applyMoveUci]);

  const showHintAction = useCallback(() => {
    if (!pz || solved || showSolution) {
      return;
    }
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
  }, [pz, solved, showSolution]);

  // Play all moves in solution from the beginning (for "Show Solution")
  const playAll = useCallback(() => {
    if (!pz) return;
    
    // Start from the puzzle's initial position
    let currentFen = pz.fen;
    
    // Apply all moves in solution from the beginning
    for (let i = 0; i < pv.length; i++) {
      const move = pv[i];
      const nextFen = applyMoveUci(currentFen, move);
      if (!nextFen) break;
      currentFen = nextFen;
    }
    
    // Update state to final position
    setFen(currentFen);
    setIdx(pv.length);
    setSolved(true);
    setMessage(null);
    setShowHint(false);
  }, [pz, pv, applyMoveUci]);

  const toggleSolution = useCallback(() => {
    if (!showSolution) {
      // Showing solution: play all remaining moves
      playAll();
      setShowSolution(true);
    } else {
      // Hiding solution: reset puzzle to beginning
      resetPuzzle();
    }
  }, [showSolution, playAll, resetPuzzle]);

  // Record attempt to database
  const recordAttempt = useCallback(async (solved: boolean) => {
    if (!pz) return;

    try {
      const timeMs = Date.now() - (pz.createdAt ? new Date(pz.createdAt).getTime() : Date.now());
      
      await fetch(apiPath("/api/puzzles/attempt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: pz.id,
          timeMs: Math.max(0, timeMs),
          mistakes,
          solved,
        }),
      });
    } catch (error) {
      console.error("Error recording attempt:", error);
      // Don't show error to user - attempt recording is non-critical
    }
  }, [pz, mistakes]);

  // Auto-record on solve
  useEffect(() => {
    if (solved && pz) {
      recordAttempt(true);
    }
  }, [solved, pz, recordAttempt]);

  return (
    <PuzzleContext.Provider
      value={{
        // State
        pz,
        fen,
        idx,
        solved,
        message,
        showHint,
        playerSide,
        loading,
        error,
        mistakes,
        hintsUsed,
        showSolution,
        // Computed
        pv,
        boardFen,
        sideToMove,
        // Actions
        loadRandomPuzzle,
        onPieceDrop,
        resetPuzzle,
        showHintAction,
        toggleSolution,
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

