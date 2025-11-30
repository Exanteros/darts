#!/bin/bash

# 🔄 Darts Turnier Update Script
# Sicheres Update der Anwendung mit Backup

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Prüfen ob Docker läuft
if ! docker-compose ps | grep -q "Up"; then
    error "Docker Services sind nicht aktiv. Starte zuerst: docker-compose up -d"
fi

log "🔄 Starte Update-Prozess..."

# Backup erstellen
log "💾 Erstelle Backup vor Update..."
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Datenbank Backup
docker-compose exec -T postgres pg_dump -U dartsturnier -d dartsturnier > "$BACKUP_DIR/pre-update-db-$TIMESTAMP.sql"

# Code Backup
tar -czf "$BACKUP_DIR/pre-update-code-$TIMESTAMP.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    . 2>/dev/null || true

log "✅ Backup erstellt: $BACKUP_DIR/pre-update-$TIMESTAMP.*"

# Repository aktualisieren
log "📥 Lade neueste Version..."
git fetch origin
git reset --hard origin/main

# Dependencies aktualisieren
log "📦 Installiere neue Dependencies..."
npm install

# Datenbank-Migration prüfen
log "🗄️ Prüfe Datenbank-Migrationen..."
docker-compose exec app npx prisma migrate deploy

# Anwendung neu bauen
log "🔨 Baue neue Version..."
docker-compose build app

# Services neustarten
log "🚀 Starte Services neu..."
docker-compose up -d

# Warten auf Start
log "⏳ Warte auf Anwendung..."
sleep 10

# Health Check
log "🔍 Führe Health Check durch..."
if curl -s --max-time 30 http://localhost:3000/api/health > /dev/null; then
    log "✅ Update erfolgreich! Anwendung ist online."

    # Alte Backups aufräumen (behalte 3 pro Typ)
    log "🧹 Räume alte Backups auf..."
    ls -t "$BACKUP_DIR"/pre-update-db-*.sql 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
    ls -t "$BACKUP_DIR"/pre-update-code-*.tar.gz 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎉 UPDATE ERFOLGREICH ABGESCHLOSSEN!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📊 Was wurde aktualisiert:"
    echo "   • Anwendungscode"
    echo "   • Dependencies"
    echo "   • Datenbank-Schema (falls nötig)"
    echo ""
    echo "🔒 Backup gesichert in: $BACKUP_DIR"
    echo "🌐 Anwendung läuft unter: https://yourdomain.com"
    echo ""
    echo "📞 Bei Problemen: Backup wiederherstellen mit den gesicherten Dateien"

else
    error "❌ Update fehlgeschlagen! Anwendung ist nicht erreichbar."
    warn "Rollback: Verwende die Backup-Dateien in $BACKUP_DIR"
    warn "Manueller Rollback: docker-compose up -d (lädt vorherige Version)"
fi</content>
<parameter name="filePath">/home/cedric/dartsturnier/update.sh