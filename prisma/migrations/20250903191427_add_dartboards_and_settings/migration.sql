-- CreateTable
CREATE TABLE "dartboards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT '501',
    "legSettings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "gameMode" TEXT NOT NULL DEFAULT '501',
    "legSettings" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
