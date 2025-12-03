export type PuzzleDifficulty = "easy" | "medium" | "hard" | "expert";

export type PuzzleMotif = 
  | "tactics" 
  | "endgame" 
  | "checkmate" 
  | "fork" 
  | "pin" 
  | "skewer" 
  | "discovery" 
  | "deflection"
  | "sacrifice"
  | "backrank"
  | "promotion";

export interface Puzzle {
  id: string;
  fen: string;
  solution: string[]; // Array of moves in SAN notation (e.g., ["Qh5", "Nf6"])
  moves: number; // Number of moves in solution
  difficulty: PuzzleDifficulty;
  motifs: PuzzleMotif[];
  rating?: number; // Puzzle rating (e.g., 1200-2000)
  description?: string; // Optional description of the puzzle
}

export interface PuzzleAttempt {
  puzzleId: string;
  moves: string[]; // User's attempted moves
  isCorrect: boolean;
  attempts: number;
  solved: boolean;
  hintUsed: boolean;
}

export interface PuzzleState {
  currentPuzzle: Puzzle | null;
  attempt: PuzzleAttempt | null;
  currentMoveIndex: number; // Which move in the solution we're on
  hintLevel: number; // 0 = no hint, 1 = show piece, 2 = show square, 3 = show move
  isSolved: boolean;
  isFailed: boolean;
}

