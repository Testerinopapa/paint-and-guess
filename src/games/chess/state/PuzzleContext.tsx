import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Chess } from "chess.js";
import type { Puzzle, PuzzleState, PuzzleDifficulty, PuzzleMotif } from "./puzzleTypes";
import { SAMPLE_PUZZLES, getRandomPuzzle } from "../data/samplePuzzles";
import { apiPath } from "@/config/api";

interface PuzzleContextType {
  puzzleState: PuzzleState;
  loadPuzzle: (difficulty?: PuzzleDifficulty, motif?: PuzzleMotif) => Promise<void>;
  makeMove: (from: string, to: string) => boolean;
  getHint: () => string | null;
  resetPuzzle: () => void;
  nextPuzzle: () => Promise<void>;
  currentFen: string;
  solutionMoves: string[];
  currentMoveIndex: number;
}

const PuzzleContext = createContext<PuzzleContextType | undefined>(undefined);

function createInitialPuzzleState(): PuzzleState {
  return {
    currentPuzzle: null,
    attempt: null,
    currentMoveIndex: 0,
    hintLevel: 0,
    isSolved: false,
    isFailed: false,
  };
}

export function PuzzleProvider({ children }: { children: ReactNode }) {
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(createInitialPuzzleState());
  const [game, setGame] = useState<Chess | null>(null);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [userMoves, setUserMoves] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);

  const loadPuzzle = useCallback(async (difficulty?: PuzzleDifficulty, motif?: PuzzleMotif) => {
    try {
      // Try to fetch from API first, fallback to sample puzzles
      let puzzle: Puzzle | null = null;
      
      try {
        const params = new URLSearchParams();
        if (difficulty) params.append("difficulty", difficulty);
        if (motif) params.append("motif", motif);
        
        const response = await fetch(apiPath(`/api/puzzles/random?${params.toString()}`));
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // Convert API puzzle format to our Puzzle type
            puzzle = {
              id: data.id,
              fen: data.fen,
              solution: JSON.parse(data.solutionPv || "[]"),
              moves: JSON.parse(data.solutionPv || "[]").length,
              difficulty: difficulty || "medium",
              motifs: JSON.parse(data.motifs || "[]"),
              rating: data.rating || undefined,
            };
          }
        }
      } catch (error) {
        console.warn("API puzzle fetch failed, using sample puzzles", error);
      }

      // Fallback to sample puzzles
      if (!puzzle) {
        puzzle = getRandomPuzzle(SAMPLE_PUZZLES, difficulty, motif);
      }

      if (!puzzle) {
        console.error("No puzzle found");
        return;
      }

      // Initialize game from puzzle FEN
      const newGame = new Chess(puzzle.fen);
      
      // Convert solution to UCI format for validation
      const uciSolution = puzzle.solution.map((san) => {
        // Try to parse SAN and convert to UCI
        try {
          const tempGame = new Chess(puzzle.fen);
          const move = tempGame.move(san);
          if (move) {
            return `${move.from}${move.to}${move.promotion || ""}`;
          }
        } catch (e) {
          // If SAN parsing fails, assume it's already UCI or try to convert
          return san;
        }
        return san;
      });

      setGame(newGame);
      setSolutionMoves(uciSolution);
      setUserMoves([]);
      setMistakes(0);
      
      setPuzzleState({
        currentPuzzle: puzzle,
        attempt: {
          puzzleId: puzzle.id,
          moves: [],
          isCorrect: false,
          attempts: 0,
          solved: false,
          hintUsed: false,
        },
        currentMoveIndex: 0,
        hintLevel: 0,
        isSolved: false,
        isFailed: false,
      });
    } catch (error) {
      console.error("Error loading puzzle:", error);
    }
  }, []);

  const makeMove = useCallback((from: string, to: string): boolean => {
    if (!game || !puzzleState.currentPuzzle || puzzleState.isSolved || puzzleState.isFailed) {
      return false;
    }

    try {
      const move = game.move({ from, to });
      if (!move) {
        return false;
      }

      const userMoveUci = `${from}${to}${move.promotion || ""}`;
      const expectedMove = solutionMoves[puzzleState.currentMoveIndex];

      // Normalize moves (ignore promotion suffix for comparison)
      const normalizedUser = userMoveUci.slice(0, 4);
      const normalizedExpected = expectedMove?.slice(0, 4) || "";

      if (normalizedUser === normalizedExpected) {
        // Correct move!
        const newUserMoves = [...userMoves, userMoveUci];
        const newMoveIndex = puzzleState.currentMoveIndex + 1;
        const isComplete = newMoveIndex >= solutionMoves.length;

        setUserMoves(newUserMoves);
        
        // Auto-play opponent reply if not complete
        if (!isComplete && game) {
          const opponentMoveUci = solutionMoves[newMoveIndex];
          if (opponentMoveUci) {
            const oppFrom = opponentMoveUci.slice(0, 2);
            const oppTo = opponentMoveUci.slice(2, 4);
            const oppPromotion = opponentMoveUci.slice(4, 5);
            
            try {
              const oppMove = game.move({
                from: oppFrom,
                to: oppTo,
                promotion: oppPromotion as "q" | "r" | "b" | "n" | undefined,
              });
              if (oppMove) {
                setGame(new Chess(game.fen()));
              }
            } catch (e) {
              console.error("Error auto-playing opponent move:", e);
            }
          }
        }

        setPuzzleState((prev) => ({
          ...prev,
          currentMoveIndex: newMoveIndex,
          isSolved: isComplete,
          attempt: prev.attempt
            ? {
                ...prev.attempt,
                moves: newUserMoves,
                isCorrect: true,
                solved: isComplete,
              }
            : null,
        }));

        // Record attempt if solved
        if (isComplete) {
          recordAttempt(puzzleState.currentPuzzle!.id, true, mistakes);
        }

        return true;
      } else {
        // Incorrect move
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        
        setPuzzleState((prev) => ({
          ...prev,
          attempt: prev.attempt
            ? {
                ...prev.attempt,
                attempts: newMistakes,
                isCorrect: false,
              }
            : null,
        }));

        // Undo the move
        game.undo();
        return false;
      }
    } catch (error) {
      console.error("Error making move:", error);
      return false;
    }
  }, [game, puzzleState, solutionMoves, userMoves, mistakes]);

  const getHint = useCallback((): string | null => {
    if (!puzzleState.currentPuzzle || puzzleState.isSolved) {
      return null;
    }

    const currentHintLevel = puzzleState.hintLevel;
    const expectedMove = solutionMoves[puzzleState.currentMoveIndex];
    
    if (!expectedMove) return null;

    const from = expectedMove.slice(0, 2);
    const to = expectedMove.slice(2, 4);

    if (currentHintLevel === 0) {
      // Level 1: Show piece to move
      if (game) {
        const piece = game.get(from as any);
        if (piece) {
          const pieceName = piece.type === "p" ? "pawn" : piece.type;
          setPuzzleState((prev) => ({ ...prev, hintLevel: 1 }));
          return `Try moving the ${piece.color === "w" ? "white" : "black"} ${pieceName}`;
        }
      }
    } else if (currentHintLevel === 1) {
      // Level 2: Show target square
      setPuzzleState((prev) => ({ ...prev, hintLevel: 2 }));
      return `Try moving to square ${to}`;
    } else if (currentHintLevel === 2) {
      // Level 3: Show the move
      setPuzzleState((prev) => ({ ...prev, hintLevel: 3, attempt: prev.attempt ? { ...prev.attempt, hintUsed: true } : null }));
      return `The correct move is ${from}${to}`;
    }

    return null;
  }, [puzzleState, solutionMoves, game]);

  const resetPuzzle = useCallback(() => {
    if (puzzleState.currentPuzzle) {
      const newGame = new Chess(puzzleState.currentPuzzle.fen);
      setGame(newGame);
      setUserMoves([]);
      setMistakes(0);
      setPuzzleState((prev) => ({
        ...prev,
        currentMoveIndex: 0,
        hintLevel: 0,
        isSolved: false,
        isFailed: false,
        attempt: prev.attempt
          ? {
              ...prev.attempt,
              moves: [],
              attempts: 0,
              solved: false,
            }
          : null,
      }));
    }
  }, [puzzleState.currentPuzzle]);

  const nextPuzzle = useCallback(async () => {
    const difficulty = puzzleState.currentPuzzle?.difficulty;
    const motif = puzzleState.currentPuzzle?.motifs[0];
    await loadPuzzle(difficulty, motif);
  }, [puzzleState.currentPuzzle, loadPuzzle]);

  const recordAttempt = async (puzzleId: string, solved: boolean, mistakesCount: number) => {
    try {
      await fetch(apiPath("/api/puzzles/attempt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId,
          timeMs: 0, // Could track time if needed
          mistakes: mistakesCount,
          solved,
        }),
      });
    } catch (error) {
      console.error("Error recording attempt:", error);
    }
  };

  return (
    <PuzzleContext.Provider
      value={{
        puzzleState,
        loadPuzzle,
        makeMove,
        getHint,
        resetPuzzle,
        nextPuzzle,
        currentFen: game?.fen() || "",
        solutionMoves,
        currentMoveIndex: puzzleState.currentMoveIndex,
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

