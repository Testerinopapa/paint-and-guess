import { prisma } from "../prismaClient.js";
import {
  calculateChessRatings,
  calculateTriviaRatings,
  getInitialRating,
  getKFactor,
} from "../lib/rating.js";

/**
 * Get or initialize user rating for a game
 * @param {string} userId - User ID
 * @param {string} gameType - "chess" or "trivia"
 * @returns {Promise<number>} User's rating
 */
export async function getUserRating(userId, gameType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      chessRating: true,
      triviaRating: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const rating = gameType === "chess" ? user.chessRating : user.triviaRating;
  return rating ?? getInitialRating();
}

/**
 * Update user rating
 * @param {string} userId - User ID
 * @param {string} gameType - "chess" or "trivia"
 * @param {number} newRating - New rating value
 * @returns {Promise<void>}
 */
export async function updateUserRating(userId, gameType, newRating) {
  const updateData =
    gameType === "chess"
      ? { chessRating: newRating }
      : { triviaRating: newRating };

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

/**
 * Record a completed chess game and update ratings
 * @param {Object} gameData - Game data
 * @param {string} gameData.whiteUserId - White player user ID (null if AI/guest)
 * @param {string} gameData.blackUserId - Black player user ID (null if AI/guest)
 * @param {string} gameData.result - Game result: "1-0", "0-1", "1/2-1/2"
 * @param {string} gameData.gameMode - "local", "ai", "online"
 * @param {number} gameData.aiElo - AI ELO if playing against AI
 * @param {string} gameData.pgn - PGN string (optional)
 * @returns {Promise<Object>} Game record with rating changes
 */
export async function recordChessGame(gameData) {
  const { whiteUserId, blackUserId, result, gameMode, aiElo, pgn } = gameData;

  // Only update ratings if at least one user is registered
  // AI games don't affect ratings unless both players are users
  const isRated = (whiteUserId || blackUserId) && gameMode !== "local";

  let whiteRatingBefore = null;
  let blackRatingBefore = null;
  let whiteRatingAfter = null;
  let blackRatingAfter = null;
  let whiteRatingChange = null;
  let blackRatingChange = null;

  if (isRated && whiteUserId && blackUserId) {
    // Both players are users - calculate ratings
    whiteRatingBefore = await getUserRating(whiteUserId, "chess");
    blackRatingBefore = await getUserRating(blackUserId, "chess");

    const kFactor = Math.min(
      getKFactor(whiteRatingBefore),
      getKFactor(blackRatingBefore)
    );

    const ratings = calculateChessRatings(
      whiteRatingBefore,
      blackRatingBefore,
      result,
      kFactor
    );

    whiteRatingAfter = ratings.white.after;
    blackRatingAfter = ratings.black.after;
    whiteRatingChange = ratings.white.change;
    blackRatingChange = ratings.black.change;

    // Update user ratings
    await updateUserRating(whiteUserId, "chess", whiteRatingAfter);
    await updateUserRating(blackUserId, "chess", blackRatingAfter);
  }

  // Create game record
  const game = await prisma.chessGame.create({
    data: {
      whiteUserId,
      blackUserId,
      result,
      pgn: pgn || null,
      whiteRatingBefore,
      blackRatingBefore,
      whiteRatingAfter,
      blackRatingAfter,
      whiteRatingChange,
      blackRatingChange,
      gameMode,
      aiElo: aiElo || null,
    },
  });

  return game;
}

/**
 * Record a completed trivia game and update ratings
 * @param {Object} gameData - Game data
 * @param {string} gameData.roomId - Room ID
 * @param {string} gameData.quizId - Quiz ID (optional)
 * @param {string} gameData.quizName - Quiz name (optional)
 * @param {number} gameData.totalQuestions - Total questions in game
 * @param {Array<{userId: string | null, name: string, score: number}>} gameData.players - Player results
 * @returns {Promise<Object>} Game record with rating changes
 */
export async function recordTriviaGame(gameData) {
  const { roomId, quizId, quizName, totalQuestions, players } = gameData;

  // Filter to only registered users (exclude guests/anonymous)
  const registeredPlayers = players.filter((p) => p.userId !== null);

  if (registeredPlayers.length < 2) {
    // Not enough registered players for rated game
    // Still record the game but without rating changes
    const game = await prisma.triviaGame.create({
      data: {
        roomId,
        quizId: quizId || null,
        quizName: quizName || null,
        totalQuestions,
        players: JSON.stringify(players.map((p) => ({
          userId: p.userId,
          name: p.name,
          score: p.score,
          finalRank: null,
          ratingBefore: null,
          ratingAfter: null,
          ratingChange: null,
        }))),
      },
    });
    return game;
  }

  // Get current ratings for all registered players
  const playersWithRatings = await Promise.all(
    registeredPlayers.map(async (player) => ({
      userId: player.userId,
      name: player.name,
      score: player.score,
      currentRating: await getUserRating(player.userId, "trivia"),
    }))
  );

  // Calculate new ratings
  const ratingResults = calculateTriviaRatings(playersWithRatings);

  // Update user ratings
  await Promise.all(
    ratingResults.map((result) =>
      updateUserRating(result.userId, "trivia", result.after)
    )
  );

  // Create player results array with rating info
  const playerResults = players.map((player) => {
    const ratingResult = ratingResults.find(
      (r) => r.userId === player.userId
    );
    if (ratingResult) {
      return {
        userId: player.userId,
        name: player.name,
        score: player.score,
        finalRank: ratingResult.rank,
        ratingBefore: ratingResult.before,
        ratingAfter: ratingResult.after,
        ratingChange: ratingResult.change,
      };
    }
    return {
      userId: player.userId,
      name: player.name,
      score: player.score,
      finalRank: null,
      ratingBefore: null,
      ratingAfter: null,
      ratingChange: null,
    };
  });

  // Create game record
  const game = await prisma.triviaGame.create({
    data: {
      roomId,
      quizId: quizId || null,
      quizName: quizName || null,
      totalQuestions,
      players: JSON.stringify(playerResults),
    },
  });

  return game;
}

/**
 * Get leaderboard for a game type
 * @param {string} gameType - "chess" or "trivia"
 * @param {number} limit - Number of players to return (default: 100)
 * @returns {Promise<Array>} Leaderboard entries
 */
export async function getLeaderboard(gameType, limit = 100) {
  const ratingField = gameType === "chess" ? "chessRating" : "triviaRating";

  const users = await prisma.user.findMany({
    where: {
      [ratingField]: {
        not: null,
      },
    },
    orderBy: {
      [ratingField]: "desc",
    },
    take: limit,
    select: {
      id: true,
      username: true,
      [ratingField]: true,
    },
  });

  return users.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    username: user.username,
    rating: user[ratingField],
  }));
}

/**
 * Get user's game history
 * @param {string} userId - User ID
 * @param {string} gameType - "chess" or "trivia"
 * @param {number} limit - Number of games to return (default: 50)
 * @returns {Promise<Array>} Game history
 */
export async function getUserGameHistory(userId, gameType, limit = 50) {
  if (gameType === "chess") {
    const games = await prisma.chessGame.findMany({
      where: {
        OR: [{ whiteUserId: userId }, { blackUserId: userId }],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return games.map((game) => ({
      id: game.id,
      createdAt: game.createdAt,
      result:
        game.whiteUserId === userId
          ? game.result
          : game.result === "1-0"
          ? "0-1"
          : game.result === "0-1"
          ? "1-0"
          : "1/2-1/2",
      ratingBefore:
        game.whiteUserId === userId
          ? game.whiteRatingBefore
          : game.blackRatingBefore,
      ratingAfter:
        game.whiteUserId === userId
          ? game.whiteRatingAfter
          : game.blackRatingAfter,
      ratingChange:
        game.whiteUserId === userId
          ? game.whiteRatingChange
          : game.blackRatingChange,
      opponentUserId:
        game.whiteUserId === userId ? game.blackUserId : game.whiteUserId,
      gameMode: game.gameMode,
    }));
  } else {
    // Trivia games
    const games = await prisma.triviaGame.findMany({
      where: {
        players: {
          contains: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return games
      .map((game) => {
        const players = JSON.parse(game.players);
        const playerResult = players.find((p) => p.userId === userId);
        if (!playerResult) return null;

        return {
          id: game.id,
          createdAt: game.createdAt,
          score: playerResult.score,
          finalRank: playerResult.finalRank,
          ratingBefore: playerResult.ratingBefore,
          ratingAfter: playerResult.ratingAfter,
          ratingChange: playerResult.ratingChange,
          totalQuestions: game.totalQuestions,
          quizName: game.quizName,
        };
      })
      .filter(Boolean);
  }
}
