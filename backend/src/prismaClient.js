import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const defaultDatabaseUrl = `file:${path.join(dataDir, "rooms.db")}`;
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;

const isSQLite = databaseUrl.startsWith("file:");

if (isSQLite) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
  logger.info("DATABASE_URL not set; defaulting to local SQLite store");
} else {
  logger.info({ provider: isSQLite ? "sqlite" : "postgresql" }, "Using configured DATABASE_URL");
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const shutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to disconnect Prisma client", error);
  }
};

process.once("beforeExit", shutdown);
process.once("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});
