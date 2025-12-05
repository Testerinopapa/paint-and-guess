-- Add Report model for chess game analysis
-- Run with: npx prisma migrate dev --name add_report_model

CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pgn" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "elo" INTEGER,
    "fens" TEXT NOT NULL,
    "sans" TEXT NOT NULL,
    "evals" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "accuracy" REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS "Report_createdAt_idx" ON "Report"("createdAt");

