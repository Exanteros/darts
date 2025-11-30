/*
  Warnings:

  - You are about to drop the `tournament_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tournament_settings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentGames" INTEGER NOT NULL DEFAULT 8,
    "autoSaveInterval" INTEGER NOT NULL DEFAULT 30,
    "logLevel" TEXT NOT NULL DEFAULT 'info',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "broadcasting_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "obsUrl" TEXT,
    "obsPassword" TEXT,
    "displayRefresh" INTEGER NOT NULL DEFAULT 1000,
    "transitionDuration" INTEGER NOT NULL DEFAULT 500,
    "overlayWidth" INTEGER NOT NULL DEFAULT 1920,
    "overlayHeight" INTEGER NOT NULL DEFAULT 1080,
    "fontSize" INTEGER NOT NULL DEFAULT 48,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tournament_tree_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "seedingAlgorithm" TEXT NOT NULL DEFAULT 'standard',
    "minBreakTime" INTEGER NOT NULL DEFAULT 10,
    "mainBoardPriority" TEXT NOT NULL DEFAULT 'finals',
    "autoAssignment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
