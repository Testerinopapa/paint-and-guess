-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PuzzleAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT,
    "timeMs" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "rating" INTEGER,
    CONSTRAINT "PuzzleAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PuzzleAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PuzzleAttempt" ("createdAt", "id", "mistakes", "puzzleId", "rating", "solved", "timeMs") SELECT "createdAt", "id", "mistakes", "puzzleId", "rating", "solved", "timeMs" FROM "PuzzleAttempt";
DROP TABLE "PuzzleAttempt";
ALTER TABLE "new_PuzzleAttempt" RENAME TO "PuzzleAttempt";
CREATE INDEX "PuzzleAttempt_puzzleId_createdAt_idx" ON "PuzzleAttempt"("puzzleId", "createdAt");
CREATE INDEX "PuzzleAttempt_userId_solved_idx" ON "PuzzleAttempt"("userId", "solved");
CREATE UNIQUE INDEX "PuzzleAttempt_userId_puzzleId_solved_key" ON "PuzzleAttempt"("userId", "puzzleId", "solved");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
