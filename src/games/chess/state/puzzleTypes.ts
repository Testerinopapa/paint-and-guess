export interface Puzzle {
  id: string;
  createdAt: string;
  fen: string;
  sideToMove: "white" | "black";
  solutionPv: string[]; // UCI moves
  motifs: string[];
  source: string;
  rating: number | null;
}

export interface PuzzleAttempt {
  id: string;
  createdAt: string;
  puzzleId: string;
  timeMs: number;
  mistakes: number;
  solved: boolean;
  rating: number | null;
}

export type PuzzleDifficulty = "easy" | "medium" | "hard" | "custom";

export interface PuzzleFilters {
  difficulty?: PuzzleDifficulty;
  minRating?: number;
  maxRating?: number;
  motif?: string;
}

export interface PuzzleState {
  puzzle: Puzzle | null;
  currentFen: string;
  moveIndex: number;
  solutionPv: string[];
  solved: boolean;
  mistakes: number;
  startTime: number;
  hintsUsed: number;
  showSolution: boolean;
  loadedOntoBoard: boolean; // Whether puzzle pieces are currently on the board
}

