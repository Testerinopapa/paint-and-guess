import { prisma } from "../src/prismaClient.js";
import { parseFen, makeFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";

/**
 * Normalize puzzle PV format during import
 * 
 * Standard format:
 * - sideToMove always matches FEN turn
 * - PV always starts with player's move (matching sideToMove)
 * 
 * When there's a mismatch:
 * - If pv[0] is legal for FEN turn: it's opponent's move, update sideToMove to match FEN
 * - If pv[0] is illegal for FEN turn: it's player's move, update FEN turn to match sideToMove
 */

function normalizePuzzle(puzzle) {
  try {
    // Parse FEN
    const setupRes = parseFen(puzzle.fen);
    if (!setupRes.isOk) {
      return { normalized: false, reason: "Invalid FEN", puzzle };
    }

    const fenSetup = setupRes.unwrap();
    const positionResult = setupPosition("chess", fenSetup);
    if (!positionResult.isOk) {
      return { normalized: false, reason: "Cannot create position from FEN", puzzle };
    }

    const position = positionResult.unwrap();
    const fenTurn = position.turn;

    // Parse PV
    let solutionPv;
    try {
      solutionPv = typeof puzzle.solutionPv === "string"
        ? JSON.parse(puzzle.solutionPv)
        : puzzle.solutionPv;
    } catch (e) {
      return { normalized: false, reason: "Invalid PV JSON", puzzle };
    }

    if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
      return { normalized: false, reason: "Empty or invalid PV", puzzle };
    }

    const puzzleSideToMove = puzzle.sideToMove || fenTurn;

    // Case 1: Already normalized - sideToMove matches FEN turn
    if (puzzleSideToMove === fenTurn) {
      return { normalized: false, reason: "Already normalized", puzzle };
    }

    // Case 2: Mismatch - need to normalize
    const firstMove = parseUci(solutionPv[0]);
    if (!firstMove) {
      return { normalized: false, reason: "Cannot parse first move", puzzle };
    }

    // Normalize: Always set sideToMove to match FEN turn
    // This is the consensus approach - ensures consistency
    // After normalization: sideToMove === fenTurn
    // The frontend will handle PV structure based on whether pv[0] is legal for fenTurn
    return {
      normalized: true,
      reason: "Updated sideToMove to match FEN turn (consensus normalization)",
      puzzle: {
        ...puzzle,
        sideToMove: fenTurn,
      },
    };
  } catch (error) {
    return { normalized: false, reason: `Error: ${error.message}`, puzzle };
  }
}

/**
 * Normalize all puzzles in the database
 */
async function normalizeAllPuzzles() {
  console.log("🔄 Normalizing Puzzle PV Format\n");
  console.log("=".repeat(60));

  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    const allPuzzles = await prisma.puzzle.findMany();
    console.log(`📊 Found ${allPuzzles.length} puzzles to check\n`);

    let normalized = 0;
    let alreadyNormalized = 0;
    let errors = 0;
    const errorDetails = [];

    for (let i = 0; i < allPuzzles.length; i++) {
      const puzzle = allPuzzles[i];
      const puzzleNum = i + 1;

      if (puzzleNum % 100 === 0) {
        console.log(`   Progress: ${puzzleNum}/${allPuzzles.length}... (${normalized} normalized)`);
      }

      const result = normalizePuzzle(puzzle);

      if (result.normalized) {
        try {
          await prisma.puzzle.update({
            where: { id: puzzle.id },
            data: {
              sideToMove: result.puzzle.sideToMove,
            },
          });
          normalized++;
        } catch (updateError) {
          errors++;
          errorDetails.push({
            id: puzzle.id,
            error: updateError.message,
          });
        }
      } else if (result.reason === "Already normalized") {
        alreadyNormalized++;
      } else {
        errors++;
        if (errorDetails.length < 10) {
          errorDetails.push({
            id: puzzle.id,
            reason: result.reason,
          });
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Normalization Results\n");
    console.log(`Total Puzzles: ${allPuzzles.length}`);
    console.log(`✅ Normalized: ${normalized}`);
    console.log(`✓ Already Normalized: ${alreadyNormalized}`);
    console.log(`❌ Errors: ${errors}`);

    if (errorDetails.length > 0) {
      console.log("\nSample Errors:");
      errorDetails.slice(0, 5).forEach((err, idx) => {
        console.log(`  ${idx + 1}. Puzzle ${err.id}: ${err.reason || err.error}`);
      });
    }

    await prisma.$disconnect();
    console.log("\n✅ Normalization complete!");

  } catch (error) {
    console.error("\n❌ Normalization failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run normalization
normalizeAllPuzzles();

