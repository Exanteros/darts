-- AlterTable
ALTER TABLE "tournament_players" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "tournament_players" ADD COLUMN "paymentStatus" TEXT;
ALTER TABLE "tournament_players" ADD COLUMN "registrationDate" DATETIME;
ALTER TABLE "tournament_players" ADD COLUMN "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tournament_players_stripePaymentIntentId_key" ON "tournament_players"("stripePaymentIntentId");
