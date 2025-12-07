import { parseFen } from "chessops/fen";

// Import validation functions from puzzleRoutes
// Since we can't easily import from puzzleRoutes, we'll duplicate the functions here for testing
// In a real scenario, you might want to extract these to a shared utility file

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
      return Array.isArray(parsed) && parsed.some((m) => {
        const lowerM = m.toLowerCase();
        return lowerM.includes("mate") && !lowerM.includes("matein");
      });
    } catch {
      return false;
    }
  }
  return Array.isArray(motifs) && motifs.some((m) => {
    const lowerM = m.toLowerCase();
    return lowerM.includes("mate") && !lowerM.includes("matein");
  });
}

// Helper to normalize turn value to "white" or "black"
function normalizeTurn(turn) {
  if (turn === "white" || turn === "w" || turn === 0) return "white";
  if (turn === "black" || turn === "b" || turn === 1) return "black";
  return turn; // Return as-is if unknown format
}

// Helper to calculate last mover from FEN and PV
function calculateLastMover(fen, pv) {
  try {
    if (!fen) return null;
    const result = parseFen(fen);
    
    // chessops returns Result type (Ok/Err)
    if (!result || result.isErr) return null;
    
    const position = result.value;
    if (!position) return null;
    
    // Normalize turn value to "white" or "black"
    const startTurn = normalizeTurn(position.turn);
    const pvArray = typeof pv === "string" ? JSON.parse(pv) : pv;
    
    if (!Array.isArray(pvArray) || pvArray.length === 0) return null;
    
    // If PV length is odd, last mover = starting turn
    // If PV length is even, last mover = opposite
    const lastMover = pvArray.length % 2 === 1 ? startTurn : (startTurn === "white" ? "black" : "white");
    return lastMover;
  } catch (error) {
    // Return null on any error
    return null;
  }
}

// Helper to normalize move (for frontend validation testing)
function normalizeMove(uciMove) {
  return uciMove.slice(0, 4);
}

// Test runner
class ValidationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("🧪 Puzzle Validation Logic Tests\n");
    console.log("=".repeat(60));

    for (const { name, fn } of this.tests) {
      try {
        const result = await fn();
        if (result === true || (result && result.passed)) {
          this.passed++;
          const message = result?.message || "";
          console.log(`✅ ${name}${message ? ` - ${message}` : ""}`);
        } else {
          this.failed++;
          const message = result?.message || "Test failed";
          console.log(`❌ ${name} - ${message}`);
        }
      } catch (error) {
        this.failed++;
        console.log(`❌ ${name} - Error: ${error.message}`);
        if (error.stack) {
          console.log(`   ${error.stack.split("\n")[1]?.trim()}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 Results: ${this.passed} passed, ${this.failed} failed`);
    console.log("=".repeat(60) + "\n");

    return this.failed === 0;
  }
}

const runner = new ValidationTestRunner();

// ============================================================================
// FEN Validation Tests
// ============================================================================

runner.test("FEN Validation - Valid Starting Position", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const result = parseFen(fen);
  return result && result.isOk === true;
});

runner.test("FEN Validation - Valid Mid-Game Position", () => {
  const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
  const result = parseFen(fen);
  return result && result.isOk === true;
});

runner.test("FEN Validation - Invalid FEN Format", () => {
  const fen = "invalid fen string";
  const result = parseFen(fen);
  // parseFen returns Err result for invalid FENs
  return result && result.isErr === true;
});

runner.test("FEN Validation - Missing Fields", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
  const result = parseFen(fen);
  // Missing fields might still parse (with defaults) or return Err
  // This test checks that it doesn't crash and returns a result
  return result !== null && result !== undefined;
});

// ============================================================================
// PV Parsing Tests
// ============================================================================

runner.test("PV Parsing - Valid JSON String", () => {
  const pvString = '["e2e4", "e7e5", "g1f3"]';
  try {
    const parsed = JSON.parse(pvString);
    return Array.isArray(parsed) && parsed.length === 3;
  } catch {
    return false;
  }
});

runner.test("PV Parsing - Already Array", () => {
  const pvArray = ["e2e4", "e7e5", "g1f3"];
  return Array.isArray(pvArray) && pvArray.length === 3;
});

runner.test("PV Parsing - Invalid JSON", () => {
  const invalidJson = '["e2e4", "e7e5"'; // Missing closing bracket
  try {
    JSON.parse(invalidJson);
    return false; // Should not reach here
  } catch {
    return true; // Expected to throw
  }
});

runner.test("PV Parsing - Empty Array", () => {
  const emptyPv = [];
  return !(Array.isArray(emptyPv) && emptyPv.length > 0);
});

runner.test("PV Parsing - Non-Array Value", () => {
  const nonArray = "e2e4";
  return !Array.isArray(nonArray);
});

// ============================================================================
// Mate Puzzle Detection Tests
// ============================================================================

runner.test("Mate Puzzle Detection - Array with 'mate'", () => {
  const motifs = ["fork", "mate", "pin"];
  return isMatePuzzle(motifs) === true;
});

runner.test("Mate Puzzle Detection - JSON String with 'mate'", () => {
  const motifs = '["fork", "mate", "pin"]';
  return isMatePuzzle(motifs) === true;
});

runner.test("Mate Puzzle Detection - 'smotheredMate'", () => {
  const motifs = ["smotheredMate"];
  // "smotheredMate".includes("mate") is true, and !"smotheredMate".includes("mateIn") is true
  const result = isMatePuzzle(motifs);
  return result === true;
});

runner.test("Mate Puzzle Detection - 'arabianMate'", () => {
  const motifs = ["arabianMate"];
  // "arabianMate".includes("mate") is true, and !"arabianMate".includes("mateIn") is true
  const result = isMatePuzzle(motifs);
  return result === true;
});

runner.test("Mate Puzzle Detection - Excludes 'mateIn1'", () => {
  const motifs = ["mateIn1"];
  return isMatePuzzle(motifs) === false;
});

runner.test("Mate Puzzle Detection - Excludes 'mateIn2'", () => {
  const motifs = ["mateIn2"];
  return isMatePuzzle(motifs) === false;
});

runner.test("Mate Puzzle Detection - No Mate Motif", () => {
  const motifs = ["fork", "pin", "skewer"];
  return isMatePuzzle(motifs) === false;
});

runner.test("Mate Puzzle Detection - Invalid JSON String", () => {
  const motifs = '["fork", "mate"'; // Invalid JSON
  return isMatePuzzle(motifs) === false;
});

// ============================================================================
// Last Mover Calculation Tests
// ============================================================================

runner.test("Last Mover - Odd PV Length (White Starts)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4", "e7e5", "g1f3"]; // 3 moves (odd)
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "white";
});

runner.test("Last Mover - Even PV Length (White Starts)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4", "e7e5"]; // 2 moves (even)
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "black";
});

runner.test("Last Mover - Odd PV Length (Black Starts)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
  const pv = ["e7e5", "e2e4", "g1f3"]; // 3 moves (odd)
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "black";
});

runner.test("Last Mover - Even PV Length (Black Starts)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
  const pv = ["e7e5", "e2e4"]; // 2 moves (even)
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "white";
});

runner.test("Last Mover - Single Move (Odd)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4"]; // 1 move (odd)
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "white";
});

runner.test("Last Mover - Invalid FEN", () => {
  const fen = "invalid fen";
  const pv = ["e2e4"];
  const lastMover = calculateLastMover(fen, pv);
  // Should return null because parseFen will throw/return null for invalid FEN
  return lastMover === null;
});

runner.test("Last Mover - Empty PV", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = [];
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === null;
});

runner.test("Last Mover - PV as JSON String", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = '["e2e4", "e7e5"]';
  const lastMover = calculateLastMover(fen, pv);
  return lastMover === "black";
});

// ============================================================================
// Mate Puzzle Validation Tests
// ============================================================================

runner.test("Mate Validation - Valid Mate Puzzle (White Mates)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4", "e7e5", "Qh7#"]; // White delivers mate (3 moves, odd)
  const motifs = ["mate"];
  const sideToMove = "white";
  
  const isMate = isMatePuzzle(motifs);
  const lastMover = calculateLastMover(fen, pv);
  const isValid = isMate && lastMover === sideToMove;
  
  return isValid;
});

runner.test("Mate Validation - Invalid Mate Puzzle (Wrong Side)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4", "e7e5", "Qh7#"]; // White delivers mate
  const motifs = ["mate"];
  const sideToMove = "black"; // Wrong side
  
  const isMate = isMatePuzzle(motifs);
  const lastMover = calculateLastMover(fen, pv);
  const isValid = isMate && lastMover === sideToMove;
  
  return !isValid; // Should be invalid
});

runner.test("Mate Validation - Non-Mate Puzzle (No Validation)", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const pv = ["e2e4", "e7e5"];
  const motifs = ["fork"]; // Not a mate puzzle
  const sideToMove = "white";
  
  const isMate = isMatePuzzle(motifs);
  // Non-mate puzzles don't require last mover validation
  return !isMate;
});

// ============================================================================
// Move Normalization Tests
// ============================================================================

runner.test("Move Normalization - Standard Move", () => {
  const move = "e2e4";
  const normalized = normalizeMove(move);
  return normalized === "e2e4";
});

runner.test("Move Normalization - Move with Promotion", () => {
  const move = "e7e8q"; // Queen promotion
  const normalized = normalizeMove(move);
  return normalized === "e7e8";
});

runner.test("Move Normalization - Move with Knight Promotion", () => {
  const move = "e7e8n"; // Knight promotion
  const normalized = normalizeMove(move);
  return normalized === "e7e8";
});

runner.test("Move Normalization - Short Move", () => {
  const move = "e2"; // Invalid but should handle gracefully
  const normalized = normalizeMove(move);
  return normalized === "e2";
});

// ============================================================================
// Move Comparison Tests
// ============================================================================

runner.test("Move Comparison - Exact Match", () => {
  const userMove = "e2e4";
  const expectedMove = "e2e4";
  const expectedNormalized = normalizeMove(expectedMove);
  return userMove === expectedNormalized;
});

runner.test("Move Comparison - Match with Promotion", () => {
  const userMove = "e7e8";
  const expectedMove = "e7e8q";
  const expectedNormalized = normalizeMove(expectedMove);
  return userMove === expectedNormalized;
});

runner.test("Move Comparison - No Match", () => {
  const userMove = "e2e4";
  const expectedMove = "d2d4";
  const expectedNormalized = normalizeMove(expectedMove);
  return userMove !== expectedNormalized;
});

// ============================================================================
// Edge Case Tests
// ============================================================================

runner.test("Edge Case - Empty Database Handling", () => {
  const total = 0;
  const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
  return baseAttempts === 5; // Should use minimum
});

runner.test("Edge Case - Large Database Sampling", () => {
  const total = 10000;
  const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
  return baseAttempts === 25; // Should cap at 25
});

runner.test("Edge Case - Medium Database Sampling", () => {
  const total = 100;
  const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
  return baseAttempts === 10; // sqrt(100) = 10
});

runner.test("Edge Case - Motif Filter Doubles Attempts", () => {
  const total = 100;
  const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
  const attempts = Math.min(50, baseAttempts * 2);
  return attempts === 20; // 10 * 2 = 20
});

runner.test("Edge Case - Motif Filter Caps at 50", () => {
  const total = 10000;
  const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
  const attempts = Math.min(50, baseAttempts * 2);
  return attempts === 50; // Should cap at 50
});

runner.test("Edge Case - Null FEN in Last Mover", () => {
  const lastMover = calculateLastMover(null, ["e2e4"]);
  return lastMover === null;
});

runner.test("Edge Case - Null PV in Last Mover", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const lastMover = calculateLastMover(fen, null);
  return lastMover === null;
});

// ============================================================================
// Integration Tests (Simulating Full Validation Flow)
// ============================================================================

runner.test("Integration - Complete Valid Puzzle", () => {
  // Simulate a complete puzzle validation
  const puzzle = {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sideToMove: "white",
    solutionPv: '["e2e4", "e7e5", "g1f3"]',
    motifs: '["fork", "pin"]',
    rating: 1500,
  };

  // Parse PV
  let solutionPv;
  try {
    solutionPv = typeof puzzle.solutionPv === "string" 
      ? JSON.parse(puzzle.solutionPv) 
      : puzzle.solutionPv;
  } catch (error) {
    return false;
  }

  // Validate PV structure
  if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
    return false;
  }

  // Check if mate puzzle
  const isMate = isMatePuzzle(puzzle.motifs);
  
  if (isMate) {
    const lastMover = calculateLastMover(puzzle.fen, solutionPv);
    if (lastMover && puzzle.sideToMove !== lastMover) {
      return false;
    }
  }

  // All validations passed
  return true;
});

runner.test("Integration - Invalid Puzzle (Empty PV)", () => {
  const puzzle = {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sideToMove: "white",
    solutionPv: "[]",
    motifs: '["fork"]',
    rating: 1500,
  };

  let solutionPv;
  try {
    solutionPv = JSON.parse(puzzle.solutionPv);
  } catch (error) {
    return true; // Validation correctly rejected invalid JSON
  }

  // Validation should reject empty PV
  if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
    return true; // Validation correctly rejected empty PV
  }

  return false; // Should not reach here - validation should have failed
});

runner.test("Integration - Invalid Mate Puzzle (Wrong Side)", () => {
  const puzzle = {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sideToMove: "black", // Wrong side
    solutionPv: '["e2e4", "e7e5", "Qh7#"]', // White delivers mate
    motifs: '["mate"]',
    rating: 1500,
  };

  let solutionPv;
  try {
    solutionPv = JSON.parse(puzzle.solutionPv);
  } catch (error) {
    return false;
  }

  if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
    return false;
  }

  const isMate = isMatePuzzle(puzzle.motifs);
  
  if (isMate) {
    const lastMover = calculateLastMover(puzzle.fen, solutionPv);
    // Validation should reject when sideToMove doesn't match lastMover
    if (lastMover && puzzle.sideToMove !== lastMover) {
      return true; // Validation correctly rejected invalid puzzle
    }
  }

  return false; // Validation should have rejected but didn't
});

// ============================================================================
// Run Tests
// ============================================================================

async function main() {
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

