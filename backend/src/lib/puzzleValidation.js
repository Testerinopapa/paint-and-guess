import { parseFen, makeFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";

/**
 * Simplified puzzle validation - focuses on app-specific compatibility
 * Lichess already validates puzzle quality, so we only check:
 * - Structural integrity (FEN, PV format, move legality)
 * - Frontend compatibility (auto-advance, completeness)
 */

// Helper to parse motifs (for mate puzzle detection)
function parseMotifs(motifs) {
  if (typeof motifs === "string") {
    try {
      return JSON.parse(motifs);
    } catch {
      return [];
    }
  }
  return Array.isArray(motifs) ? motifs : [];
}

// Helper to check if puzzle is a mate puzzle
function isMatePuzzle(motifs) {
  const parsed = parseMotifs(motifs);
  return parsed.some(m => 
    typeof m === "string" && m.toLowerCase().includes("mate") && !m.toLowerCase().includes("matein")
  );
}

// Helper to apply moves and get resulting FEN
function applyMoves(fen, moves) {
  const setupRes = parseFen(fen);
  if (!setupRes.isOk) return null;
  
  const res = setupPosition("chess", setupRes.unwrap());
  if (!res.isOk) return null;
  const pos = res.unwrap();
  
  for (const uci of moves) {
    const mv = parseUci(uci);
    if (!mv || !pos.isLegal(mv)) return null;
    pos.play(mv);
  }
  
  return makeFen(pos.toSetup());
}

// Helper to check if position is checkmate
function isCheckmate(fen) {
  const setupRes = parseFen(fen);
  if (!setupRes.isOk) return false;
  
  const res = setupPosition("chess", setupRes.unwrap());
  if (!res.isOk) return false;
  const pos = res.unwrap();
  
  return pos.isCheckmate();
}

/**
 * Validate solver side consistency - ensures puzzle.sideToMove matches FEN turn
 * Simplified: just check that sideToMove matches the FEN's turn
 */
export function validateSolverSide(puzzle, initialFen, pv) {
  if (!puzzle.sideToMove) {
    // If sideToMove is not set, that's okay - we'll use FEN turn
    return { valid: true, reason: "sideToMove not set (will use FEN turn)" };
  }
  
  const setupRes = parseFen(initialFen);
  if (!setupRes.isOk) {
    return { valid: false, reason: "Invalid initial FEN" };
  }
  
  const fenTurn = setupRes.unwrap().turn;
  
  // Just verify that sideToMove matches the FEN's turn (if set)
  // This is a basic consistency check, not a complex calculation
  if (puzzle.sideToMove !== fenTurn) {
    // This is a warning, not an error - the FEN turn will be used anyway
    return { valid: true, reason: `sideToMove (${puzzle.sideToMove}) doesn't match FEN turn (${fenTurn}), will use FEN turn` };
  }
  
  return { valid: true, reason: "Solver side verified" };
}

/**
 * Validate mate puzzles - ensures checkmate occurs
 * For mate puzzles, we just verify that checkmate actually occurs
 */
export function validateMatePuzzle(puzzle, initialFen, pv) {
  if (!isMatePuzzle(puzzle.motifs)) {
    return { valid: true, reason: "Not a mate puzzle" };
  }
  
  // Verify actual checkmate occurs
  const finalFen = applyMoves(initialFen, pv);
  if (!finalFen) {
    return { valid: false, reason: "Could not apply moves" };
  }
  
  if (!isCheckmate(finalFen)) {
    return { valid: false, reason: "Final position is not checkmate" };
  }
  
  return { valid: true, reason: "Mate puzzle verified" };
}

/**
 * Main validation function - structural and compatibility checks only
 * Lichess already validates puzzle quality, so we focus on:
 * - FEN format validity
 * - PV format validity
 * - Move legality
 * - Solver side consistency (for auto-advance)
 * - Mate puzzle compatibility (for auto-advance)
 */
export function validatePuzzle(puzzle, initialFen, pv) {
  // 1. Validate FEN format
  const setupRes = parseFen(initialFen);
  if (!setupRes.isOk) {
    return { valid: false, reason: "Invalid FEN format" };
  }
  
  // 2. Validate PV format and apply moves
  if (!Array.isArray(pv) || pv.length === 0) {
    return { valid: false, reason: "Invalid or empty PV" };
  }
  
  // 3. Verify all moves are legal
  const finalFen = applyMoves(initialFen, pv);
  if (!finalFen) {
    return { valid: false, reason: "Could not apply all moves (illegal move detected)" };
  }
  
  // 4. Validate solver side consistency (basic check - FEN turn will be used)
  // This is just a consistency check, not a strict requirement
  validateSolverSide(puzzle, initialFen, pv);
  
  // 5. Validate mate puzzles (additional checks for mate puzzles)
  const mateResult = validateMatePuzzle(puzzle, initialFen, pv);
  if (!mateResult.valid) {
    return mateResult;
  }
  
  return { valid: true, reason: "Puzzle validated (structural checks passed)" };
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use validatePuzzle instead
 */
export async function validatePuzzleByMotif(puzzle, initialFen, pv) {
  // Simply call the simplified validation (no async needed anymore)
  return validatePuzzle(puzzle, initialFen, pv);
}
