import { parseFen, makeFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";
import EnginePool from "./enginePool.js";
import { scoreToCp } from "./moveEvaluation.js";

/**
 * Motif-specific puzzle validation
 * Implements validation logic based on puzzle objectives
 */

// Helper to parse motifs
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

// Helper to check if puzzle has specific motif
function hasMotif(motifs, pattern) {
  const parsed = parseMotifs(motifs);
  if (Array.isArray(pattern)) {
    // Check if any pattern matches
    return pattern.some(p => 
      parsed.some(m => 
        typeof m === "string" && m.toLowerCase().includes(p.toLowerCase())
      )
    );
  }
  return parsed.some(m => 
    typeof m === "string" && m.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Helper to count material in a position
function countMaterial(fen) {
  const setupRes = parseFen(fen);
  if (!setupRes.isOk) return null;
  
  const setup = setupRes.unwrap();
  let material = 0;
  
  // Piece values: pawn=1, knight/bishop=3, rook=5, queen=9
  const pieceValues = {
    p: 1, n: 3, b: 3, r: 5, q: 9,
    P: 1, N: 3, B: 3, R: 5, Q: 9,
  };
  
  for (const [square, piece] of setup.board) {
    if (piece) {
      material += pieceValues[piece] || 0;
    }
  }
  
  return material;
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

// Helper to analyze position with engine
async function analyzePosition(fen, depth = 8) {
  try {
    const result = await EnginePool.analyze({ fen, depth, multiPv: 1 });
    return scoreToCp(result.info?.score) ?? 0;
  } catch (error) {
    console.error("Engine analysis error:", error);
    return null;
  }
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
 * Validate material gain puzzles (fork, pin, skewer, hangingPiece, capturingDefender)
 */
export async function validateMaterialGainPuzzle(puzzle, initialFen, finalFen, pv) {
  const motifs = parseMotifs(puzzle.motifs);
  const materialGainMotifs = ["fork", "pin", "skewer", "hangingpiece", "capturingdefender"];
  const hasMaterialGainMotif = motifs.some(m => 
    materialGainMotifs.some(pattern => m.toLowerCase().includes(pattern))
  );
  
  if (!hasMaterialGainMotif) return { valid: true, reason: "Not a material gain puzzle" };
  
  // Verify material is actually gained
  const materialBefore = countMaterial(initialFen);
  const materialAfter = countMaterial(finalFen);
  
  if (materialBefore === null || materialAfter === null) {
    return { valid: false, reason: "Could not count material" };
  }
  
  if (materialAfter <= materialBefore) {
    return { 
      valid: false, 
      reason: `Material not gained: ${materialBefore} -> ${materialAfter}` 
    };
  }
  
  // Check intermediate position (allow temporary material loss)
  if (pv.length >= 2) {
    const afterTwoFen = applyMoves(initialFen, pv.slice(0, 2));
    if (afterTwoFen) {
      const intermediateEval = await analyzePosition(afterTwoFen, 8);
      if (intermediateEval !== null && intermediateEval < -100) {
        // Too much material loss, even temporarily
        return { 
          valid: false, 
          reason: `Intermediate position too bad: ${intermediateEval}cp` 
        };
      }
    }
  }
  
  // Final position should show clear material gain
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval !== null && finalEval < 100) {
    return { 
      valid: false, 
      reason: `Final evaluation too low for material gain: ${finalEval}cp` 
    };
  }
  
  return { valid: true, reason: "Material gain verified" };
}

/**
 * Validate sacrifice puzzles
 */
export async function validateSacrificePuzzle(puzzle, initialFen, pv) {
  if (!hasMotif(puzzle.motifs, "sacrifice")) {
    return { valid: true, reason: "Not a sacrifice puzzle" };
  }
  
  // Verify material is actually sacrificed (after first 2 moves)
  if (pv.length < 2) {
    return { valid: false, reason: "Sacrifice puzzle needs at least 2 moves" };
  }
  
  const afterTwoFen = applyMoves(initialFen, pv.slice(0, 2));
  if (!afterTwoFen) {
    return { valid: false, reason: "Could not apply first 2 moves" };
  }
  
  const materialBefore = countMaterial(initialFen);
  const materialAfter = countMaterial(afterTwoFen);
  
  if (materialBefore === null || materialAfter === null) {
    return { valid: false, reason: "Could not count material" };
  }
  
  if (materialAfter >= materialBefore) {
    return { 
      valid: false, 
      reason: `No sacrifice occurred: ${materialBefore} -> ${materialAfter}` 
    };
  }
  
  // Verify compensation (mate, material, or positional)
  const finalFen = applyMoves(initialFen, pv);
  if (!finalFen) {
    return { valid: false, reason: "Could not apply all moves" };
  }
  
  // Check for mate
  if (isCheckmate(finalFen)) {
    return { valid: true, reason: "Sacrifice leads to mate" };
  }
  
  // Check final evaluation
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval === null) {
    return { valid: false, reason: "Could not analyze final position" };
  }
  
  // Allow positional compensation (slight negative is OK if it leads to mate/material later)
  // But should be better than -50cp
  if (finalEval < -50) {
    // Check if material is regained later
    const finalMaterial = countMaterial(finalFen);
    if (finalMaterial !== null && finalMaterial >= materialBefore) {
      return { valid: true, reason: "Material regained after sacrifice" };
    }
    return { 
      valid: false, 
      reason: `Final evaluation too negative: ${finalEval}cp without compensation` 
    };
  }
  
  return { valid: true, reason: "Sacrifice compensated" };
}

/**
 * Validate equality puzzles
 */
export async function validateEqualityPuzzle(puzzle, initialFen, finalFen) {
  if (!hasMotif(puzzle.motifs, "equality")) {
    return { valid: true, reason: "Not an equality puzzle" };
  }
  
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval === null) {
    return { valid: false, reason: "Could not analyze final position" };
  }
  
  // Equality puzzles should result in ~0cp (balanced position)
  if (finalEval < -20 || finalEval > 20) {
    // If starting from disadvantage, allow improvement
    const initialEval = await analyzePosition(initialFen, 8);
    if (initialEval !== null && initialEval < -100) {
      // Starting from disadvantage, should improve
      if (finalEval >= -50 && finalEval < initialEval) {
        return { valid: true, reason: "Improved from disadvantage" };
      }
    }
    return { 
      valid: false, 
      reason: `Final evaluation not equal: ${finalEval}cp (should be -20 to +20)` 
    };
  }
  
  return { valid: true, reason: "Position equalized" };
}

/**
 * Validate defensive puzzles
 */
export async function validateDefensivePuzzle(puzzle, initialFen, pv) {
  if (!hasMotif(puzzle.motifs, "defensive")) {
    return { valid: true, reason: "Not a defensive puzzle" };
  }
  
  if (pv.length < 2) {
    return { valid: false, reason: "Defensive puzzle needs at least 2 moves" };
  }
  
  const initialEval = await analyzePosition(initialFen, 8);
  if (initialEval === null) {
    return { valid: false, reason: "Could not analyze initial position" };
  }
  
  const afterTwoFen = applyMoves(initialFen, pv.slice(0, 2));
  if (!afterTwoFen) {
    return { valid: false, reason: "Could not apply defensive move" };
  }
  
  const afterEval = await analyzePosition(afterTwoFen, 8);
  if (afterEval === null) {
    return { valid: false, reason: "Could not analyze position after defense" };
  }
  
  // Defense should maintain or improve position (prevent significant loss)
  if (afterEval < initialEval - 100) {
    return { 
      valid: false, 
      reason: `Defense failed: ${initialEval}cp -> ${afterEval}cp` 
    };
  }
  
  // Final position should be acceptable (not necessarily winning)
  const finalFen = applyMoves(initialFen, pv);
  if (finalFen) {
    const finalEval = await analyzePosition(finalFen, 8);
    if (finalEval !== null && finalEval < -50) {
      return { 
        valid: false, 
        reason: `Final position too bad: ${finalEval}cp` 
      };
    }
  }
  
  return { valid: true, reason: "Defense successful" };
}

/**
 * Validate advantage/crushing puzzles
 */
export async function validateAdvantagePuzzle(puzzle, finalFen) {
  const motifs = parseMotifs(puzzle.motifs);
  const hasAdvantage = hasMotif(puzzle.motifs, "advantage") || hasMotif(puzzle.motifs, "crushing");
  
  if (!hasAdvantage) {
    return { valid: true, reason: "Not an advantage puzzle" };
  }
  
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval === null) {
    return { valid: false, reason: "Could not analyze final position" };
  }
  
  const isCrushing = hasMotif(puzzle.motifs, "crushing");
  const threshold = isCrushing ? 200 : 50;
  
  if (finalEval < threshold) {
    return { 
      valid: false, 
      reason: `Final evaluation too low: ${finalEval}cp (need ${threshold}+ for ${isCrushing ? "crushing" : "advantage"})` 
    };
  }
  
  return { valid: true, reason: `${isCrushing ? "Crushing" : "Advantage"} verified` };
}

/**
 * Validate endgame puzzles
 */
export function validateEndgamePuzzle(puzzle, initialFen) {
  if (!hasMotif(puzzle.motifs, "endgame")) {
    return { valid: true, reason: "Not an endgame puzzle" };
  }
  
  const setupRes = parseFen(initialFen);
  if (!setupRes.isOk) {
    return { valid: false, reason: "Invalid FEN" };
  }
  
  const setup = setupRes.unwrap();
  let pieceCount = 0;
  
  // Count pieces (excluding kings)
  for (const [square, piece] of setup.board) {
    if (piece && piece !== "k" && piece !== "K") {
      pieceCount++;
    }
  }
  
  // Endgames should have ≤12 pieces (excluding kings)
  if (pieceCount > 12) {
    return { 
      valid: false, 
      reason: `Too many pieces for endgame: ${pieceCount} (max 12)` 
    };
  }
  
  return { valid: true, reason: "Endgame verified" };
}

/**
 * Validate mate puzzles
 */
export function validateMatePuzzle(puzzle, initialFen, pv) {
  const motifs = parseMotifs(puzzle.motifs);
  const isMate = motifs.some(m => 
    typeof m === "string" && m.toLowerCase().includes("mate") && !m.toLowerCase().includes("matein")
  );
  
  if (!isMate) {
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
  
  // Verify solver is the one delivering mate
  const setupRes = parseFen(initialFen);
  if (!setupRes.isOk) {
    return { valid: false, reason: "Invalid initial FEN" };
  }
  
  const startTurn = setupRes.unwrap().turn;
  const lastMover = pv.length % 2 === 1 ? startTurn : (startTurn === "white" ? "black" : "white");
  
  if (puzzle.sideToMove !== lastMover) {
    return { 
      valid: false, 
      reason: `Solver mismatch: puzzle.sideToMove=${puzzle.sideToMove}, lastMover=${lastMover}` 
    };
  }
  
  return { valid: true, reason: "Mate verified" };
}

/**
 * Validate zugzwang puzzles (lenient validation)
 */
export async function validateZugzwangPuzzle(puzzle, finalFen) {
  if (!hasMotif(puzzle.motifs, "zugzwang")) {
    return { valid: true, reason: "Not a zugzwang puzzle" };
  }
  
  // Zugzwang is hard to verify automatically
  // Use lenient thresholds - position should be close to equal
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval === null) {
    return { valid: false, reason: "Could not analyze final position" };
  }
  
  // Allow small advantage (zugzwang can lead to small gains)
  if (finalEval < -30 || finalEval > 50) {
    return { 
      valid: false, 
      reason: `Evaluation too extreme for zugzwang: ${finalEval}cp (should be -30 to +50)` 
    };
  }
  
  return { valid: true, reason: "Zugzwang position verified" };
}

/**
 * Main validation function - applies motif-specific validation
 */
export async function validatePuzzleByMotif(puzzle, initialFen, pv) {
  const finalFen = applyMoves(initialFen, pv);
  if (!finalFen) {
    return { valid: false, reason: "Could not apply all moves" };
  }
  
  // Check engine availability
  const engineReady = EnginePool.getStatus().ready;
  if (!engineReady) {
    // Without engine, only do structural validation
    const mateResult = validateMatePuzzle(puzzle, initialFen, pv);
    if (!mateResult.valid) return mateResult;
    
    const endgameResult = validateEndgamePuzzle(puzzle, initialFen);
    if (!endgameResult.valid) return endgameResult;
    
    return { valid: true, reason: "Structural validation passed (engine not available)" };
  }
  
  // Apply motif-specific validation in priority order
  const motifs = parseMotifs(puzzle.motifs);
  
  // 1. Mate puzzles (fast path, no engine needed)
  if (hasMotif(puzzle.motifs, "mate")) {
    return validateMatePuzzle(puzzle, initialFen, pv);
  }
  
  // 2. Material gain puzzles
  if (hasMotif(puzzle.motifs, ["fork", "pin", "skewer", "hangingpiece", "capturingdefender"])) {
    const result = await validateMaterialGainPuzzle(puzzle, initialFen, finalFen, pv);
    if (!result.valid) return result;
  }
  
  // 3. Sacrifice puzzles
  if (hasMotif(puzzle.motifs, "sacrifice")) {
    const result = await validateSacrificePuzzle(puzzle, initialFen, pv);
    if (!result.valid) return result;
  }
  
  // 4. Equality puzzles
  if (hasMotif(puzzle.motifs, "equality")) {
    const result = await validateEqualityPuzzle(puzzle, initialFen, finalFen);
    if (!result.valid) return result;
  }
  
  // 5. Defensive puzzles
  if (hasMotif(puzzle.motifs, "defensive")) {
    const result = await validateDefensivePuzzle(puzzle, initialFen, pv);
    if (!result.valid) return result;
  }
  
  // 6. Advantage/crushing puzzles
  if (hasMotif(puzzle.motifs, ["advantage", "crushing"])) {
    const result = await validateAdvantagePuzzle(puzzle, finalFen);
    if (!result.valid) return result;
  }
  
  // 7. Zugzwang puzzles
  if (hasMotif(puzzle.motifs, "zugzwang")) {
    const result = await validateZugzwangPuzzle(puzzle, finalFen);
    if (!result.valid) return result;
  }
  
  // 8. Endgame puzzles (structural check)
  const endgameResult = validateEndgamePuzzle(puzzle, initialFen);
  if (!endgameResult.valid) return endgameResult;
  
  // 9. Default validation for other puzzles (standard evaluation check)
  const finalEval = await analyzePosition(finalFen, 8);
  if (finalEval === null) {
    return { valid: false, reason: "Could not analyze final position" };
  }
  
  // Standard threshold: should gain advantage
  if (finalEval < 50) {
    return { 
      valid: false, 
      reason: `Final evaluation too low: ${finalEval}cp (need 50+ for standard puzzle)` 
    };
  }
  
  return { valid: true, reason: "Standard validation passed" };
}

