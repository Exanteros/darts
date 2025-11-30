-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "boardId" TEXT,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "legsToWin" INTEGER NOT NULL DEFAULT 2,
    "currentLeg" INTEGER NOT NULL DEFAULT 1,
    "player1Legs" INTEGER NOT NULL DEFAULT 0,
    "player2Legs" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "games_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "games_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_games" ("boardId", "currentLeg", "finishedAt", "id", "legsToWin", "player1Id", "player1Legs", "player2Id", "player2Legs", "round", "scheduledAt", "startedAt", "status", "tournamentId", "winnerId") SELECT "boardId", "currentLeg", "finishedAt", "id", "legsToWin", "player1Id", "player1Legs", "player2Id", "player2Legs", "round", "scheduledAt", "startedAt", "status", "tournamentId", "winnerId" FROM "games";
DROP TABLE "games";
ALTER TABLE "new_games" RENAME TO "games";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
