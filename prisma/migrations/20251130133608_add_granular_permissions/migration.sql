-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tournament_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" DATETIME,
    "permissions" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "tournament_access_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tournament_access" ("expiresAt", "grantedAt", "grantedBy", "id", "role", "tournamentId", "userId") SELECT "expiresAt", "grantedAt", "grantedBy", "id", "role", "tournamentId", "userId" FROM "tournament_access";
DROP TABLE "tournament_access";
ALTER TABLE "new_tournament_access" RENAME TO "tournament_access";
CREATE UNIQUE INDEX "tournament_access_tournamentId_userId_key" ON "tournament_access"("tournamentId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
