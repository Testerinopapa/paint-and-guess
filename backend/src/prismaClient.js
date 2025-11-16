import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const defaultDatabaseUrl = `file:${path.join(dataDir, "rooms.db")}`;
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
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
