/**
 * Basic move evaluation utilities
 * These functions help calculate move quality metrics
 */

/**
 * Convert score to centipawns
 * @param {Object} score - Score object with type ("cp" | "mate") and value
 * @returns {number|null} Centipawn value or null
 */
export function scoreToCp(score) {
  if (!score) return null;
  if (score.type === "cp") return score.value;
  // Mate: return large value with sign
  return (score.value >= 0 ? 1 : -1) * 10000;
}

/**
 * Calculate Centipawn Loss (CPL) for a move
 * @param {number} preBestCp - Best evaluation before the move
 * @param {number} prePlayedCp - Evaluation of the played move
 * @returns {number} CPL (always >= 0)
 */
export function calculateCpl(preBestCp, prePlayedCp) {
  if (preBestCp === null || prePlayedCp === null) return 0;
  return Math.max(0, preBestCp - prePlayedCp);
}

/**
 * Assign move quality tag based on CPL
 * Uses CAPS1 thresholds:
 * - Best: ≤ 30 cp
 * - Excellent: ≤ 70 cp
 * - Good: ≤ 150 cp
 * - Inaccuracy: ≤ 300 cp
 * - Mistake: ≤ 600 cp
 * - Blunder: > 600 cp
 * @param {number} cpl - Centipawn loss
 * @param {boolean} bestIsMate - Whether best move was mate
 * @param {boolean} playedIsMate - Whether played move was mate
 * @param {number} bestMateVal - Best move mate value
 * @param {number} playedMateVal - Played move mate value
 * @returns {string} Tag name
 */
export function tagFromCpl(cpl, bestIsMate = false, playedIsMate = false, bestMateVal = 0, playedMateVal = 0) {
  // Mate-aware override: if best is mate and played isn't, or increases mate distance, it's a blunder
  if (bestIsMate && !playedIsMate) {
    return "Blunder";
  }
  if (bestIsMate && playedIsMate && Math.abs(playedMateVal) > Math.abs(bestMateVal)) {
    return "Blunder";
  }

  // Standard CPL-based tagging
  const ad = Math.max(0, cpl);
  if (ad <= 30) return "Best";
  if (ad <= 70) return "Excellent";
  if (ad <= 150) return "Good";
  if (ad <= 300) return "Inaccuracy";
  if (ad <= 600) return "Mistake";
  return "Blunder";
}

/**
 * Calculate accuracy from CPL array
 * Formula: 100 - (avg(CPL in pawns) / 8) * 100, clamped to 0-100
 * @param {number[]} cpls - Array of centipawn losses
 * @returns {number} Accuracy percentage (0-100)
 */
export function calculateAccuracy(cpls) {
  if (!Array.isArray(cpls) || cpls.length === 0) return 100;
  const sumCplPawns = cpls.reduce((sum, cpl) => sum + Math.abs(cpl / 100), 0);
  const avgCpl = sumCplPawns / cpls.length;
  return Math.max(0, Math.min(100, 100 - (avgCpl / 8) * 100));
}

/**
 * Calculate Average Centipawn Loss (ACPL)
 * @param {number[]} cpls - Array of centipawn losses
 * @returns {number} Average CPL
 */
export function calculateAcpl(cpls) {
  if (!Array.isArray(cpls) || cpls.length === 0) return 0;
  return cpls.reduce((sum, cpl) => sum + cpl, 0) / cpls.length;
}

/**
 * Detect if a move is an "only move" based on MultiPV spread
 * An only move is when the best line advantage decreases drastically for all alternatives
 * @param {Array} infos - Array of analysis info objects from MultiPV
 * @param {number} threshold - CPL threshold (default 200)
 * @returns {boolean} True if this appears to be an only move
 */
export function detectOnlyMove(infos, threshold = 200) {
  if (!Array.isArray(infos) || infos.length < 2) return false;
  
  const bestScore = scoreToCp(infos[0]?.score) ?? 0;
  const near = infos.filter((it) => {
    const sc = scoreToCp(it.score) ?? -99999;
    return Math.abs(sc - bestScore) <= 30;
  });
  
  return near.length === 1;
}

/**
 * Detect engine agreement
 * A move has agreement if it's within the top N lines and within threshold cp of best
 * @param {number} cpl - Centipawn loss of the played move
 * @param {Array} infos - Array of analysis info objects from MultiPV
 * @param {number} threshold - CPL threshold (default 30)
 * @returns {boolean} True if engine agrees with the move
 */
export function detectAgreement(cpl, infos, threshold = 30) {
  if (!Array.isArray(infos) || infos.length === 0) return false;
  return cpl <= threshold;
}

