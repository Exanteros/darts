-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "shootoutBoardId" TEXT;

-- CreateTable
CREATE TABLE "shootout_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "boardId" TEXT,
    "score" INTEGER NOT NULL,
    "dart1" INTEGER NOT NULL DEFAULT 0,
    "dart2" INTEGER NOT NULL DEFAULT 0,
    "dart3" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shootout_results_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shootout_results_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "tournament_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shootout_results_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentGames" INTEGER NOT NULL DEFAULT 8,
    "autoSaveInterval" INTEGER NOT NULL DEFAULT 30,
    "logLevel" TEXT NOT NULL DEFAULT 'info',
    "websocketTimeout" INTEGER NOT NULL DEFAULT 30000,
    "cacheTimeout" INTEGER NOT NULL DEFAULT 3600,
    "maxConnections" INTEGER NOT NULL DEFAULT 100,
    "monitoringInterval" INTEGER NOT NULL DEFAULT 60,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "stripeWebhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_system_settings" ("allowRegistration", "autoSaveInterval", "cacheTimeout", "createdAt", "id", "logLevel", "maintenanceMode", "maxConcurrentGames", "maxConnections", "monitoringInterval", "updatedAt", "websocketTimeout") SELECT "allowRegistration", "autoSaveInterval", "cacheTimeout", "createdAt", "id", "logLevel", "maintenanceMode", "maxConcurrentGames", "maxConnections", "monitoringInterval", "updatedAt", "websocketTimeout" FROM "system_settings";
DROP TABLE "system_settings";
ALTER TABLE "new_system_settings" RENAME TO "system_settings";
CREATE TABLE "new_tournament_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultMaxPlayers" INTEGER NOT NULL DEFAULT 64,
    "defaultEntryFee" REAL NOT NULL DEFAULT 0,
    "allowLateRegistration" BOOLEAN NOT NULL DEFAULT true,
    "autoStartGames" BOOLEAN NOT NULL DEFAULT false,
    "showLiveScores" BOOLEAN NOT NULL DEFAULT true,
    "enableStatistics" BOOLEAN NOT NULL DEFAULT true,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "stripeWebhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tournament_settings" ("allowLateRegistration", "autoStartGames", "createdAt", "defaultEntryFee", "defaultMaxPlayers", "enableStatistics", "id", "showLiveScores", "updatedAt") SELECT "allowLateRegistration", "autoStartGames", "createdAt", "defaultEntryFee", "defaultMaxPlayers", "enableStatistics", "id", "showLiveScores", "updatedAt" FROM "tournament_settings";
DROP TABLE "tournament_settings";
ALTER TABLE "new_tournament_settings" RENAME TO "tournament_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "shootout_results_tournamentId_playerId_key" ON "shootout_results"("tournamentId", "playerId");
