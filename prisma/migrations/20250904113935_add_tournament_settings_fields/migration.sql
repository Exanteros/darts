-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tournament_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "maxPlayers" INTEGER NOT NULL DEFAULT 64,
    "entryFee" REAL NOT NULL DEFAULT 0,
    "gameMode" TEXT NOT NULL DEFAULT '501',
    "legSettings" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tournament_settings" ("createdAt", "gameMode", "id", "legSettings", "updatedAt") SELECT "createdAt", "gameMode", "id", "legSettings", "updatedAt" FROM "tournament_settings";
DROP TABLE "tournament_settings";
ALTER TABLE "new_tournament_settings" RENAME TO "tournament_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
