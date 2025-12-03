import type { Puzzle, PuzzleDifficulty, PuzzleMotif } from "../state/puzzleTypes";

// Sample puzzles for demonstration
// In production, these would come from a database or API
export const SAMPLE_PUZZLES: Puzzle[] = [
  {
    id: "puzzle-1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["Bxf7+"],
    moves: 1,
    difficulty: "easy",
    motifs: ["tactics", "sacrifice"],
    rating: 1200,
    description: "Find the winning sacrifice",
  },
  {
    id: "puzzle-2",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["Bxf7+", "Kxf7", "Ne5+"],
    moves: 3,
    difficulty: "medium",
    motifs: ["tactics", "fork", "sacrifice"],
    rating: 1500,
    description: "Sacrifice and fork",
  },
  {
    id: "puzzle-3",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["Qh5", "Nf6", "Qxf7#"],
    moves: 3,
    difficulty: "hard",
    motifs: ["checkmate", "tactics"],
    rating: 1800,
    description: "Mate in 3",
  },
  {
    id: "puzzle-4",
    fen: "8/8/8/8/8/8/4k3/4K3 w - - 0 1",
    solution: ["Ke2", "Kd2", "Kc3", "Kb4", "Ka5"],
    moves: 5,
    difficulty: "medium",
    motifs: ["endgame", "promotion"],
    rating: 1400,
    description: "King and pawn endgame",
  },
  {
    id: "puzzle-5",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["Nd5", "exd5", "Bxd5"],
    moves: 3,
    difficulty: "expert",
    motifs: ["tactics", "fork", "deflection"],
    rating: 2000,
    description: "Advanced tactical sequence",
  },
];

// Filter puzzles by difficulty
export function getPuzzlesByDifficulty(
  puzzles: Puzzle[],
  difficulty?: PuzzleDifficulty
): Puzzle[] {
  if (!difficulty) return puzzles;
  return puzzles.filter((p) => p.difficulty === difficulty);
}

// Filter puzzles by motif
export function getPuzzlesByMotif(
  puzzles: Puzzle[],
  motif?: PuzzleMotif
): Puzzle[] {
  if (!motif) return puzzles;
  return puzzles.filter((p) => p.motifs.includes(motif));
}

// Get random puzzle
export function getRandomPuzzle(
  puzzles: Puzzle[],
  difficulty?: PuzzleDifficulty,
  motif?: PuzzleMotif
): Puzzle | null {
  let filtered = puzzles;
  
  if (difficulty) {
    filtered = getPuzzlesByDifficulty(filtered, difficulty);
  }
  
  if (motif) {
    filtered = getPuzzlesByMotif(filtered, motif);
  }
  
  if (filtered.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

