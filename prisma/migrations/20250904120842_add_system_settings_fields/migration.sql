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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_system_settings" ("allowRegistration", "autoSaveInterval", "createdAt", "id", "logLevel", "maintenanceMode", "maxConcurrentGames", "updatedAt") SELECT "allowRegistration", "autoSaveInterval", "createdAt", "id", "logLevel", "maintenanceMode", "maxConcurrentGames", "updatedAt" FROM "system_settings";
DROP TABLE "system_settings";
ALTER TABLE "new_system_settings" RENAME TO "system_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
