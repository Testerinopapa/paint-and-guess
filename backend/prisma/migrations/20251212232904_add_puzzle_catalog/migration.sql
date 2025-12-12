-- CreateTable
CREATE TABLE "PuzzleCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ratingMin" INTEGER NOT NULL,
    "ratingMax" INTEGER NOT NULL,
    "motif" TEXT,
    "puzzleIds" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Report" (
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

-- CreateIndex
CREATE INDEX "PuzzleCatalog_ratingMin_ratingMax_motif_idx" ON "PuzzleCatalog"("ratingMin", "ratingMax", "motif");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleCatalog_ratingMin_ratingMax_motif_key" ON "PuzzleCatalog"("ratingMin", "ratingMax", "motif");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Puzzle_rating_idx" ON "Puzzle"("rating");
