import { prisma } from "../src/prismaClient.js";
import { parseFen, makeFen } from "chessops/fen";
import { Chess as ChessOps } from "chessops/chess";
import { parseUci } from "chessops/util";
import EnginePool from "../src/lib/enginePool.js";

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

    // Initialize engine pool
    console.log("🔧 Initializing engine...\n");
    try {
      EnginePool.ensureStarted();
      // Wait a bit for engine to be ready
      let attempts = 0;
      while (attempts < 20 && !EnginePool.getStatus().ready) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (EnginePool.getStatus().ready) {
        console.log("✅ Engine ready\n");
      } else {
        console.log("⚠️  Engine not ready, will use basic validation only\n");
      }
    } catch (engineError) {
      console.log(`⚠️  Engine initialization failed: ${engineError.message}`);
      console.log("   Will use basic validation only...\n");
    }

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

        // Check if move is legal by trying to play it
        // Use play() instead of isLegal() as it's more reliable
        let testPos;
        try {
          testPos = startPos.clone();
          const playResult = testPos.play(move);
          
          // play() may return a Result type or void - check if it failed
          if (playResult && typeof playResult === 'object' && 'isOk' in playResult && !playResult.isOk) {
            results.errors.push({
              id: puzzle.id,
              error: "First move is illegal",
              move: firstMove,
              fen: puzzle.fen,
            });
            continue;
          }
          // If play() succeeded (returned void or Ok result), move is legal
        } catch (playError) {
          // If play() throws, the move is illegal
          results.errors.push({
            id: puzzle.id,
            error: "First move is illegal",
            move: firstMove,
            fen: puzzle.fen,
          });
          continue;
        }
        
        // If engine is available, also validate it's a reasonable move
        let moveValidatedByEngine = false;
        if (EnginePool.getStatus().ready) {
          try {
            const analysis = await Promise.race([
              EnginePool.analyze({
                fen: puzzle.fen,
                depth: 6, // Fast depth for validation
                multiPv: 3, // Check top 3 moves
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Engine timeout")), 5000)
              )
            ]);
            
            if (analysis.info && analysis.bestmove) {
              // Check if first move is in top 3 engine moves
              const firstMoveNormalized = firstMove.slice(0, 4).toLowerCase();
              const bestMoveNormalized = analysis.bestmove.slice(0, 4).toLowerCase();
              
              if (firstMoveNormalized === bestMoveNormalized) {
                moveValidatedByEngine = true;
              } else if (analysis.infos && analysis.infos.length > 0) {
                // Check if it's in the top 3 moves
                for (const info of analysis.infos.slice(0, 3)) {
                  if (info.pv && info.pv.length > 0) {
                    const pvMove = info.pv[0].slice(0, 4).toLowerCase();
                    if (pvMove === firstMoveNormalized) {
                      moveValidatedByEngine = true;
                      break;
                    }
                  }
                }
              }
            }
          } catch (engineError) {
            // Engine validation failed - that's okay, we'll proceed with basic validation
            if (puzzleNum % 100 === 0) {
              console.warn(`   Engine validation failed for puzzle ${puzzle.id}: ${engineError.message}`);
            }
          }
        }

        // Determine which side the first move belongs to
        // The move was successfully played, so it belongs to the side whose turn it was
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
            engineValidated: moveValidatedByEngine,
          });
        } else {
          // Move order is incorrect - first move is opponent's move
          // We need to check if removing the first move fixes it
          
          // We already played the move above, so use that result
          // testPos was already created and move was played, so get next turn from there
          const nextTurn = testPos.turn;
          const nextSide = nextTurn === "white" ? "white" : "black";

          // Special case: Single-move puzzles are valid for beginners!
          // If it's a single move and it's the opponent's move, the FEN or sideToMove might be wrong
          // But we can't just remove the move (would leave empty array)
          // Check if maybe the FEN represents the position AFTER the opponent's move
          if (solutionPv.length === 1) {
            // Single-move puzzle where first move doesn't match sideToMove
            // This could mean:
            // 1. The FEN is wrong (should be before opponent's move)
            // 2. The sideToMove is wrong
            // 3. The move is actually correct but stored wrong
            // For now, flag for manual review but note it's a single-move puzzle
            results.needsFix.push({
              id: puzzle.id,
              issue: "Single-move puzzle: first move doesn't match sideToMove",
              firstMove: firstMove,
              firstMoveSide: firstMoveSide,
              expectedSide: expectedSide,
              solutionPv: solutionPv,
              fix: "manual_review",
              note: "Single-move puzzles are valid for beginners - check if FEN or sideToMove is incorrect",
            });
          } else if (nextSide === expectedSide && solutionPv.length > 1) {
            // The first move is opponent's move, and removing it would leave valid moves
            // We should remove it
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

          // Parse FEN to check which side should move first
          const setupResult = parseFen(puzzle.fen);
          if (!setupResult.isOk) continue;
          
          const posResult = ChessOps.fromSetup(setupResult.unwrap());
          if (!posResult.isOk) continue;
          
          const startPos = posResult.unwrap();
          const expectedSide = puzzle.sideToMove;
          const startTurn = startPos.turn;
          
          // Recursively remove opponent moves from the start until we find the player's move
          let fixedPv = [...solutionPv];
          let removedMoves = [];
          let attempts = 0;
          const maxAttempts = 10; // Safety limit
          
          while (attempts < maxAttempts && fixedPv.length > 0) {
            const firstMove = fixedPv[0];
            const move = parseUci(firstMove);
            
            if (!move) break; // Can't parse, stop
            
            // Check which side this move belongs to
            const currentTurn = startPos.turn;
            const moveSide = currentTurn === "white" ? "white" : "black";
            
            // If this move matches the expected side, we're done
            if (moveSide === expectedSide) {
              break;
            }
            
            // This is still an opponent move, remove it
            removedMoves.push(fixedPv.shift());
            
            // Play the move to update the position for next check
            try {
              startPos.play(move);
            } catch {
              break; // Can't play, stop
            }
            
            attempts++;
          }
          
          // Only update if we actually removed moves and have moves left
          if (removedMoves.length > 0 && fixedPv.length > 0) {
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
              removedMoves: removedMoves,
              removedCount: removedMoves.length,
            });
          }
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

