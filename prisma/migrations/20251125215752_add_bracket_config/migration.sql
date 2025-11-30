-- CreateTable
CREATE TABLE "bracket_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "bracketFormat" TEXT NOT NULL DEFAULT 'single',
    "seedingAlgorithm" TEXT NOT NULL DEFAULT 'standard',
    "autoAssignBoards" BOOLEAN NOT NULL DEFAULT true,
    "mainBoardPriority" BOOLEAN NOT NULL DEFAULT true,
    "distributeEvenly" BOOLEAN NOT NULL DEFAULT true,
    "mainBoardPriorityLevel" TEXT NOT NULL DEFAULT 'finals',
    "legsPerRound" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
