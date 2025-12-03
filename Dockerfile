# Multi-stage build für optimiertes Production Image
# Build Stage
FROM node:20-alpine AS builder

# Installiere Dependencies für Node.js und Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Kopiere package files
COPY package*.json ./
COPY prisma ./prisma/

# Installiere Dependencies
RUN npm ci --legacy-peer-deps

# Kopiere Source Code
COPY . .

# Generiere Prisma Client und baue Next.js App
RUN npx prisma generate

# Setze temporäre Environment Variables für den Build
# WICHTIG: Diese müssen VOR dem Build-Befehl gesetzt werden
ARG NEXTAUTH_SECRET=build-time-placeholder-will-be-overridden-at-runtime
ARG NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

# Installiere Runtime Dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Erstelle non-root User
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Setze korrekten Permissions für .next cache
RUN mkdir -p .next && chown nextjs:nodejs .next

# Kopiere notwendige Files vom Builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Kopiere built Next.js app mit korrekten Permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Installiere nur Production Dependencies (inkl. Prisma Client)
RUN npm ci --only=production --legacy-peer-deps && \
    npx prisma generate && \
    npm cache clean --force

# Wechsle zu non-root User
USER nextjs

# Exponiere Port
EXPOSE 3000

# Setze Environment Variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Starte die App
CMD ["node", "server.js"]
