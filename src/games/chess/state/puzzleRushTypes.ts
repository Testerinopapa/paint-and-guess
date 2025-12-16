export type PuzzleRushMode = "standard-3min" | "standard-5min" | "survival";

export interface PuzzleRushSession {
  mode: PuzzleRushMode;
  startTime: number;
  endTime: number | null;
  timeLimit: number | null; // null for survival mode
  strikes: number; // 0-3, session ends at 3
  score: number; // number of puzzles solved correctly
  currentPuzzleNumber: number;
  baseRating: number; // starting rating for difficulty progression
  isActive: boolean;
}

export interface PuzzleRushStats {
  puzzlesSolved: number;
  totalTime: number;
  averageTimePerPuzzle: number;
  strikesUsed: number;
  finalRating: number; // rating of the last puzzle attempted
}

