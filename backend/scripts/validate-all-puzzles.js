import { prisma } from "../src/prismaClient.js";
import { parseFen, makeFen } from "chessops/fen";
import { Chess as ChessOps } from "chessops/chess";
import { parseUci } from "chessops/util";
import EnginePool from "../src/lib/enginePool.js";
import { scoreToCp } from "../src/lib/moveEvaluation.js";

/**
 * Validate all puzzles in the database using the same logic as the frontend
 * This script checks for the same validation errors that cause "Puzzle configuration error"
 */

async function validateAllPuzzles() {
  console.log("🔍 Validating All Puzzles in Database\n");
  console.log("=".repeat(60));

  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // Get all puzzles
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

    // Validation results
    const results = {
      valid: [],
      invalid: [],
      engineValidated: 0,
      engineSkipped: 0,
      engineErrors: 0,
      errors: {
        invalidFen: [],
        invalidPv: [],
        emptyPv: [],
        tooShortForAutoAdvance: [],
        wouldBeCompleteOnLoad: [],
        autoAdvanceFailed: [],
        solutionNotBestMove: [],
        multipleSolutions: [],
        solutionMoveIllegal: [],
        other: [],
      },
    };

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
        console.log("⚠️  Engine not ready, continuing without engine validation\n");
      }
    } catch (engineError) {
      console.log(`⚠️  Engine initialization failed: ${engineError.message}`);
      console.log("   Continuing with structural validation only...\n");
    }

    console.log("🔎 Validating puzzles...\n");

    for (let i = 0; i < allPuzzles.length; i++) {
      const puzzle = allPuzzles[i];
      const puzzleNum = i + 1;
      
      if (puzzleNum % 50 === 0) {
        const engineStatus = EnginePool.getStatus();
        console.log(`   Progress: ${puzzleNum}/${totalPuzzles} puzzles checked... (Engine: ${engineStatus.ready ? "ready" : "not ready"})`);
      }

      const puzzleErrors = [];

      // 1. Validate FEN
      const setupResult = parseFen(puzzle.fen);
      if (!setupResult.isOk) {
        puzzleErrors.push("Invalid FEN");
        results.errors.invalidFen.push({
          id: puzzle.id,
          fen: puzzle.fen,
          error: "FEN parsing failed",
        });
      }

      // 2. Validate solution PV
      let solutionPv;
      try {
        solutionPv = typeof puzzle.solutionPv === "string" 
          ? JSON.parse(puzzle.solutionPv) 
          : puzzle.solutionPv;
      } catch (e) {
        puzzleErrors.push("Invalid PV JSON");
        results.errors.invalidPv.push({
          id: puzzle.id,
          error: `JSON parse error: ${e.message}`,
        });
        continue; // Skip rest of validation for this puzzle
      }

      if (!Array.isArray(solutionPv)) {
        puzzleErrors.push("PV is not an array");
        results.errors.invalidPv.push({
          id: puzzle.id,
          error: "PV is not an array",
          type: typeof solutionPv,
        });
        continue;
      }

      if (solutionPv.length === 0) {
        puzzleErrors.push("Empty PV");
        results.errors.emptyPv.push({
          id: puzzle.id,
        });
        continue;
      }

      // 3. Validate puzzle loading logic (same as frontend)
      let initialFen = puzzle.fen;
      let initialMoveIndex = 0;

      // Check if it's a mate puzzle
      let motifs;
      try {
        motifs = typeof puzzle.motifs === "string" 
          ? JSON.parse(puzzle.motifs) 
          : puzzle.motifs;
      } catch (e) {
        motifs = [];
      }

      const isMatePuzzle = Array.isArray(motifs) && motifs.some(m => 
        typeof m === "string" && m.includes("mate") && !m.includes("mateIn")
      );

      // Try to create chessops position for auto-advance check
      let tempPos;
      if (setupResult.isOk) {
        const posResult = ChessOps.fromSetup(setupResult.unwrap());
        if (posResult.isOk) {
          tempPos = posResult.unwrap();
        } else {
          puzzleErrors.push("Cannot create ChessOps position");
          results.errors.other.push({
            id: puzzle.id,
            error: "ChessOps position creation failed",
          });
          continue;
        }
      } else {
        continue; // Already handled invalid FEN above
      }

      // Check if mate puzzle needs auto-advance
      // Determine current turn from FEN
      const fenParts = puzzle.fen.split(" ");
      const currentTurn = fenParts[1] === "w" ? "white" : "black";
      
      if (isMatePuzzle && puzzle.sideToMove !== currentTurn) {
        if (solutionPv.length > 0) {
          const firstMove = solutionPv[0];
          try {
            const move = parseUci(firstMove);
            if (!move) {
              puzzleErrors.push("Auto-advance move cannot be parsed");
              results.errors.autoAdvanceFailed.push({
                id: puzzle.id,
                move: firstMove,
                error: "Cannot parse UCI move",
              });
            } else {
              const ctx = tempPos.ctx();
              if (!tempPos.isLegal(move, ctx)) {
                puzzleErrors.push("Auto-advance move is illegal");
                results.errors.autoAdvanceFailed.push({
                  id: puzzle.id,
                  move: firstMove,
                  error: "Move is illegal",
                });
              } else {
                const testPos = tempPos.clone();
                testPos.play(move);
                initialFen = makeFen(testPos.toSetup());
                
                // Check if puzzle would be too short after auto-advance
                if (solutionPv.length < 3) {
                  puzzleErrors.push("Too short for auto-advance");
                  results.errors.tooShortForAutoAdvance.push({
                    id: puzzle.id,
                    length: solutionPv.length,
                    needs: 3,
                  });
                } else {
                  initialMoveIndex = 2;
                }
              }
            }
          } catch (e) {
            puzzleErrors.push("Auto-advance failed");
            results.errors.autoAdvanceFailed.push({
              id: puzzle.id,
              move: solutionPv[0],
              error: e.message,
            });
          }
        }
      }

      // 4. Check if puzzle would be complete on load
      if (initialMoveIndex >= solutionPv.length) {
        puzzleErrors.push("Would be complete on load");
        results.errors.wouldBeCompleteOnLoad.push({
          id: puzzle.id,
          moveIndex: initialMoveIndex,
          length: solutionPv.length,
          isMatePuzzle,
          sideToMove: puzzle.sideToMove,
        });
      }

      // 5. Validate with chessops (same as frontend)
      if (setupResult.isOk) {
        const posResult = ChessOps.fromSetup(setupResult.unwrap());
        if (!posResult.isOk) {
          puzzleErrors.push("Invalid chessops position");
          results.errors.other.push({
            id: puzzle.id,
            error: "ChessOps position creation failed",
          });
        }
      }

      // 6. Engine validation - check if solution move is actually best move
      // Only validate if puzzle passed all structural checks and engine is ready
      if (puzzleErrors.length === 0 && solutionPv.length > 0) {
        if (EnginePool.getStatus().ready) {
          try {
            // Get the first move in the solution (the move the player should make)
            const solutionMove = solutionPv[0];
            
            // Analyze the position to get best moves
            // Use a timeout to prevent hanging
            const analysisPromise = EnginePool.analyze({
              fen: initialFen,
              depth: 8, // Fast depth for validation
              multiPv: 3, // Check top 3 moves to see if solution is unique
            });
            
            // Add timeout (10 seconds per puzzle)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Engine analysis timeout")), 10000)
            );
            
            const analysis = await Promise.race([analysisPromise, timeoutPromise]);
            
            // Mark as validated only if analysis succeeded
            results.engineValidated++;

            if (analysis.info && analysis.infos && analysis.infos.length > 0) {
            const bestMove = analysis.bestmove;
            const bestScore = scoreToCp(analysis.info.score) ?? 0;
            const bestIsMate = analysis.info.score?.type === "mate";
            
            // Check if solution move matches best move
            const solutionMoveNormalized = solutionMove.slice(0, 4).toLowerCase();
            const bestMoveNormalized = bestMove ? bestMove.slice(0, 4).toLowerCase() : null;
            
            const solutionMatchesBest = solutionMoveNormalized === bestMoveNormalized;
            
            // Check if solution move is in top 3 and within 30cp threshold
            let solutionInTopMoves = false;
            let solutionScore = null;
            
            for (const info of analysis.infos) {
              if (info.pv && info.pv.length > 0) {
                const pvMove = info.pv[0];
                const pvMoveNormalized = pvMove.slice(0, 4).toLowerCase();
                if (pvMoveNormalized === solutionMoveNormalized) {
                  solutionInTopMoves = true;
                  solutionScore = scoreToCp(info.score) ?? 0;
                  break;
                }
              }
            }

            // Check if solution is within 30cp of best (from detectAgreement)
            const evalDiff = solutionScore !== null ? Math.abs(bestScore - solutionScore) : Infinity;
            const solutionIsAcceptable = solutionMatchesBest || (solutionInTopMoves && evalDiff <= 30);

            if (!solutionIsAcceptable) {
              puzzleErrors.push("Solution not best move");
              results.errors.solutionNotBestMove.push({
                id: puzzle.id,
                solutionMove: solutionMove,
                bestMove: bestMove,
                solutionScore: solutionScore,
                bestScore: bestScore,
                evalDiff: evalDiff,
                bestIsMate,
              });
            }

            // Check for multiple equivalent solutions (within 30cp)
            if (analysis.infos.length >= 2) {
              const secondBestScore = scoreToCp(analysis.infos[1]?.score) ?? 0;
              const secondBestIsMate = analysis.infos[1]?.score?.type === "mate";
              
              // If second best is within 30cp and not a mate, puzzle might have multiple solutions
              const scoreDiff = Math.abs(bestScore - secondBestScore);
              if (scoreDiff <= 30 && !bestIsMate && !secondBestIsMate) {
                // Check if second best move is different from solution
                const secondBestMove = analysis.infos[1]?.pv?.[0];
                if (secondBestMove && secondBestMove.slice(0, 4).toLowerCase() !== solutionMoveNormalized) {
                  puzzleErrors.push("Multiple equivalent solutions");
                  results.errors.multipleSolutions.push({
                    id: puzzle.id,
                    solutionMove: solutionMove,
                    alternativeMove: secondBestMove,
                    solutionScore: bestScore,
                    alternativeScore: secondBestScore,
                    evalDiff: scoreDiff,
                  });
                }
              }
            }

            // Validate that solution move is actually legal
            if (tempPos && solutionMove) {
              const move = parseUci(solutionMove);
              if (move) {
                const ctx = tempPos.ctx();
                if (!tempPos.isLegal(move, ctx)) {
                  puzzleErrors.push("Solution move is illegal");
                  results.errors.solutionMoveIllegal.push({
                    id: puzzle.id,
                    move: solutionMove,
                    fen: initialFen,
                  });
                }
              }
            }
          } else {
            // Engine analysis failed - log but don't fail puzzle
            console.warn(`[Puzzle ${puzzle.id}] Engine analysis returned no results`);
          }
          } catch (engineError) {
            // Engine validation failed - log but don't fail puzzle
            // (engine might not be available or might timeout)
            results.engineErrors++;
            if (puzzleNum % 10 === 0) {
              // Only log every 10th error to avoid spam
              console.warn(`[Puzzle ${puzzle.id}] Engine validation error: ${engineError.message}`);
            }
            // Don't add to errors - engine validation is optional
            // But mark puzzle as having engine validation skipped
          }
        } else {
          // Engine not ready - skip engine validation
          results.engineSkipped++;
        }
      }

      // Record result
      if (puzzleErrors.length === 0) {
        results.valid.push({
          id: puzzle.id,
          rating: puzzle.rating,
          source: puzzle.source,
          pvLength: solutionPv.length,
          isMatePuzzle,
        });
      } else {
        results.invalid.push({
          id: puzzle.id,
          rating: puzzle.rating,
          source: puzzle.source,
          errors: puzzleErrors,
        });
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 VALIDATION SUMMARY\n");
    
    const validCount = results.valid.length;
    const invalidCount = results.invalid.length;
    const validPercent = totalPuzzles > 0 
      ? ((validCount / totalPuzzles) * 100).toFixed(1) 
      : 0;

    console.log(`✅ Valid puzzles: ${validCount} (${validPercent}%)`);
    console.log(`❌ Invalid puzzles: ${invalidCount} (${(100 - validPercent).toFixed(1)}%)\n`);
    
    // Engine validation statistics
    if (results.engineValidated > 0 || results.engineSkipped > 0) {
      console.log("🔧 ENGINE VALIDATION STATISTICS:\n");
      console.log(`   Puzzles validated with engine: ${results.engineValidated}`);
      console.log(`   Puzzles skipped (engine not ready): ${results.engineSkipped}`);
      console.log(`   Engine validation errors: ${results.engineErrors}\n`);
    }

    // Error breakdown
    console.log("🔴 ERROR BREAKDOWN:\n");
    console.log(`   Invalid FEN: ${results.errors.invalidFen.length}`);
    console.log(`   Invalid PV (JSON/type): ${results.errors.invalidPv.length}`);
    console.log(`   Empty PV: ${results.errors.emptyPv.length}`);
    console.log(`   Too short for auto-advance: ${results.errors.tooShortForAutoAdvance.length}`);
    console.log(`   Would be complete on load: ${results.errors.wouldBeCompleteOnLoad.length}`);
    console.log(`   Auto-advance failed: ${results.errors.autoAdvanceFailed.length}`);
    console.log(`   Solution not best move: ${results.errors.solutionNotBestMove.length}`);
    console.log(`   Multiple equivalent solutions: ${results.errors.multipleSolutions.length}`);
    console.log(`   Solution move illegal: ${results.errors.solutionMoveIllegal.length}`);
    console.log(`   Other errors: ${results.errors.other.length}\n`);

    // Show sample invalid puzzles
    if (results.invalid.length > 0) {
      console.log("📋 SAMPLE INVALID PUZZLES (first 10):\n");
      results.invalid.slice(0, 10).forEach((puzzle, idx) => {
        console.log(`   ${idx + 1}. ID: ${puzzle.id}`);
        console.log(`      Rating: ${puzzle.rating ?? "N/A"}`);
        console.log(`      Source: ${puzzle.source}`);
        console.log(`      Errors: ${puzzle.errors.join(", ")}\n`);
      });

      if (results.invalid.length > 10) {
        console.log(`   ... and ${results.invalid.length - 10} more invalid puzzles\n`);
      }
    }

    // Show statistics by source
    const bySource = {};
    results.valid.forEach(p => {
      bySource[p.source] = (bySource[p.source] || { valid: 0, invalid: 0 });
      bySource[p.source].valid++;
    });
    results.invalid.forEach(p => {
      bySource[p.source] = (bySource[p.source] || { valid: 0, invalid: 0 });
      bySource[p.source].invalid++;
    });

    if (Object.keys(bySource).length > 0) {
      console.log("📊 VALIDATION BY SOURCE:\n");
      Object.entries(bySource).forEach(([source, counts]) => {
        const total = counts.valid + counts.invalid;
        const percent = total > 0 ? ((counts.valid / total) * 100).toFixed(1) : 0;
        console.log(`   ${source}:`);
        console.log(`      Valid: ${counts.valid} (${percent}%)`);
        console.log(`      Invalid: ${counts.invalid} (${(100 - percent).toFixed(1)}%)\n`);
      });
    }

    // Export comprehensive results to file
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const { dirname } = path;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputDir = path.join(__dirname, "..", "validation-results");
    
    // Create output directory if it doesn't exist
    try {
      await fs.promises.mkdir(outputDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(outputDir, `puzzle-validation-${timestamp}.json`);
    
    // Create comprehensive output
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPuzzles: totalPuzzles,
        validCount: results.valid.length,
        invalidCount: results.invalid.length,
        validPercent: totalPuzzles > 0 ? ((results.valid.length / totalPuzzles) * 100).toFixed(2) : 0,
        invalidPercent: totalPuzzles > 0 ? ((results.invalid.length / totalPuzzles) * 100).toFixed(2) : 0,
        engineValidated: results.engineValidated,
        engineSkipped: results.engineSkipped,
        engineErrors: results.engineErrors,
      },
      errorBreakdown: {
        invalidFen: results.errors.invalidFen.length,
        invalidPv: results.errors.invalidPv.length,
        emptyPv: results.errors.emptyPv.length,
        tooShortForAutoAdvance: results.errors.tooShortForAutoAdvance.length,
        wouldBeCompleteOnLoad: results.errors.wouldBeCompleteOnLoad.length,
        autoAdvanceFailed: results.errors.autoAdvanceFailed.length,
        solutionNotBestMove: results.errors.solutionNotBestMove.length,
        multipleSolutions: results.errors.multipleSolutions.length,
        solutionMoveIllegal: results.errors.solutionMoveIllegal.length,
        other: results.errors.other.length,
      },
      errorDetails: {
        invalidFen: results.errors.invalidFen,
        invalidPv: results.errors.invalidPv,
        emptyPv: results.errors.emptyPv,
        tooShortForAutoAdvance: results.errors.tooShortForAutoAdvance,
        wouldBeCompleteOnLoad: results.errors.wouldBeCompleteOnLoad,
        autoAdvanceFailed: results.errors.autoAdvanceFailed,
        solutionNotBestMove: results.errors.solutionNotBestMove,
        multipleSolutions: results.errors.multipleSolutions,
        solutionMoveIllegal: results.errors.solutionMoveIllegal,
        other: results.errors.other,
      },
      validPuzzles: results.valid,
      invalidPuzzles: results.invalid,
      invalidPuzzleIds: results.invalid.map(p => p.id),
      statistics: {
        bySource: {},
        byRating: {
          easy: { valid: 0, invalid: 0 },
          medium: { valid: 0, invalid: 0 },
          hard: { valid: 0, invalid: 0 },
          noRating: { valid: 0, invalid: 0 },
        },
        byPvLength: {},
      },
    };

    // Calculate statistics by source
    results.valid.forEach(p => {
      const source = p.source || "unknown";
      if (!output.statistics.bySource[source]) {
        output.statistics.bySource[source] = { valid: 0, invalid: 0 };
      }
      output.statistics.bySource[source].valid++;
    });
    results.invalid.forEach(p => {
      const source = p.source || "unknown";
      if (!output.statistics.bySource[source]) {
        output.statistics.bySource[source] = { valid: 0, invalid: 0 };
      }
      output.statistics.bySource[source].invalid++;
    });

    // Calculate statistics by rating
    results.valid.forEach(p => {
      if (!p.rating) {
        output.statistics.byRating.noRating.valid++;
      } else if (p.rating <= 1400) {
        output.statistics.byRating.easy.valid++;
      } else if (p.rating <= 2000) {
        output.statistics.byRating.medium.valid++;
      } else {
        output.statistics.byRating.hard.valid++;
      }
    });
    results.invalid.forEach(p => {
      if (!p.rating) {
        output.statistics.byRating.noRating.invalid++;
      } else if (p.rating <= 1400) {
        output.statistics.byRating.easy.invalid++;
      } else if (p.rating <= 2000) {
        output.statistics.byRating.medium.invalid++;
      } else {
        output.statistics.byRating.hard.invalid++;
      }
    });

    // Calculate statistics by PV length
    results.valid.forEach(p => {
      const length = p.pvLength || 0;
      if (!output.statistics.byPvLength[length]) {
        output.statistics.byPvLength[length] = { valid: 0, invalid: 0 };
      }
      output.statistics.byPvLength[length].valid++;
    });
    results.invalid.forEach(p => {
      // Get PV length from puzzle data
      const puzzle = allPuzzles.find(pp => pp.id === p.id);
      if (puzzle) {
        try {
          const pv = typeof puzzle.solutionPv === "string" 
            ? JSON.parse(puzzle.solutionPv) 
            : puzzle.solutionPv;
          const length = Array.isArray(pv) ? pv.length : 0;
          if (!output.statistics.byPvLength[length]) {
            output.statistics.byPvLength[length] = { valid: 0, invalid: 0 };
          }
          output.statistics.byPvLength[length].invalid++;
        } catch (e) {
          // Skip if can't parse
        }
      }
    });

    // Write output file
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`💾 Full validation results saved to: ${outputFile}\n`);

    // Also create a simple invalid IDs file for easy reference
    if (results.invalid.length > 0) {
      const invalidIdsFile = path.join(outputDir, "invalid-puzzle-ids.json");
      fs.writeFileSync(invalidIdsFile, JSON.stringify(results.invalid.map(p => p.id), null, 2));
      console.log(`💾 Invalid puzzle IDs saved to: ${invalidIdsFile}\n`);
    }

    console.log("=".repeat(60));
    console.log("✅ Validation complete!\n");

    // Exit with error code if all puzzles are invalid
    if (validCount === 0 && totalPuzzles > 0) {
      console.log("⚠️  WARNING: All puzzles are invalid!");
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Validation failed:");
    console.error(error);
    if (error.message) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  } finally {
    // Cleanup
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
    
    // Note: EnginePool doesn't need explicit cleanup, it manages its own lifecycle
  }
}

// Run the validation
validateAllPuzzles().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

