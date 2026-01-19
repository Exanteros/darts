-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "maxPlayers" INTEGER NOT NULL DEFAULT 64,
    "entryFee" REAL NOT NULL DEFAULT 0,
    "location" TEXT,
    "street" TEXT,
    "shootoutBoardId" TEXT,
    "checkoutMode" TEXT NOT NULL DEFAULT 'DOUBLE_OUT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tournament_access" (
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

-- CreateTable
CREATE TABLE "tournament_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "seed" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" DATETIME,
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "stripePaymentIntentId" TEXT,
    "average" REAL,
    "firstNineAvg" REAL,
    "highFinish" INTEGER,
    "oneEighties" INTEGER DEFAULT 0,
    "checkoutRate" REAL,
    "doubleRate" REAL,
    "bestLeg" INTEGER,
    "totalPoints" INTEGER DEFAULT 0,
    "legsPlayed" INTEGER DEFAULT 0,
    "legsWon" INTEGER DEFAULT 0,
    "matchesPlayed" INTEGER DEFAULT 0,
    "matchesWon" INTEGER DEFAULT 0,
    "currentRank" INTEGER,
    "prizeMoney" REAL DEFAULT 0,
    CONSTRAINT "tournament_players_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "legSettings" JSONB,
    CONSTRAINT "boards_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE TABLE "system_settings" (
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

-- CreateTable
CREATE TABLE "games" (
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
    "currentThrow" JSONB,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "games_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "games_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "tournament_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "throws" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "leg" INTEGER NOT NULL,
    "dart1" INTEGER NOT NULL DEFAULT 0,
    "dart2" INTEGER NOT NULL DEFAULT 0,
    "dart3" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "throws_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "throws_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "tournament_players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "tournament_settings" (
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
    "mainLogo" TEXT,
    "sponsorLogos" TEXT,
    "backgroundImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_access_tournamentId_userId_key" ON "tournament_access"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "shootout_results_tournamentId_playerId_key" ON "shootout_results"("tournamentId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_stripePaymentIntentId_key" ON "tournament_players"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_tournamentId_userId_key" ON "tournament_players"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "boards_accessCode_key" ON "boards"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "shootout_state_tournamentId_key" ON "shootout_state"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "shootout_state_currentPlayerId_key" ON "shootout_state"("currentPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_token_key" ON "magic_link_tokens"("token");
