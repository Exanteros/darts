import { defineConfig } from '@prisma/config';
import { loadEnvFile } from 'node:process';

// Prisma v7 skips .env loading when prisma.config.ts exists – load it manually.
try { loadEnvFile('.env'); } catch { /* no .env present (e.g. in Docker with real env vars) */ }

export default defineConfig({
  seed: 'tsx prisma/seed.ts',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});