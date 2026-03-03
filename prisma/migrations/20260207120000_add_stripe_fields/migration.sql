-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "stripeConnected" BOOLEAN NOT NULL DEFAULT false;
