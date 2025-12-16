import { prisma } from "./prismaClient.js";
import { parseFen } from "chessops/fen";
import { extractTokenFromHeader, verifyToken } from "../auth/utils.js";

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

// Helper to get userId from request (optional - works with or without auth)
function getUserIdFromRequest(req) {
  const token = extractTokenFromHeader(req);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

// GET /api/puzzles/random
export async function getRandomPuzzle(req, res) {
  try {
    const { difficulty, minRating, maxRating, motif } = req.query;
    const userId = getUserIdFromRequest(req); // Get user ID if authenticated
    
    console.log("[Puzzle API] Random puzzle request:", { difficulty, minRating, maxRating, motif, userId: userId || "anonymous" });

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

    // Try to use catalog first (fast path)
    try {
      const catalogEntry = await prisma.puzzleCatalog.findUnique({
        where: {
          ratingMin_ratingMax_motif: {
            ratingMin,
            ratingMax,
            motif: motif || "all",
          },
        },
      });

      if (catalogEntry && catalogEntry.count > 0) {
        // Parse puzzle IDs from catalog
        const puzzleIds = JSON.parse(catalogEntry.puzzleIds);
        
        if (Array.isArray(puzzleIds) && puzzleIds.length > 0) {
          // If user is authenticated, filter out puzzles they've already solved
          let availablePuzzleIds = puzzleIds;
          if (userId) {
            const solvedPuzzleIds = await prisma.puzzleAttempt.findMany({
              where: {
                userId,
                solved: true,
                puzzleId: { in: puzzleIds },
              },
              select: { puzzleId: true },
            });
            const solvedIds = new Set(solvedPuzzleIds.map(a => a.puzzleId));
            availablePuzzleIds = puzzleIds.filter(id => !solvedIds.has(id));
            
            if (availablePuzzleIds.length === 0) {
              console.log(`[Puzzle API] User ${userId} has solved all puzzles in this catalog`);
              // Fall through to fallback method which will also check solved puzzles
            }
          }
          
          if (availablePuzzleIds.length > 0) {
            // Pick random puzzle ID from available puzzles
            const randomIndex = Math.floor(Math.random() * availablePuzzleIds.length);
            const puzzleId = availablePuzzleIds[randomIndex];
            
            // Fetch the puzzle
            const puzzle = await prisma.puzzle.findUnique({
              where: { id: puzzleId },
            });
            
            if (puzzle) {
              // Parse solution PV
              let solutionPv;
              try {
                solutionPv = typeof puzzle.solutionPv === "string"
                  ? JSON.parse(puzzle.solutionPv)
                  : puzzle.solutionPv;
              } catch (error) {
                console.error("[Puzzle API] Error parsing solution PV:", error);
                // Fall through to fallback method
              }
              
              if (Array.isArray(solutionPv) && solutionPv.length > 0) {
                // Return puzzle from catalog
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
                console.log(`[Puzzle API] Returning puzzle from catalog: ${puzzle.id} (${catalogEntry.count} available)`);
                return res.json(puzzleData);
              }
            }
          }
        }
      }
    } catch (catalogError) {
      // Catalog lookup failed, fall back to random sampling
      console.log("[Puzzle API] Catalog lookup failed, using fallback:", catalogError.message);
    }

    // Fallback: Use old random sampling method (if catalog not available or lookup failed)
    console.log("[Puzzle API] Using fallback random sampling method");

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

    // If user is authenticated, exclude puzzles they've already solved
    if (userId) {
      const solvedPuzzleIds = await prisma.puzzleAttempt.findMany({
        where: {
          userId,
          solved: true,
        },
        select: { puzzleId: true },
      });
      const solvedIds = solvedPuzzleIds.map(a => a.puzzleId);
      if (solvedIds.length > 0) {
        where.id = { notIn: solvedIds };
      }
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

      // Return puzzle
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
    const userId = getUserIdFromRequest(req); // Get user ID if authenticated

    if (!puzzleId || timeMs === undefined || mistakes === undefined || solved === undefined) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // If user is authenticated and puzzle is solved, check if they've already solved it
    // (to prevent duplicate solved records)
    if (userId && solved) {
      const existingSolved = await prisma.puzzleAttempt.findFirst({
        where: {
          userId,
          puzzleId,
          solved: true,
        },
      });
      
      if (existingSolved) {
        // User already solved this puzzle, just return the existing record
        return res.json({
          id: existingSolved.id,
          createdAt: existingSolved.createdAt.toISOString(),
          puzzleId: existingSolved.puzzleId,
          timeMs: existingSolved.timeMs,
          mistakes: existingSolved.mistakes,
          solved: existingSolved.solved,
          rating: existingSolved.rating,
        });
      }
    }

    const attempt = await prisma.puzzleAttempt.create({
      data: {
        puzzleId,
        userId: userId || null, // Store userId if authenticated, null otherwise
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

