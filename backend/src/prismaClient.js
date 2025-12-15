import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredDataDir =
  process.env.ROOMS_DATA_DIR ||
  process.env.RENDER_DISK_PATH ||
  process.env.RENDER_PERSISTENT_DISK_PATH ||
  path.join(__dirname, "..", "prisma", "data");

const dataDir = path.isAbsolute(configuredDataDir)
  ? configuredDataDir
  : path.resolve(path.join(__dirname, ".."), configuredDataDir);

fs.mkdirSync(dataDir, { recursive: true });

// Use DATABASE_URL from environment if set, otherwise construct default
const defaultDatabaseUrl = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL
  : `file:${path.join(dataDir, "rooms.db")}`;

// Extract the actual file path from DATABASE_URL (before adding query params)
let dbPath = defaultDatabaseUrl.startsWith("file:") 
  ? defaultDatabaseUrl.replace(/^file:/, "") 
  : defaultDatabaseUrl;

// Remove query parameters if any
if (dbPath.includes("?")) {
  dbPath = dbPath.split("?")[0];
}

// Resolve to absolute path if relative
// If DATABASE_URL was set, resolve relative to project root (backend directory)
// Otherwise resolve relative to dataDir
if (!path.isAbsolute(dbPath)) {
  if (process.env.DATABASE_URL) {
    // DATABASE_URL was set - resolve relative to backend directory
    dbPath = path.resolve(path.join(__dirname, ".."), dbPath);
  } else {
    // Default path - resolve relative to dataDir
    dbPath = path.resolve(dataDir, dbPath);
  }
}

// Now construct the databaseUrl with query params for Prisma
let databaseUrl = defaultDatabaseUrl;
if (databaseUrl.startsWith("file:") && !databaseUrl.includes("?")) {
  databaseUrl = `${databaseUrl}?busy_timeout=30000`;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

// Check if old JSON file exists and warn
const oldJsonPath = path.join(dataDir, "rooms.json");
if (fs.existsSync(oldJsonPath)) {
  console.warn(`[Prisma] ⚠️  Old JSON store file found at ${oldJsonPath}. It will be ignored.`);
}

// Ensure database file exists or is valid
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  if (stats.size === 0) {
    console.warn(`[Prisma] ⚠️  Database file exists but is empty. It will be recreated.`);
    fs.unlinkSync(dbPath);
  } else {
    // Try to verify it's a valid SQLite file (starts with SQLite magic bytes)
    const buffer = fs.readFileSync(dbPath, { start: 0, end: 15 });
    const magic = buffer.toString("ascii", 0, 16);
    
    // Check if it's actually a JSON file (old RoomStore format)
    const firstChar = buffer.toString("utf-8", 0, 1);
    if (firstChar === "[" || firstChar === "{") {
      console.warn(`[Prisma] ⚠️  File at ${dbPath} appears to be JSON (old format). Backing up and recreating.`);
      const backupPath = `${dbPath}.old-json.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      fs.unlinkSync(dbPath);
      console.log(`[Prisma] 📦 Backed up old JSON file to ${backupPath}`);
    } else if (!magic.startsWith("SQLite format")) {
      console.warn(`[Prisma] ⚠️  File at ${dbPath} doesn't appear to be a valid SQLite database. Backing up and recreating.`);
      const backupPath = `${dbPath}.corrupted.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      fs.unlinkSync(dbPath);
      console.log(`[Prisma] 📦 Backed up corrupted file to ${backupPath}`);
    }
  }
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  // Increase timeout for long-running operations (like catalog building)
  // SQLite doesn't have a built-in timeout, but Prisma has a default
  log: process.env.PRISMA_LOG === "true" ? ["query", "error", "warn"] : ["error"],
});

// Export database file path for use in other modules
export { dbPath };

console.log(`[Prisma] Using database URL: ${databaseUrl}`);

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log(`[Prisma] ✅ Connected to database`);
  })
  .catch((error) => {
    console.error(`[Prisma] ❌ Failed to connect to database:`, error);
    throw error;
  });

async function shutdown() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to disconnect Prisma client", error);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", shutdown);


