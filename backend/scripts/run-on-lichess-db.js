import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set DATABASE_URL to point to LichessDB
const dbPath = path.resolve(__dirname, "../../ChessModeDocs/LichessDB&Schema/dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;

console.log("🔧 Running scripts on LichessDB database");
console.log(`📁 Database path: ${dbPath}`);
console.log("=".repeat(60));
console.log("");

// Run scripts in sequence
const scripts = [
  "inspect-dev-db.js",
  "test-puzzle-db.js",
  "validate-all-puzzles.js",
];

for (const script of scripts) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶️  Running: ${script}`);
  console.log("=".repeat(60));
  
  try {
    execSync(`node ${script}`, {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch (error) {
    console.error(`❌ Error running ${script}:`, error.message);
    // Continue with next script
  }
}

console.log("\n" + "=".repeat(60));
console.log("✅ All scripts completed");
console.log("=".repeat(60));

