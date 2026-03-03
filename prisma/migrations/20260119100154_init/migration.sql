-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "maxPlayers" INTEGER NOT NULL DEFAULT 64,
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "street" TEXT,
    "shootoutBoardId" TEXT,
    "checkoutMode" TEXT NOT NULL DEFAULT 'DOUBLE_OUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_access" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "permissions" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "tournament_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shootout_results" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "boardId" TEXT,
    "score" INTEGER NOT NULL,
    "dart1" INTEGER NOT NULL DEFAULT 0,
    "dart2" INTEGER NOT NULL DEFAULT 0,
    "dart3" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shootout_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_players" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "seed" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" TIMESTAMP(3),
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "stripePaymentIntentId" TEXT,
    "average" DOUBLE PRECISION,
    "firstNineAvg" DOUBLE PRECISION,
    "highFinish" INTEGER,
    "oneEighties" INTEGER DEFAULT 0,
    "checkoutRate" DOUBLE PRECISION,
    "doubleRate" DOUBLE PRECISION,
    "bestLeg" INTEGER,
    "totalPoints" INTEGER DEFAULT 0,
    "legsPlayed" INTEGER DEFAULT 0,
    "legsWon" INTEGER DEFAULT 0,
    "matchesPlayed" INTEGER DEFAULT 0,
    "matchesWon" INTEGER DEFAULT 0,
    "currentRank" INTEGER,
    "prizeMoney" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "tournament_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "legSettings" JSONB,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dartboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT '501',
    "legSettings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dartboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
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
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "throws" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "leg" INTEGER NOT NULL,
    "dart1" INTEGER NOT NULL DEFAULT 0,
    "dart2" INTEGER NOT NULL DEFAULT 0,
    "dart3" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "throws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasting_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "obsUrl" TEXT,
    "obsPassword" TEXT,
    "displayRefresh" INTEGER NOT NULL DEFAULT 1000,
    "transitionDuration" INTEGER NOT NULL DEFAULT 500,
    "overlayWidth" INTEGER NOT NULL DEFAULT 1920,
    "overlayHeight" INTEGER NOT NULL DEFAULT 1080,
    "fontSize" INTEGER NOT NULL DEFAULT 48,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcasting_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_tree_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "seedingAlgorithm" TEXT NOT NULL DEFAULT 'standard',
    "minBreakTime" INTEGER NOT NULL DEFAULT 10,
    "mainBoardPriority" TEXT NOT NULL DEFAULT 'finals',
    "autoAssignment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_tree_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultMaxPlayers" INTEGER NOT NULL DEFAULT 64,
    "defaultEntryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shootout_state" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "currentPlayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting_for_selection',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shootout_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "bracketFormat" TEXT NOT NULL DEFAULT 'single',
    "seedingAlgorithm" TEXT NOT NULL DEFAULT 'standard',
    "autoAssignBoards" BOOLEAN NOT NULL DEFAULT true,
    "mainBoardPriority" BOOLEAN NOT NULL DEFAULT true,
    "distributeEvenly" BOOLEAN NOT NULL DEFAULT true,
    "mainBoardPriorityLevel" TEXT NOT NULL DEFAULT 'finals',
    "legsPerRound" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bracket_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tournament_access" ADD CONSTRAINT "tournament_access_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_access" ADD CONSTRAINT "tournament_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shootout_results" ADD CONSTRAINT "shootout_results_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shootout_results" ADD CONSTRAINT "shootout_results_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "tournament_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shootout_results" ADD CONSTRAINT "shootout_results_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "throws" ADD CONSTRAINT "throws_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "throws" ADD CONSTRAINT "throws_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "tournament_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shootout_state" ADD CONSTRAINT "shootout_state_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shootout_state" ADD CONSTRAINT "shootout_state_currentPlayerId_fkey" FOREIGN KEY ("currentPlayerId") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

