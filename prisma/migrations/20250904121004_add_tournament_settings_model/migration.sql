-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultMaxPlayers" INTEGER NOT NULL DEFAULT 64,
    "defaultEntryFee" REAL NOT NULL DEFAULT 0,
    "allowLateRegistration" BOOLEAN NOT NULL DEFAULT true,
    "autoStartGames" BOOLEAN NOT NULL DEFAULT false,
    "showLiveScores" BOOLEAN NOT NULL DEFAULT true,
    "enableStatistics" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
