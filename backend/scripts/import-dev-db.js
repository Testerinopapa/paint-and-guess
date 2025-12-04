import { prisma } from "../src/prismaClient.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDbPath = path.resolve(__dirname, "../../ChessModeDocs/CorrectDBARch/prisma/dev.db");

console.log("🔄 Importing data from:", sourceDbPath);
console.log("=".repeat(50));

if (!fs.existsSync(sourceDbPath)) {
  console.error("❌ Source database not found at:", sourceDbPath);
  process.exit(1);
}

try {
  // Connect to source database
  const sourceDb = new Database(sourceDbPath, { readonly: true });
  
  // Connect to target database via Prisma
  await prisma.$connect();
  console.log("✅ Connected to both databases\n");
  
  // Import Puzzles
  console.log("📦 Importing Puzzles...");
  const puzzles = sourceDb.prepare("SELECT * FROM Puzzle").all();
  console.log(`   Found ${puzzles.length} puzzles`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const puzzle of puzzles) {
    try {
      // Check if puzzle already exists (by source or by FEN + first move)
      const existing = await prisma.puzzle.findFirst({
        where: {
          OR: [
            { id: puzzle.id },
            { source: puzzle.source },
          ],
        },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await prisma.puzzle.create({
        data: {
          id: puzzle.id,
          createdAt: new Date(puzzle.createdAt),
          fen: puzzle.fen,
          sideToMove: puzzle.sideToMove,
          solutionPv: puzzle.solutionPv,
          motifs: puzzle.motifs,
          source: puzzle.source,
          rating: puzzle.rating,
        },
      });
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} imported, ${skipped} skipped`);
      }
    } catch (error) {
      console.error(`   ⚠️  Error importing puzzle ${puzzle.id}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}\n`);
  
  // Import PuzzleAttempts
  console.log("📦 Importing PuzzleAttempts...");
  const attempts = sourceDb.prepare("SELECT * FROM PuzzleAttempt").all();
  console.log(`   Found ${attempts.length} attempts`);
  
  imported = 0;
  skipped = 0;
  
  for (const attempt of attempts) {
    try {
      // Check if puzzle exists (required for foreign key)
      const puzzleExists = await prisma.puzzle.findUnique({
        where: { id: attempt.puzzleId },
      });
      
      if (!puzzleExists) {
        skipped++;
        continue;
      }
      
      // Check if attempt already exists
      const existing = await prisma.puzzleAttempt.findUnique({
        where: { id: attempt.id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await prisma.puzzleAttempt.create({
        data: {
          id: attempt.id,
          createdAt: new Date(attempt.createdAt),
          puzzleId: attempt.puzzleId,
          timeMs: attempt.timeMs,
          mistakes: attempt.mistakes,
          solved: attempt.solved,
          rating: attempt.rating,
        },
      });
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} imported, ${skipped} skipped`);
      }
    } catch (error) {
      console.error(`   ⚠️  Error importing attempt ${attempt.id}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}\n`);
  
  // Summary
  const finalPuzzleCount = await prisma.puzzle.count();
  const finalAttemptCount = await prisma.puzzleAttempt.count();
  
  console.log("=".repeat(50));
  console.log("✅ Import complete!");
  console.log(`   Total Puzzles: ${finalPuzzleCount}`);
  console.log(`   Total Attempts: ${finalAttemptCount}`);
  console.log("=".repeat(50));
  
  sourceDb.close();
  await prisma.$disconnect();
  
} catch (error) {
  console.error("\n❌ Import failed:", error);
  process.exit(1);
}

