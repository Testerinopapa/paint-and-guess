import express from "express";
import { authenticate } from "../auth/utils.js";
import {
  getUserRating,
  getLeaderboard,
  getUserGameHistory,
} from "../services/ratingService.js";

const router = express.Router();

/**
 * GET /api/ratings/:gameType
 * Get current user's rating for a game type
 */
router.get("/:gameType", authenticate, async (req, res) => {
  try {
    const { gameType } = req.params;
    const userId = req.user.userId;

    if (gameType !== "chess" && gameType !== "trivia") {
      return res.status(400).json({
        error: "Invalid game type. Must be 'chess' or 'trivia'",
      });
    }

    const rating = await getUserRating(userId, gameType);

    res.json({
      gameType,
      userId,
      rating,
    });
  } catch (error) {
    console.error("[Ratings API] Get rating error:", error);
    res.status(500).json({
      error: "Failed to get rating",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/ratings/:gameType/leaderboard
 * Get leaderboard for a game type
 */
router.get("/:gameType/leaderboard", async (req, res) => {
  try {
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit || "100", 10);

    if (gameType !== "chess" && gameType !== "trivia") {
      return res.status(400).json({
        error: "Invalid game type. Must be 'chess' or 'trivia'",
      });
    }

    const leaderboard = await getLeaderboard(gameType, limit);

    res.json({
      gameType,
      leaderboard,
    });
  } catch (error) {
    console.error("[Ratings API] Get leaderboard error:", error);
    res.status(500).json({
      error: "Failed to get leaderboard",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/ratings/:gameType/history
 * Get current user's game history
 */
router.get("/:gameType/history", authenticate, async (req, res) => {
  try {
    const { gameType } = req.params;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit || "50", 10);

    if (gameType !== "chess" && gameType !== "trivia") {
      return res.status(400).json({
        error: "Invalid game type. Must be 'chess' or 'trivia'",
      });
    }

    const history = await getUserGameHistory(userId, gameType, limit);

    res.json({
      gameType,
      userId,
      history,
    });
  } catch (error) {
    console.error("[Ratings API] Get history error:", error);
    res.status(500).json({
      error: "Failed to get game history",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
