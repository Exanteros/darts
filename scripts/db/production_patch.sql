-- SQL Patch to add missing Stripe columns to tournament_settings table
-- Run this against your production database

DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_settings' AND column_name = 'stripeAccountId') THEN
        ALTER TABLE "tournament_settings" ADD COLUMN "stripeAccountId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_settings' AND column_name = 'stripeConnected') THEN
        ALTER TABLE "tournament_settings" ADD COLUMN "stripeConnected" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END
$$;
