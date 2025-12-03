import express from "express";
import { prisma } from "./prismaClient.js";

const router = express.Router();

const RATING_PRESETS = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
};

// GET /api/puzzles/random
router.get("/random", async (req, res) => {
  try {
    const { difficulty, minRating, maxRating, motif } = req.query;

    // Build rating range
    let ratingMin = minRating ? parseInt(minRating) : undefined;
    let ratingMax = maxRating ? parseInt(maxRating) : undefined;

    if (difficulty && RATING_PRESETS[difficulty]) {
      const preset = RATING_PRESETS[difficulty];
      ratingMin = ratingMin ?? preset.min;
      ratingMax = ratingMax ?? preset.max;
    }

    // Build where clause
    const where = {};
    if (ratingMin !== undefined || ratingMax !== undefined) {
      where.rating = {};
      if (ratingMin !== undefined) where.rating.gte = ratingMin;
      if (ratingMax !== undefined) where.rating.lte = ratingMax;
    }

    if (motif) {
      where.motifs = { contains: motif };
    }

    // Count matching puzzles
    const total = await prisma.puzzle.count({ where });

    if (total === 0) {
      return res.json(null);
    }

    // Random sampling
    const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
    const attempts = motif ? Math.min(50, baseAttempts * 2) : baseAttempts;

    for (let i = 0; i < attempts; i++) {
      const skip = Math.floor(Math.random() * total);
      const puzzles = await prisma.puzzle.findMany({
        where,
        skip,
        take: 1,
      });

      if (puzzles.length === 0) continue;

      const puzzle = puzzles[0];
      
      // Basic validation - check if solution PV is valid
      try {
        const pv = JSON.parse(puzzle.solutionPv || "[]");
        if (pv.length === 0) continue;
      } catch (e) {
        continue;
      }

      return res.json(puzzle);
    }

    // If no puzzle passed validation, return any puzzle
    const fallback = await prisma.puzzle.findFirst({ where });
    return res.json(fallback);
  } catch (error) {
    console.error("[puzzles] Error fetching random puzzle:", error);
    res.status(500).json({ error: "Failed to fetch puzzle" });
  }
});

// GET /api/puzzles
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20")));
    const { motif } = req.query;

    const where = {};
    if (motif) {
      where.motifs = { contains: motif };
    }

    const puzzles = await prisma.puzzle.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json(puzzles);
  } catch (error) {
    console.error("[puzzles] Error fetching puzzles:", error);
    res.status(500).json({ error: "Failed to fetch puzzles" });
  }
});

// POST /api/puzzles/attempt
router.post("/attempt", async (req, res) => {
  try {
    const { puzzleId, timeMs, mistakes, solved, rating } = req.body;

    if (!puzzleId) {
      return res.status(400).json({ error: "puzzleId is required" });
    }

    const attempt = await prisma.puzzleAttempt.create({
      data: {
        puzzleId,
        timeMs: timeMs || 0,
        mistakes: mistakes || 0,
        solved: solved || false,
        rating: rating || null,
      },
    });

    res.json(attempt);
  } catch (error) {
    console.error("[puzzles] Error creating attempt:", error);
    res.status(500).json({ error: "Failed to create attempt" });
  }
});

export default router;

