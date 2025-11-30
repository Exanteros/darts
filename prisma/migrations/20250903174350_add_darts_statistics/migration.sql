-- AlterTable
ALTER TABLE "tournament_players" ADD COLUMN "average" REAL;
ALTER TABLE "tournament_players" ADD COLUMN "bestLeg" INTEGER;
ALTER TABLE "tournament_players" ADD COLUMN "checkoutRate" REAL;
ALTER TABLE "tournament_players" ADD COLUMN "currentRank" INTEGER;
ALTER TABLE "tournament_players" ADD COLUMN "doubleRate" REAL;
ALTER TABLE "tournament_players" ADD COLUMN "firstNineAvg" REAL;
ALTER TABLE "tournament_players" ADD COLUMN "highFinish" INTEGER;
ALTER TABLE "tournament_players" ADD COLUMN "legsPlayed" INTEGER DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "legsWon" INTEGER DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "matchesPlayed" INTEGER DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "matchesWon" INTEGER DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "oneEighties" INTEGER DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "prizeMoney" REAL DEFAULT 0;
ALTER TABLE "tournament_players" ADD COLUMN "totalPoints" INTEGER DEFAULT 0;
