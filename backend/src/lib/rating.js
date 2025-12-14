/**
 * ELO Rating System
 * 
 * Implements standard ELO rating calculation with configurable K-factor.
 * Supports 1v1 games (Chess) and multi-player games (Trivia Blitz).
 */

const DEFAULT_K_FACTOR = 32;
const INITIAL_RATING = 1500;

/**
 * Calculate expected score for player A against player B
 * @param {number} ratingA - Rating of player A
 * @param {number} ratingB - Rating of player B
 * @returns {number} Expected score (0-1) for player A
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new rating after a game
 * @param {number} currentRating - Current rating
 * @param {number} expectedScore - Expected score (0-1)
 * @param {number} actualScore - Actual score (0 = loss, 0.5 = draw, 1 = win)
 * @param {number} kFactor - K-factor (default: 32)
 * @returns {number} New rating
 */
export function calculateNewRating(currentRating, expectedScore, actualScore, kFactor = DEFAULT_K_FACTOR) {
  return Math.round(currentRating + kFactor * (actualScore - expectedScore));
}

/**
 * Calculate rating change (delta)
 * @param {number} currentRating - Current rating
 * @param {number} expectedScore - Expected score (0-1)
 * @param {number} actualScore - Actual score (0 = loss, 0.5 = draw, 1 = win)
 * @param {number} kFactor - K-factor (default: 32)
 * @returns {number} Rating change
 */
export function calculateRatingChange(currentRating, expectedScore, actualScore, kFactor = DEFAULT_K_FACTOR) {
  return Math.round(kFactor * (actualScore - expectedScore));
}

/**
 * Calculate ratings for a 1v1 game (Chess)
 * @param {number} whiteRating - White player's current rating
 * @param {number} blackRating - Black player's current rating
 * @param {string} result - Game result: "1-0" (white wins), "0-1" (black wins), "1/2-1/2" (draw)
 * @param {number} kFactor - K-factor (default: 32)
 * @returns {Object} { white: { before, after, change }, black: { before, after, change } }
 */
export function calculateChessRatings(whiteRating, blackRating, result, kFactor = DEFAULT_K_FACTOR) {
  const whiteExpected = expectedScore(whiteRating, blackRating);
  const blackExpected = expectedScore(blackRating, whiteRating);
  
  let whiteActual, blackActual;
  if (result === "1-0") {
    whiteActual = 1;
    blackActual = 0;
  } else if (result === "0-1") {
    whiteActual = 0;
    blackActual = 1;
  } else if (result === "1/2-1/2") {
    whiteActual = 0.5;
    blackActual = 0.5;
  } else {
    throw new Error(`Invalid game result: ${result}`);
  }
  
  const whiteChange = calculateRatingChange(whiteRating, whiteExpected, whiteActual, kFactor);
  const blackChange = calculateRatingChange(blackRating, blackExpected, blackActual, kFactor);
  
  return {
    white: {
      before: whiteRating,
      after: whiteRating + whiteChange,
      change: whiteChange,
    },
    black: {
      before: blackRating,
      after: blackRating + blackChange,
      change: blackChange,
    },
  };
}

/**
 * Calculate ratings for a multi-player game (Trivia Blitz)
 * Uses a modified ELO system where players are ranked and ratings are adjusted
 * based on relative performance.
 * 
 * @param {Array<{userId: string, score: number, currentRating: number}>} players - Array of players with scores and ratings
 * @param {number} kFactor - K-factor (default: 32)
 * @returns {Array<{userId: string, before: number, after: number, change: number, rank: number}>} Updated ratings
 */
export function calculateTriviaRatings(players, kFactor = DEFAULT_K_FACTOR) {
  if (players.length < 2) {
    return players.map((p, idx) => ({
      userId: p.userId,
      before: p.currentRating,
      after: p.currentRating,
      change: 0,
      rank: idx + 1,
    }));
  }
  
  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  // Calculate ratings for each player
  const results = sortedPlayers.map((player, index) => {
    const rank = index + 1;
    const totalPlayers = sortedPlayers.length;
    
    // Calculate expected performance based on rating
    // Higher rated players should perform better
    const avgOpponentRating = sortedPlayers
      .filter((p) => p.userId !== player.userId)
      .reduce((sum, p) => sum + p.currentRating, 0) / (totalPlayers - 1);
    
    const expectedScore = expectedScore(player.currentRating, avgOpponentRating);
    
    // Actual performance: rank-based scoring
    // 1st place = 1.0, 2nd = 0.75, 3rd = 0.5, 4th+ = 0.25
    // Or use a more gradual scale
    const actualScore = calculateActualScoreFromRank(rank, totalPlayers);
    
    const change = calculateRatingChange(
      player.currentRating,
      expectedScore,
      actualScore,
      kFactor
    );
    
    return {
      userId: player.userId,
      before: player.currentRating,
      after: player.currentRating + change,
      change,
      rank,
    };
  });
  
  return results;
}

/**
 * Calculate actual score from rank in multi-player game
 * Uses a normalized scoring system where performance is relative to position
 * 
 * @param {number} rank - Player's rank (1 = first, 2 = second, etc.)
 * @param {number} totalPlayers - Total number of players
 * @returns {number} Actual score (0-1)
 */
function calculateActualScoreFromRank(rank, totalPlayers) {
  if (totalPlayers === 2) {
    // 1v1: winner gets 1.0, loser gets 0.0
    return rank === 1 ? 1.0 : 0.0;
  }
  
  // For 3+ players, use a normalized distribution
  // Top player gets close to 1.0, bottom gets close to 0.0
  // Linear distribution: 1.0 - (rank - 1) / (totalPlayers - 1)
  return 1.0 - (rank - 1) / (totalPlayers - 1);
}

/**
 * Get initial rating for a new player
 * @returns {number} Initial rating (1500)
 */
export function getInitialRating() {
  return INITIAL_RATING;
}

/**
 * Get K-factor based on player's current rating
 * Lower K-factor for higher rated players (more stable)
 * Higher K-factor for lower rated players (faster adjustment)
 * 
 * @param {number} rating - Current rating
 * @returns {number} K-factor
 */
export function getKFactor(rating) {
  if (rating < 1600) {
    return 40; // New players: faster adjustment
  } else if (rating < 2000) {
    return 32; // Intermediate: standard
  } else {
    return 24; // Advanced: slower adjustment
  }
}
