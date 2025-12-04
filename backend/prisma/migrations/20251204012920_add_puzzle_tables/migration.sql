-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fen" TEXT NOT NULL,
    "sideToMove" TEXT NOT NULL,
    "solutionPv" TEXT NOT NULL,
    "motifs" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rating" INTEGER
);

-- CreateTable
CREATE TABLE "PuzzleAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puzzleId" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "rating" INTEGER,
    CONSTRAINT "PuzzleAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Puzzle_createdAt_idx" ON "Puzzle"("createdAt");

-- CreateIndex
CREATE INDEX "PuzzleAttempt_puzzleId_createdAt_idx" ON "PuzzleAttempt"("puzzleId", "createdAt");

