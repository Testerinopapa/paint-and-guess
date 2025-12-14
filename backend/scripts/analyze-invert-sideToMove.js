import { prisma } from "../src/prismaClient.js";
import { parseFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";

/**
 * Analyze and optionally invert sideToMove values in the database
 * 
 * This script:
 * 1. Analyzes all puzzles to determine if sideToMove matches the solution PV structure
 * 2. Counts how many puzzles have mismatched sideToMove
 * 3. Optionally inverts all sideToMove values if needed
 */

/**
 * Determine which side should solve the puzzle based on solution PV
 * The player is the side that makes the LAST move in the solution (the solver)
 */
function calculateExpectedPlayerSide(fen, solutionPv) {
  try {
    const setupRes = parseFen(fen);
    if (!setupRes.isOk) return null;
    
    const fenTurn = setupRes.unwrap().turn; // "white" | "black"
    
    // If PV length is odd: last mover = starting turn (FEN turn)
    // If PV length is even: last mover = opposite of starting turn
    const expectedPlayerSide = (solutionPv.length % 2 === 1) 
      ? fenTurn 
      : (fenTurn === "white" ? "black" : "white");
    
    return expectedPlayerSide;
  } catch (error) {
    return null;
  }
}

/**
 * Analyze a single puzzle
 */
function analyzePuzzle(puzzle) {
  try {
    // Parse solution PV
    const solutionPv = typeof puzzle.solutionPv === "string"
      ? JSON.parse(puzzle.solutionPv)
      : puzzle.solutionPv;
    
    if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
      return {
        valid: false,
        reason: "Invalid or empty solutionPv",
        needsInversion: false,
      };
    }
    
    // Calculate expected player side from PV structure
    const expectedPlayerSide = calculateExpectedPlayerSide(puzzle.fen, solutionPv);
    
    if (!expectedPlayerSide) {
      return {
        valid: false,
        reason: "Could not calculate expected player side",
        needsInversion: false,
      };
    }
    
    // Check if database sideToMove matches expected
    const matches = puzzle.sideToMove === expectedPlayerSide;
    
    return {
      valid: true,
      databaseSideToMove: puzzle.sideToMove,
      expectedPlayerSide: expectedPlayerSide,
      matches: matches,
      needsInversion: !matches,
      fenTurn: parseFen(puzzle.fen).unwrap().turn,
      pvLength: solutionPv.length,
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Error: ${error.message}`,
      needsInversion: false,
    };
  }
}

/**
 * Main analysis function
 */
async function analyzeSideToMove() {
  console.log("🔍 Analyzing sideToMove values in database\n");
  console.log("=".repeat(60));
  
  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");
    
    const allPuzzles = await prisma.puzzle.findMany();
    console.log(`📊 Found ${allPuzzles.length} puzzles to analyze\n`);
    
    let matches = 0;
    let mismatches = 0;
    let invalid = 0;
    const mismatchDetails = [];
    
    for (let i = 0; i < allPuzzles.length; i++) {
      const puzzle = allPuzzles[i];
      const puzzleNum = i + 1;
      
      if (puzzleNum % 100 === 0) {
        console.log(`   Progress: ${puzzleNum}/${allPuzzles.length}... (${matches} match, ${mismatches} mismatch)`);
      }
      
      const analysis = analyzePuzzle(puzzle);
      
      if (!analysis.valid) {
        invalid++;
        continue;
      }
      
      if (analysis.matches) {
        matches++;
      } else {
        mismatches++;
        if (mismatchDetails.length < 20) {
          mismatchDetails.push({
            id: puzzle.id,
            database: analysis.databaseSideToMove,
            expected: analysis.expectedPlayerSide,
            fenTurn: analysis.fenTurn,
            pvLength: analysis.pvLength,
          });
        }
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 Analysis Results\n");
    console.log(`Total Puzzles: ${allPuzzles.length}`);
    console.log(`✅ Matches: ${matches} (${((matches / allPuzzles.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Mismatches: ${mismatches} (${((mismatches / allPuzzles.length) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Invalid: ${invalid}`);
    
    if (mismatchDetails.length > 0) {
      console.log("\n📋 Sample Mismatches:");
      mismatchDetails.forEach((detail, idx) => {
        console.log(`  ${idx + 1}. Puzzle ${detail.id}:`);
        console.log(`     Database: ${detail.database}, Expected: ${detail.expected}`);
        console.log(`     FEN Turn: ${detail.fenTurn}, PV Length: ${detail.pvLength}`);
      });
    }
    
    // Calculate inversion recommendation
    const mismatchPercentage = (mismatches / allPuzzles.length) * 100;
    console.log("\n" + "=".repeat(60));
    if (mismatchPercentage > 80) {
      console.log("💡 Recommendation: HIGH mismatch rate detected!");
      console.log("   It appears most puzzles have inverted sideToMove values.");
      console.log("   Consider running with --invert flag to fix all puzzles.");
    } else if (mismatchPercentage > 50) {
      console.log("💡 Recommendation: Significant mismatch rate detected.");
      console.log("   Consider investigating the source data or running with --invert flag.");
    } else {
      console.log("✅ Most puzzles have correct sideToMove values.");
    }
    
    await prisma.$disconnect();
    return { matches, mismatches, invalid, total: allPuzzles.length };
    
  } catch (error) {
    console.error("\n❌ Analysis failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

/**
 * Invert all sideToMove values in the database
 */
async function invertAllSideToMove() {
  console.log("🔄 Inverting all sideToMove values\n");
  console.log("=".repeat(60));
  
  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");
    
    const allPuzzles = await prisma.puzzle.findMany();
    console.log(`📊 Found ${allPuzzles.length} puzzles to invert\n`);
    
    let inverted = 0;
    let errors = 0;
    const errorDetails = [];
    
    for (let i = 0; i < allPuzzles.length; i++) {
      const puzzle = allPuzzles[i];
      const puzzleNum = i + 1;
      
      if (puzzleNum % 100 === 0) {
        console.log(`   Progress: ${puzzleNum}/${allPuzzles.length}... (${inverted} inverted)`);
      }
      
      try {
        // Invert sideToMove
        const newSideToMove = puzzle.sideToMove === "white" ? "black" : "white";
        
        await prisma.puzzle.update({
          where: { id: puzzle.id },
          data: {
            sideToMove: newSideToMove,
          },
        });
        
        inverted++;
      } catch (error) {
        errors++;
        if (errorDetails.length < 10) {
          errorDetails.push({
            id: puzzle.id,
            error: error.message,
          });
        }
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 Inversion Results\n");
    console.log(`Total Puzzles: ${allPuzzles.length}`);
    console.log(`✅ Inverted: ${inverted}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (errorDetails.length > 0) {
      console.log("\n⚠️  Sample Errors:");
      errorDetails.forEach((err, idx) => {
        console.log(`  ${idx + 1}. Puzzle ${err.id}: ${err.error}`);
      });
    }
    
    await prisma.$disconnect();
    console.log("\n✅ Inversion complete!");
    
  } catch (error) {
    console.error("\n❌ Inversion failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

/**
 * Look up a specific puzzle by ID and display its contents
 */
async function lookupPuzzleById(puzzleId) {
  console.log(`🔍 Looking up puzzle: ${puzzleId}\n`);
  console.log("=".repeat(60));
  
  try {
    await prisma.$connect();
    console.log("✅ Connected to database\n");
    
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: puzzleId },
    });
    
    if (!puzzle) {
      console.log(`❌ Puzzle not found with ID: ${puzzleId}`);
      await prisma.$disconnect();
      return;
    }
    
    // Parse solution PV
    const solutionPv = typeof puzzle.solutionPv === "string"
      ? JSON.parse(puzzle.solutionPv)
      : puzzle.solutionPv;
    
    // Parse motifs
    const motifs = typeof puzzle.motifs === "string"
      ? JSON.parse(puzzle.motifs)
      : puzzle.motifs;
    
    // Analyze the puzzle
    const analysis = analyzePuzzle(puzzle);
    
    console.log("📋 Puzzle Details:\n");
    console.log(`ID: ${puzzle.id}`);
    console.log(`FEN: ${puzzle.fen}`);
    console.log(`Side to Move (database): ${puzzle.sideToMove}`);
    console.log(`Rating: ${puzzle.rating || "N/A"}`);
    console.log(`Source: ${puzzle.source}`);
    console.log(`Created At: ${puzzle.createdAt}`);
    console.log(`\nSolution PV (${solutionPv.length} moves):`);
    solutionPv.forEach((move, idx) => {
      console.log(`  ${idx + 1}. ${move}`);
    });
    console.log(`\nMotifs: ${Array.isArray(motifs) ? motifs.join(", ") : motifs}`);
    
    if (analysis.valid) {
      console.log("\n📊 Analysis:");
      console.log(`  Expected Player Side: ${analysis.expectedPlayerSide}`);
      console.log(`  Database sideToMove: ${analysis.databaseSideToMove}`);
      console.log(`  FEN Turn: ${analysis.fenTurn}`);
      console.log(`  PV Length: ${analysis.pvLength}`);
      console.log(`  Matches: ${analysis.matches ? "✅ YES" : "❌ NO"}`);
      if (!analysis.matches) {
        console.log(`  ⚠️  MISMATCH: Database says "${analysis.databaseSideToMove}" but should be "${analysis.expectedPlayerSide}"`);
      }
    } else {
      console.log(`\n⚠️  Analysis failed: ${analysis.reason}`);
    }
    
    await prisma.$disconnect();
    console.log("\n✅ Lookup complete!");
    
  } catch (error) {
    console.error("\n❌ Lookup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const shouldInvert = args.includes("--invert") || args.includes("-i");
const puzzleIdArg = args.find(arg => arg.startsWith("--id="))?.split("=")[1] || 
                    args.find(arg => arg.startsWith("-id="))?.split("=")[1];

if (puzzleIdArg) {
  lookupPuzzleById(puzzleIdArg);
} else if (shouldInvert) {
  console.log("⚠️  WARNING: This will invert ALL sideToMove values in the database!");
  console.log("   Make sure you've analyzed first and confirmed this is needed.\n");
  
  // Ask for confirmation (in a real scenario, you might want to add a prompt)
  console.log("🔄 Starting inversion...\n");
  invertAllSideToMove();
} else {
  analyzeSideToMove();
}

