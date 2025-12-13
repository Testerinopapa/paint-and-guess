import { prisma } from "../src/prismaClient.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { parseFen } from "chessops/fen";
import { setupPosition } from "chessops/variant";
import { parseUci } from "chessops/util";

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
  let skipped = 0;
  let errors = 0;
  let normalized = 0;
  
  // Normalize puzzle: ensure sideToMove matches FEN turn
  function normalizePuzzle(puzzle) {
    try {
      const setupRes = parseFen(puzzle.fen);
      if (!setupRes.isOk) return puzzle; // Invalid FEN, skip normalization
      
      const positionResult = setupPosition("chess", setupRes.unwrap());
      if (!positionResult.isOk) return puzzle; // Can't create position, skip
      
      const position = positionResult.unwrap();
      const fenTurn = position.turn;
      
      // Parse PV
      let solutionPv;
      try {
        solutionPv = typeof puzzle.solutionPv === "string"
          ? JSON.parse(puzzle.solutionPv)
          : puzzle.solutionPv;
      } catch {
        return puzzle; // Invalid PV, skip normalization
      }
      
      if (!Array.isArray(solutionPv) || solutionPv.length === 0) {
        return puzzle; // Empty PV, skip normalization
      }
      
      const puzzleSideToMove = puzzle.sideToMove || fenTurn;
      
      // If sideToMove matches FEN turn, already normalized
      if (puzzleSideToMove === fenTurn) {
        return puzzle;
      }
      
      // Mismatch detected - normalize by setting sideToMove to match FEN turn
      // This is the consensus approach: always align sideToMove with FEN turn
      // After normalization: sideToMove === fenTurn, and pv[0] should be player's move
      // If pv[0] is legal for fenTurn, it's already the player's move - perfect
      // If pv[0] is illegal for fenTurn, it was the player's move for puzzleSideToMove
      //   In this case, we can't automatically fix it, so we normalize sideToMove anyway
      //   and the frontend will detect that pv[0] is illegal and handle it
      return {
        ...puzzle,
        sideToMove: fenTurn,
      };
    } catch {
      return puzzle; // Error during normalization, return original
    }
  }
  
  for (const puzzle of puzzles) {
    try {
      // Check if puzzle already exists (by id or by source)
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
      
      // Normalize puzzle before importing
      const normalizedPuzzle = normalizePuzzle(puzzle);
      if (normalizedPuzzle.sideToMove !== puzzle.sideToMove) {
        normalized++;
      }
      
      await prisma.puzzle.create({
        data: {
          id: normalizedPuzzle.id,
          createdAt: new Date(normalizedPuzzle.createdAt),
          fen: normalizedPuzzle.fen,
          sideToMove: normalizedPuzzle.sideToMove,
          solutionPv: normalizedPuzzle.solutionPv,
          motifs: normalizedPuzzle.motifs,
          source: normalizedPuzzle.source,
          rating: normalizedPuzzle.rating,
        },
      });
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
      }
    } catch (error) {
      errors++;
      if (errors <= 10) {
        console.error(`   ⚠️  Error importing puzzle ${puzzle.id}:`, error.message);
      }
    }
  }
  
  console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}, Normalized: ${normalized}\n`);
  
  // Summary
  const finalPuzzleCount = await prisma.puzzle.count();
  
  console.log("=".repeat(50));
  console.log("✅ Import complete!");
  console.log(`   Total Puzzles in database: ${finalPuzzleCount}`);
  
  // Rebuild catalog if puzzles were imported
  if (imported > 0) {
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

