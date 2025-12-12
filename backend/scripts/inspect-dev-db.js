import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATABASE_URL if set, otherwise use default path
const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace(/^file:/, "")
  : path.resolve(__dirname, "../../../ChessModeDocs/LichessDB&Schema/dev.db");

console.log("Inspecting database at:", dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("\n📊 Tables found:");
  tables.forEach(t => console.log(`  - ${t.name}`));
  
  // Check Puzzle table
  if (tables.some(t => t.name === "Puzzle")) {
    const puzzleCount = db.prepare("SELECT COUNT(*) as count FROM Puzzle").get();
    console.log(`\n🧩 Puzzle table: ${puzzleCount.count} puzzles`);
    
    // Get sample puzzle
    const sample = db.prepare("SELECT * FROM Puzzle LIMIT 1").get();
    if (sample) {
      console.log("\n📝 Sample puzzle:");
      console.log(`  ID: ${sample.id}`);
      console.log(`  Source: ${sample.source}`);
      console.log(`  Rating: ${sample.rating ?? "N/A"}`);
      console.log(`  Created: ${sample.createdAt}`);
    }
  }
  
  // Check PuzzleAttempt table
  if (tables.some(t => t.name === "PuzzleAttempt")) {
    const attemptCount = db.prepare("SELECT COUNT(*) as count FROM PuzzleAttempt").get();
    console.log(`\n📈 PuzzleAttempt table: ${attemptCount.count} attempts`);
  }
  
  // Check Analysis table
  if (tables.some(t => t.name === "Analysis")) {
    const analysisCount = db.prepare("SELECT COUNT(*) as count FROM Analysis").get();
    console.log(`\n🔍 Analysis table: ${analysisCount.count} analyses`);
  }
  
  // Check Report table
  if (tables.some(t => t.name === "Report")) {
    const reportCount = db.prepare("SELECT COUNT(*) as count FROM Report").get();
    console.log(`\n📄 Report table: ${reportCount.count} reports`);
  }
  
  db.close();
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

