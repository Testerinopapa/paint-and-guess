-- AlterTable
ALTER TABLE "User" ADD COLUMN "chessRating" INTEGER DEFAULT 1500;
ALTER TABLE "User" ADD COLUMN "triviaRating" INTEGER DEFAULT 1500;

-- CreateTable
CREATE TABLE "ChessGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whiteUserId" TEXT,
    "blackUserId" TEXT,
    "result" TEXT NOT NULL,
    "pgn" TEXT,
    "whiteRatingBefore" INTEGER,
    "blackRatingBefore" INTEGER,
    "whiteRatingAfter" INTEGER,
    "blackRatingAfter" INTEGER,
    "whiteRatingChange" INTEGER,
    "blackRatingChange" INTEGER,
    "gameMode" TEXT NOT NULL,
    "aiElo" INTEGER,
    CONSTRAINT "ChessGame_whiteUserId_fkey" FOREIGN KEY ("whiteUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChessGame_blackUserId_fkey" FOREIGN KEY ("blackUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TriviaGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    "quizId" TEXT,
    "quizName" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "players" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ChessGame_whiteUserId_createdAt_idx" ON "ChessGame"("whiteUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ChessGame_blackUserId_createdAt_idx" ON "ChessGame"("blackUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ChessGame_createdAt_idx" ON "ChessGame"("createdAt");

-- CreateIndex
CREATE INDEX "TriviaGame_createdAt_idx" ON "TriviaGame"("createdAt");
