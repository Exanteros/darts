/*
  Warnings:

  - Added the required column `accessCode` to the `boards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "shootout_state" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "currentPlayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting_for_selection',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shootout_state_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shootout_state_currentPlayerId_fkey" FOREIGN KEY ("currentPlayerId") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "legSettings" JSONB,
    CONSTRAINT "boards_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_boards" ("id", "isActive", "legSettings", "name", "priority", "tournamentId") SELECT "id", "isActive", "legSettings", "name", "priority", "tournamentId" FROM "boards";
DROP TABLE "boards";
ALTER TABLE "new_boards" RENAME TO "boards";
CREATE UNIQUE INDEX "boards_accessCode_key" ON "boards"("accessCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "shootout_state_tournamentId_key" ON "shootout_state"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "shootout_state_currentPlayerId_key" ON "shootout_state"("currentPlayerId");
