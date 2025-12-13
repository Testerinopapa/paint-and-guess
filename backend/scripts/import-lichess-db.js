import { prisma } from "../src/prismaClient.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
// No normalization - puzzles imported as-is, preserving puzzle intent

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDbPath = path.resolve(__dirname, "../../ChessModeDocs/LichessDB&Schema/dev.db");

console.log("🔄 Importing puzzles from LichessDB");
console.log("📁 Source database:", sourceDbPath);
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
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  // Import puzzles as-is, preserving puzzle intent (sideToMove)
  // Frontend will handle any mismatches between sideToMove and FEN turn
  // Use upsert to update existing puzzles with original values from source
  for (const puzzle of puzzles) {
    try {
      // Check if puzzle already exists
      const existing = await prisma.puzzle.findFirst({
        where: {
          OR: [
            { id: puzzle.id },
            { source: puzzle.source },
          ],
        },
      });
      
      if (existing) {
        // Update existing puzzle to restore original puzzle intent
        await prisma.puzzle.update({
          where: { id: existing.id },
          data: {
            fen: puzzle.fen,
            sideToMove: puzzle.sideToMove, // Restore original puzzle intent
            solutionPv: puzzle.solutionPv,
            motifs: puzzle.motifs,
            rating: puzzle.rating,
          },
        });
        updated++;
      } else {
        // Import new puzzle as-is, preserving original puzzle intent
        await prisma.puzzle.create({
          data: {
            id: puzzle.id,
            createdAt: new Date(puzzle.createdAt),
            fen: puzzle.fen,
            sideToMove: puzzle.sideToMove, // Preserve puzzle intent
            solutionPv: puzzle.solutionPv,
            motifs: puzzle.motifs,
            source: puzzle.source,
            rating: puzzle.rating,
          },
        });
        imported++;
      }
      
      if ((imported + updated) % 100 === 0) {
        console.log(`   Progress: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors} errors`);
      }
    } catch (error) {
      errors++;
      if (errors <= 10) {
        console.error(`   ⚠️  Error importing puzzle ${puzzle.id}:`, error.message);
      }
    }
  }
  
  console.log(`   ✅ Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}\n`);
  
  // Summary
  const finalPuzzleCount = await prisma.puzzle.count();
  
  console.log("=".repeat(50));
  console.log("✅ Import complete!");
  console.log(`   Total Puzzles in database: ${finalPuzzleCount}`);
  
  // Rebuild catalog if puzzles were imported or updated
  if (imported > 0 || updated > 0) {
    console.log("\n🔄 Rebuilding puzzle catalog...");
    try {
      const { buildPuzzleCatalog } = await import("./build-puzzle-catalog.js");
      await buildPuzzleCatalog();
    } catch (error) {
      console.error("⚠️  Failed to rebuild catalog:", error.message);
      console.log("   You can rebuild it manually by running: node backend/scripts/build-puzzle-catalog.js");
    }
  }
  console.log("=".repeat(50));
  
  sourceDb.close();
  await prisma.$disconnect();
  
} catch (error) {
  console.error("\n❌ Import failed:", error);
  process.exit(1);
}

