import { prisma } from "../src/prismaClient.js";
import { parseFen, makeFen } from "chessops/fen";
import { Chess as ChessOps } from "chessops/chess";
import { parseUci } from "chessops/util";

/**
 * Fix puzzle move ordering issue
 * 
 * Problem: Some puzzles have solutionPv starting with the opponent's move instead of the player's move
 * Expected: solutionPv should be [playerMove1, opponentReply1, playerMove2, opponentReply2, ...]
 * 
 * This script:
 * 1. Analyzes all puzzles to find ones with incorrect move order
 * 2. Fixes the move order by ensuring first move matches sideToMove
 * 3. Reports statistics on fixes
 */

async function fixPuzzleMoveOrder() {
  console.log("🔧 Fixing Puzzle Move Order\n");
  console.log("=".repeat(60));

  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    const allPuzzles = await prisma.puzzle.findMany({
      orderBy: { createdAt: "desc" },
    });

    const totalPuzzles = allPuzzles.length;
    console.log(`📊 Total puzzles in database: ${totalPuzzles}\n`);

    if (totalPuzzles === 0) {
      console.log("⚠️  No puzzles found in database!");
      await prisma.$disconnect();
      return;
    }

    const results = {
      correct: [],
      needsFix: [],
      fixed: [],
      errors: [],
    };

    console.log("🔎 Analyzing puzzle move order...\n");

    for (let i = 0; i < allPuzzles.length; i++) {
      const puzzle = allPuzzles[i];
      const puzzleNum = i + 1;
      
      if (puzzleNum % 100 === 0) {
        console.log(`   Progress: ${puzzleNum}/${totalPuzzles} puzzles analyzed...`);
      }

      try {
        // Parse puzzle data
        const solutionPv = typeof puzzle.solutionPv === "string" 
          ? JSON.parse(puzzle.solutionPv) 
          : puzzle.solutionPv;

        if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
          results.errors.push({
            id: puzzle.id,
            error: "Invalid or empty PV",
          });
          continue;
        }

        // Parse FEN to get starting position
        const setupResult = parseFen(puzzle.fen);
        if (!setupResult.isOk) {
          results.errors.push({
            id: puzzle.id,
            error: "Invalid FEN",
          });
          continue;
        }

        const posResult = ChessOps.fromSetup(setupResult.unwrap());
        if (!posResult.isOk) {
          results.errors.push({
            id: puzzle.id,
            error: "Cannot create position from FEN",
          });
          continue;
        }

        const startPos = posResult.unwrap();
        const startTurn = startPos.turn; // "white" or "black"
        const expectedSide = puzzle.sideToMove; // "white" or "black"

        // Check if first move matches the expected side
        const firstMove = solutionPv[0];
        const move = parseUci(firstMove);
        
        if (!move) {
          results.errors.push({
            id: puzzle.id,
            error: "Cannot parse first move",
            move: firstMove,
          });
          continue;
        }

        // Check if move is legal
        const ctx = startPos.ctx();
        if (!startPos.isLegal(move, ctx)) {
          results.errors.push({
            id: puzzle.id,
            error: "First move is illegal",
            move: firstMove,
            fen: puzzle.fen,
          });
          continue;
        }

        // Determine which side the first move belongs to
        // The move is legal for the current turn, so:
        // - If startTurn is "white", first move is White's move
        // - If startTurn is "black", first move is Black's move
        const firstMoveSide = startTurn === "white" ? "white" : "black";

        // Check if first move matches expected side
        if (firstMoveSide === expectedSide) {
          // Move order is correct
          results.correct.push({
            id: puzzle.id,
            firstMove: firstMove,
            sideToMove: expectedSide,
            firstMoveSide: firstMoveSide,
          });
        } else {
          // Move order is incorrect - first move is opponent's move
          // We need to check if removing the first move fixes it
          // OR if we need to reorder the moves
          
          // Try playing the first move to see what the next position is
          const testPos = startPos.clone();
          testPos.play(move);
          const nextTurn = testPos.turn;
          const nextSide = nextTurn === "white" ? "white" : "black";

          // If the next turn matches expectedSide, then we should remove the first move
          // OR if solutionPv[1] matches expectedSide, we should shift the array
          if (nextSide === expectedSide && solutionPv.length > 1) {
            // The first move is opponent's move, we should remove it
            results.needsFix.push({
              id: puzzle.id,
              issue: "First move is opponent's move",
              firstMove: firstMove,
              firstMoveSide: firstMoveSide,
              expectedSide: expectedSide,
              solutionPv: solutionPv,
              fix: "remove_first_move",
            });
          } else {
            // More complex issue - might need manual review
            results.needsFix.push({
              id: puzzle.id,
              issue: "Move order mismatch",
              firstMove: firstMove,
              firstMoveSide: firstMoveSide,
              expectedSide: expectedSide,
              solutionPv: solutionPv,
              fix: "manual_review",
            });
          }
        }
      } catch (error) {
        results.errors.push({
          id: puzzle.id,
          error: error.message,
        });
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 ANALYSIS SUMMARY\n");
    
    console.log(`✅ Correct puzzles: ${results.correct.length}`);
    console.log(`❌ Puzzles needing fix: ${results.needsFix.length}`);
    console.log(`⚠️  Errors: ${results.errors.length}\n`);

    // Show breakdown of fixes needed
    const removeFirstMove = results.needsFix.filter(p => p.fix === "remove_first_move");
    const manualReview = results.needsFix.filter(p => p.fix === "manual_review");

    console.log("🔧 FIX BREAKDOWN:\n");
    console.log(`   Remove first move: ${removeFirstMove.length}`);
    console.log(`   Manual review needed: ${manualReview.length}\n`);

    // Apply fixes
    if (removeFirstMove.length > 0) {
      console.log("🔨 Applying fixes...\n");
      
      for (const puzzleFix of removeFirstMove) {
        try {
          const puzzle = allPuzzles.find(p => p.id === puzzleFix.id);
          if (!puzzle) continue;

          const solutionPv = typeof puzzle.solutionPv === "string" 
            ? JSON.parse(puzzle.solutionPv) 
            : puzzle.solutionPv;

          // Remove first move (opponent's move)
          const fixedPv = solutionPv.slice(1);

          // Update puzzle in database
          await prisma.puzzle.update({
            where: { id: puzzle.id },
            data: {
              solutionPv: JSON.stringify(fixedPv),
            },
          });

          results.fixed.push({
            id: puzzle.id,
            originalLength: solutionPv.length,
            fixedLength: fixedPv.length,
            removedMove: solutionPv[0],
          });
        } catch (error) {
          console.error(`   ⚠️  Error fixing puzzle ${puzzleFix.id}:`, error.message);
        }
      }

      console.log(`   ✅ Fixed ${results.fixed.length} puzzles\n`);
    }

    // Show sample fixes
    if (results.fixed.length > 0) {
      console.log("📋 SAMPLE FIXES (first 10):\n");
      results.fixed.slice(0, 10).forEach((fix, idx) => {
        console.log(`   ${idx + 1}. ID: ${fix.id}`);
        console.log(`      Removed: ${fix.removedMove}`);
        console.log(`      Length: ${fix.originalLength} → ${fix.fixedLength}\n`);
      });
    }

    // Export results
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const { dirname } = path;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputDir = path.join(__dirname, "..", "validation-results");
    
    try {
      await fs.promises.mkdir(outputDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(outputDir, `puzzle-move-order-fix-${timestamp}.json`);
    
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPuzzles: totalPuzzles,
        correct: results.correct.length,
        needsFix: results.needsFix.length,
        fixed: results.fixed.length,
        errors: results.errors.length,
      },
      correct: results.correct,
      needsFix: results.needsFix,
      fixed: results.fixed,
      errors: results.errors,
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`💾 Results saved to: ${outputFile}\n`);

    console.log("=".repeat(60));
    console.log("✅ Fix complete!\n");

  } catch (error) {
    console.error("\n❌ Fix failed:");
    console.error(error);
    if (error.message) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the fix
fixPuzzleMoveOrder().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

