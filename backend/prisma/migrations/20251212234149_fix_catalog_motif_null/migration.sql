-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PuzzleCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ratingMin" INTEGER NOT NULL,
    "ratingMax" INTEGER NOT NULL,
    "motif" TEXT NOT NULL DEFAULT 'all',
    "puzzleIds" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PuzzleCatalog" ("count", "id", "motif", "puzzleIds", "ratingMax", "ratingMin", "updatedAt") SELECT "count", "id", coalesce("motif", 'all') AS "motif", "puzzleIds", "ratingMax", "ratingMin", "updatedAt" FROM "PuzzleCatalog";
DROP TABLE "PuzzleCatalog";
ALTER TABLE "new_PuzzleCatalog" RENAME TO "PuzzleCatalog";
CREATE INDEX "PuzzleCatalog_ratingMin_ratingMax_motif_idx" ON "PuzzleCatalog"("ratingMin", "ratingMax", "motif");
CREATE UNIQUE INDEX "PuzzleCatalog_ratingMin_ratingMax_motif_key" ON "PuzzleCatalog"("ratingMin", "ratingMax", "motif");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
