#!/bin/bash

# ==============================================================================
# Dart Masters - Deployment & Update Script
# ==============================================================================
# This script pulls the latest changes from Git, installs dependencies,
# applies database migrations, builds the Docker image, and restarts the app.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}
warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}
error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

# 1. Check if git repository is clean (optional but recommended)
log "📥 Pulling latest changes from Git..."
git fetch
git pull

# 2. Build the Docker container (with the new code)
log "🔨 Building new Docker image (this might take a while)..."
docker compose build app

# 3. Start/Restart the containers with the newly built image
log "🚀 Restarting Docker containers..."
docker compose up -d

# 4. Wait for the database to be fully ready before running migrations
log "⏳ Waiting for PostgreSQL database to be ready..."
until docker compose exec -T postgres pg_isready -U dartsturnier; do
  echo "Database is unavailable - sleeping..."
  sleep 2
done

# 5. Run Prisma Database Migrations
log "💾 Running database migrations..."
# Assuming 'app' is your Next.js service name and it has prisma installed
docker compose exec -T app npx prisma migrate deploy

# 6. (Optional) Run Prisma Generate if needed in the container
# docker compose exec -T app npx prisma generate

# 7. Clean up old unused Docker images to save space
log "🧹 Cleaning up old Docker images..."
docker image prune -f

# 8. Check health
log "🔍 Performing Health Check..."
sleep 5
if curl -s --max-time 10 http://localhost:3000 > /dev/null; then
    log "✅ Update successful! The new version is now running."
else
    warn "⚠️ The application might not be fully responsive yet. Please check the logs: 'docker compose logs -f app'"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
