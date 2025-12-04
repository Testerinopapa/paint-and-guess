import { prisma } from "../backend/src/prismaClient.js";
import { parseFen } from "chessops";

async function testPuzzleDatabase() {
  console.log("🧪 Testing Puzzle Database\n");
  console.log("=".repeat(50));

  try {
    // Test 1: Database Connection
    console.log("\n1️⃣ Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test 2: Count total puzzles
    console.log("\n2️⃣ Counting puzzles in database...");
    const totalPuzzles = await prisma.puzzle.count();
    console.log(`   Total puzzles: ${totalPuzzles}`);

    if (totalPuzzles === 0) {
      console.log("⚠️  No puzzles found in database!");
      console.log("   You may need to import puzzles first.");
      await prisma.$disconnect();
      return;
    }

    // Test 3: Get a sample puzzle
    console.log("\n3️⃣ Fetching a sample puzzle...");
    const samplePuzzle = await prisma.puzzle.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (samplePuzzle) {
      console.log(`   Puzzle ID: ${samplePuzzle.id}`);
      console.log(`   Source: ${samplePuzzle.source}`);
      console.log(`   Rating: ${samplePuzzle.rating ?? "N/A"}`);
      console.log(`   Side to move: ${samplePuzzle.sideToMove}`);
      console.log(`   Created: ${samplePuzzle.createdAt.toISOString()}`);
      
      // Parse and show solution
      try {
        const solutionPv = JSON.parse(samplePuzzle.solutionPv);
        console.log(`   Solution moves: ${solutionPv.length}`);
        console.log(`   First 3 moves: ${solutionPv.slice(0, 3).join(", ")}`);
      } catch (e) {
        console.log(`   ⚠️  Could not parse solution PV`);
      }

      // Parse and show motifs
      try {
        const motifs = JSON.parse(samplePuzzle.motifs);
        console.log(`   Motifs: ${motifs.join(", ")}`);
      } catch (e) {
        console.log(`   ⚠️  Could not parse motifs`);
      }

      // Validate FEN
      const position = parseFen(samplePuzzle.fen);
      if (position) {
        console.log(`   ✅ FEN is valid`);
      } else {
        console.log(`   ⚠️  FEN is invalid`);
      }
    }

    // Test 4: Count by rating ranges
    console.log("\n4️⃣ Counting puzzles by difficulty...");
    const easyCount = await prisma.puzzle.count({
      where: {
        rating: { gte: 0, lte: 1400 },
      },
    });
    const mediumCount = await prisma.puzzle.count({
      where: {
        rating: { gte: 1400, lte: 2000 },
      },
    });
    const hardCount = await prisma.puzzle.count({
      where: {
        rating: { gte: 2000, lte: 10000 },
      },
    });
    const noRatingCount = await prisma.puzzle.count({
      where: {
        rating: null,
      },
    });

    console.log(`   Easy (0-1400): ${easyCount}`);
    console.log(`   Medium (1400-2000): ${mediumCount}`);
    console.log(`   Hard (2000-10000): ${hardCount}`);
    console.log(`   No rating: ${noRatingCount}`);

    // Test 5: Test random puzzle query (like the API does)
    console.log("\n5️⃣ Testing random puzzle selection...");
    const randomPuzzle = await prisma.puzzle.findMany({
      take: 1,
      skip: Math.floor(Math.random() * totalPuzzles),
    });

    if (randomPuzzle.length > 0) {
      console.log(`   ✅ Successfully fetched random puzzle: ${randomPuzzle[0].id}`);
    } else {
      console.log(`   ⚠️  Could not fetch random puzzle`);
    }

    // Test 6: Count puzzles with motifs
    console.log("\n6️⃣ Testing motif filtering...");
    const matePuzzles = await prisma.puzzle.count({
      where: {
        motifs: { contains: "mate" },
      },
    });
    const forkPuzzles = await prisma.puzzle.count({
      where: {
        motifs: { contains: "fork" },
      },
    });
    console.log(`   Puzzles with 'mate' motif: ${matePuzzles}`);
    console.log(`   Puzzles with 'fork' motif: ${forkPuzzles}`);

    // Test 7: Check puzzle attempts
    console.log("\n7️⃣ Checking puzzle attempts...");
    const totalAttempts = await prisma.puzzleAttempt.count();
    const solvedAttempts = await prisma.puzzleAttempt.count({
      where: { solved: true },
    });
    console.log(`   Total attempts: ${totalAttempts}`);
    console.log(`   Solved attempts: ${solvedAttempts}`);
    if (totalAttempts > 0) {
      console.log(`   Success rate: ${((solvedAttempts / totalAttempts) * 100).toFixed(1)}%`);
    }

    // Test 8: Validate puzzle data integrity
    console.log("\n8️⃣ Validating puzzle data integrity...");
    const puzzlesToCheck = await prisma.puzzle.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    let validCount = 0;
    let invalidFenCount = 0;
    let invalidPvCount = 0;

    for (const puzzle of puzzlesToCheck) {
      const position = parseFen(puzzle.fen);
      if (!position) {
        invalidFenCount++;
        continue;
      }

      try {
        const pv = JSON.parse(puzzle.solutionPv);
        if (!Array.isArray(pv) || pv.length === 0) {
          invalidPvCount++;
          continue;
        }
        validCount++;
      } catch (e) {
        invalidPvCount++;
      }
    }

    console.log(`   Checked ${puzzlesToCheck.length} puzzles:`);
    console.log(`   ✅ Valid: ${validCount}`);
    console.log(`   ⚠️  Invalid FEN: ${invalidFenCount}`);
    console.log(`   ⚠️  Invalid PV: ${invalidPvCount}`);

    // Test 9: Check database indexes
    console.log("\n9️⃣ Database summary...");
    const oldestPuzzle = await prisma.puzzle.findFirst({
      orderBy: { createdAt: "asc" },
    });
    const newestPuzzle = await prisma.puzzle.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (oldestPuzzle && newestPuzzle) {
      console.log(`   Oldest puzzle: ${oldestPuzzle.createdAt.toISOString()}`);
      console.log(`   Newest puzzle: ${newestPuzzle.createdAt.toISOString()}`);
    }

    const avgRating = await prisma.puzzle.aggregate({
      _avg: { rating: true },
      where: { rating: { not: null } },
    });
    if (avgRating._avg.rating) {
      console.log(`   Average rating: ${Math.round(avgRating._avg.rating)}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ All database tests completed successfully!");
    console.log("=".repeat(50) + "\n");

  } catch (error) {
    console.error("\n❌ Database test failed:");
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

// Run the test
testPuzzleDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

