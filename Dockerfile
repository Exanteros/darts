# syntax=docker/dockerfile:1.4
# Multi-stage build für optimiertes Production Image

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
# copy Prisma schema early so `npm ci`/postinstall can run prisma generate without failing
COPY prisma/schema.prisma ./prisma/schema.prisma

# npm-Cache zwischen Builds wiederverwenden → deutlich schneller bei Rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Nur node_modules aus dem deps-Stage übernehmen
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client generieren (einmalig)
RUN npx prisma generate

# Build-Zeit-Platzhalter – werden zur Laufzeit durch echte Werte ersetzt
ARG NEXTAUTH_SECRET=build-time-placeholder-will-be-overridden-at-runtime
ARG NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npm run build

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p .next && chown nextjs:nodejs .next

# Standalone-Output enthält bereits alle nötigen node_modules
# → kein npm ci im Runner nötig!
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma-Schema + Migrations für prisma migrate deploy zur Laufzeit
COPY --from=builder /app/prisma ./prisma
# prisma.config.ts wird von Prisma v7 benötigt – enthält datasource.url
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Vollständige node_modules aus dem deps-Stage kopieren.
# Prisma v7 legt WASM-Dateien direkt in node_modules/.bin/ ab – einzelne Dateien
# zu kopieren ist fehleranfällig. Das standalone-Bundle hat eigene gebündelte
# Module; dieses node_modules-Verzeichnis wird nur für `prisma migrate deploy`
# und den WebSocket-Server (ws) verwendet.
COPY --from=deps /app/node_modules ./node_modules

# WebSocket-Server und Start-Script
COPY --from=builder /app/websocket-game-server.js ./
COPY --from=builder /app/scripts/deploy/start.sh ./
RUN chmod +x start.sh
# helper scripts (user creation, migrations, etc.)
# copied into the runner image so they can be executed with
# `docker-compose exec app npx tsx scripts/create-admin-user.ts` or similar.
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
USER nextjs

EXPOSE 3000
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["./start.sh"]
