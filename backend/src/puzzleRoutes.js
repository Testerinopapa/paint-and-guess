import { prisma } from "./prismaClient.js";
import { parseFen } from "chessops/fen";

const RATING_PRESETS = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
};

// Helper to check if puzzle is a mate puzzle
function isMatePuzzle(motifs) {
  if (typeof motifs === "string") {
    try {
      const parsed = JSON.parse(motifs);
      return Array.isArray(parsed) && parsed.some((m) => m.includes("mate") && !m.includes("mateIn"));
    } catch {
      return false;
    }
  }
  return Array.isArray(motifs) && motifs.some((m) => m.includes("mate") && !m.includes("mateIn"));
}

// Helper to calculate last mover from FEN and PV
function calculateLastMover(fen, pv) {
  try {
    const position = parseFen(fen);
    if (!position) return null;
    
    const startTurn = position.turn;
    const pvArray = typeof pv === "string" ? JSON.parse(pv) : pv;
    
    if (!Array.isArray(pvArray) || pvArray.length === 0) return null;
    
    // If PV length is odd, last mover = starting turn
    // If PV length is even, last mover = opposite
    const lastMover = pvArray.length % 2 === 1 ? startTurn : (startTurn === "white" ? "black" : "white");
    return lastMover;
  } catch (error) {
    console.error("Error calculating last mover:", error);
    return null;
  }
}

// GET /api/puzzles/random
export async function getRandomPuzzle(req, res) {
  try {
    const { difficulty, minRating, maxRating, motif } = req.query;
    
    console.log("[Puzzle API] Random puzzle request:", { difficulty, minRating, maxRating, motif });

    // Build rating range
    let ratingMin = 0;
    let ratingMax = 10000;

    if (difficulty && RATING_PRESETS[difficulty]) {
      const preset = RATING_PRESETS[difficulty];
      ratingMin = preset.min;
      ratingMax = preset.max;
    } else {
      if (minRating) ratingMin = parseInt(minRating, 10);
      if (maxRating) ratingMax = parseInt(maxRating, 10);
    }

    // Build where clause
    const where = {
      rating: {
        gte: ratingMin,
        lte: ratingMax,
      },
    };

    // Add motif filter if provided
    if (motif) {
      // SQLite-compatible JSON search (substring match)
      where.motifs = {
        contains: motif,
      };
    }

    // Count matching puzzles
    const total = await prisma.puzzle.count({ where });

    if (total === 0) {
      return res.json(null);
    }

    // Random sampling: min(25, max(5, sqrt(total)))
    const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
    const attempts = motif ? Math.min(50, baseAttempts * 2) : baseAttempts;

    // Try to find a valid puzzle
    for (let i = 0; i < attempts; i++) {
      const skip = Math.floor(Math.random() * total);
      const puzzles = await prisma.puzzle.findMany({
        where,
        skip,
        take: 1,
      });

      if (puzzles.length === 0) continue;

      const puzzle = puzzles[0];

      // Parse solution PV
      let solutionPv;
      try {
        solutionPv = typeof puzzle.solutionPv === "string" 
          ? JSON.parse(puzzle.solutionPv) 
          : puzzle.solutionPv;
      } catch (error) {
        console.error("Error parsing solution PV:", error);
        continue;
      }

      if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
        continue;
      }

      // CRITICAL: Ensure puzzle has at least one player move remaining
      // solutionPv contains alternating moves: [playerMove1, opponentReply1, playerMove2, opponentReply2, ...]
      // Player moves are at even indices (0, 2, 4...)
      // For a puzzle to be solvable, we need at least 1 player move (index 0 must exist)
      // After the last player move, there may be an opponent reply, but no more player moves
      // So if solutionPv.length = 1, that's a player move (solvable)
      // If solutionPv.length = 2, that's player move + opponent reply (solvable, player makes 1 move)
      // If solutionPv.length = 3, that's player move + opponent reply + player move (solvable, player makes 2 moves)
      // The puzzle is only complete when moveIndex >= solutionPv.length
      // So we need to ensure solutionPv.length >= 1 (at least one move for the player)
      // This validation is already covered by the length > 0 check above
      
      // However, we should also ensure the puzzle structure makes sense
      // A puzzle with only 1 move is valid (player makes 1 move, puzzle solved)
      // A puzzle with 2 moves is valid (player makes 1 move, opponent replies, puzzle solved)
      // So we don't need to filter by length here - all puzzles with length >= 1 are valid

      // Quality validation
      const isMate = isMatePuzzle(puzzle.motifs);
      
      if (isMate) {
        // For mate puzzles, verify solver matches last mover
        const lastMover = calculateLastMover(puzzle.fen, solutionPv);
        if (lastMover && puzzle.sideToMove !== lastMover) {
          continue; // Skip this puzzle
        }
      }
      // For non-mate puzzles, we skip engine validation for now
      // (can be added later with Stockfish integration)

      // Return valid puzzle
      const puzzleData = {
        id: puzzle.id,
        createdAt: puzzle.createdAt.toISOString(),
        fen: puzzle.fen,
        sideToMove: puzzle.sideToMove,
        solutionPv: solutionPv,
        motifs: typeof puzzle.motifs === "string" ? JSON.parse(puzzle.motifs) : puzzle.motifs,
        source: puzzle.source,
        rating: puzzle.rating,
      };
      console.log("[Puzzle API] Returning puzzle:", puzzle.id);
      return res.json(puzzleData);
    }

    // If no valid puzzle found, return null
    console.log("[Puzzle API] No valid puzzle found after", attempts, "attempts");
    res.json(null);
  } catch (error) {
    console.error("[Puzzle API] Error getting random puzzle:", error);
    res.status(500).json({ status: "error", message: "Failed to get puzzle", error: error.message });
  }
}

// GET /api/puzzles
export async function getPuzzles(req, res) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const motif = req.query.motif;

    const where = {};
    if (motif) {
      where.motifs = { contains: motif };
    }

    const puzzles = await prisma.puzzle.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json(
      puzzles.map((p) => ({
        id: p.id,
        createdAt: p.createdAt.toISOString(),
        fen: p.fen,
        sideToMove: p.sideToMove,
        solutionPv: typeof p.solutionPv === "string" ? JSON.parse(p.solutionPv) : p.solutionPv,
        motifs: typeof p.motifs === "string" ? JSON.parse(p.motifs) : p.motifs,
        source: p.source,
        rating: p.rating,
      }))
    );
  } catch (error) {
    console.error("Error getting puzzles:", error);
    res.status(500).json({ status: "error", message: "Failed to get puzzles" });
  }
}

// POST /api/puzzles/attempt
export async function createPuzzleAttempt(req, res) {
  try {
    const { puzzleId, timeMs, mistakes, solved, rating } = req.body;

    if (!puzzleId || timeMs === undefined || mistakes === undefined || solved === undefined) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    const attempt = await prisma.puzzleAttempt.create({
      data: {
        puzzleId,
        timeMs: parseInt(timeMs, 10),
        mistakes: parseInt(mistakes, 10),
        solved: Boolean(solved),
        rating: rating ? parseInt(rating, 10) : null,
      },
    });

    res.json({
      id: attempt.id,
      createdAt: attempt.createdAt.toISOString(),
      puzzleId: attempt.puzzleId,
      timeMs: attempt.timeMs,
      mistakes: attempt.mistakes,
      solved: attempt.solved,
      rating: attempt.rating,
    });
  } catch (error) {
    console.error("Error creating puzzle attempt:", error);
    res.status(500).json({ status: "error", message: "Failed to create attempt" });
  }
}

