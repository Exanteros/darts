#!/bin/bash

# 💾 Darts Turnier Backup Script
# Erstellt vollständige Backups von Datenbank und Konfiguration

set -e

# Konfiguration
BACKUP_DIR="/home/ubuntu/backups"
PROJECT_DIR="/home/ubuntu/dartsturnier"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="dartsturnier_$TIMESTAMP"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Backup Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"

log "💾 Starte Backup: $BACKUP_NAME"

# PostgreSQL Backup
log "📊 PostgreSQL Backup erstellen..."

if command -v docker-compose &> /dev/null && [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    # Docker Setup
    cd "$PROJECT_DIR"

    # Environment laden
    if [ -f ".env.docker.local" ]; then
        export $(grep -v '^#' .env.docker.local | xargs)
    fi

    # PostgreSQL Dump
    docker-compose exec -T postgres pg_dump -U dartsturnier -d dartsturnier > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"

    # Redis Dump (optional)
    docker-compose exec -T redis redis-cli --rdb "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" 2>/dev/null || true

else
    # Native Setup
    # PostgreSQL Credentials aus .env.local lesen
    if [ -f "$PROJECT_DIR/.env.local" ]; then
        DB_URL=$(grep "DATABASE_URL" "$PROJECT_DIR/.env.local" | cut -d'=' -f2 | tr -d '"')
        DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

        PGPASSWORD="$DB_PASS" pg_dump -h localhost -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
    else
        error "Keine .env.local gefunden. PostgreSQL Backup übersprungen."
    fi
fi

# Konfigurationsdateien sichern
log "⚙️ Konfigurationsdateien sichern..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    -C "$PROJECT_DIR" \
    .env.local \
    .env.docker.local \
    docker-compose.yml \
    .env.docker \
    2>/dev/null || true

# Projekt-Code sichern (ohne node_modules)
log "📁 Projekt-Code sichern..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_code.tar.gz" \
    -C "$PROJECT_DIR" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    . 2>/dev/null || true

# Nginx Konfiguration
log "🌐 Nginx Konfiguration sichern..."
sudo tar -czf "$BACKUP_DIR/${BACKUP_NAME}_nginx.tar.gz" \
    -C /etc/nginx \
    sites-available/dartsturnier \
    sites-enabled/dartsturnier 2>/dev/null || true

# SSL Zertifikate (nur wenn Let's Encrypt verwendet wird)
if [ -d "/etc/letsencrypt" ]; then
    log "🔒 SSL Zertifikate sichern..."
    sudo tar -czf "$BACKUP_DIR/${BACKUP_NAME}_ssl.tar.gz" \
        -C /etc \
        letsencrypt 2>/dev/null || true
fi

# Backup komprimieren
log "🗜️ Backup komprimieren..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" \
    ${BACKUP_NAME}_*.sql \
    ${BACKUP_NAME}_*.tar.gz \
    ${BACKUP_NAME}_*.rdb 2>/dev/null || true

# Einzelne Dateien löschen (behalte nur das Gesamt-Archive)
rm -f ${BACKUP_NAME}_*.sql ${BACKUP_NAME}_*.tar.gz ${BACKUP_NAME}_*.rdb

# Alte Backups löschen (behalte 7 Tage)
log "🧹 Alte Backups löschen..."
find "$BACKUP_DIR" -name "dartsturnier_*.tar.gz" -mtime +7 -delete

# Backup Größe anzeigen
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
log "✅ Backup erstellt: $BACKUP_DIR/${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Backup Info speichern
cat > "$BACKUP_DIR/${BACKUP_NAME}_info.txt" << EOF
Darts Turnier Backup Information
=================================
Erstellt am: $(date)
Backup Name: $BACKUP_NAME
Größe: $BACKUP_SIZE
Enthält:
- PostgreSQL Datenbank Dump
- Redis Datenbank Dump (falls verfügbar)
- Projekt Konfigurationsdateien
- Projekt Code (ohne node_modules)
- Nginx Konfiguration
- SSL Zertifikate (falls Let's Encrypt verwendet)

Wiederherstellung:
1. Entpacken: tar -xzf ${BACKUP_NAME}.tar.gz
2. Datenbank: psql -U dartsturnier -d dartsturnier < ${BACKUP_NAME}_database.sql
3. Konfiguration: cp config/* nach $PROJECT_DIR/
4. Services neu starten
EOF

info ""
info "📋 Backup Zusammenfassung:"
info "   Name: $BACKUP_NAME"
info "   Pfad: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
info "   Größe: $BACKUP_SIZE"
info "   Enthält: Datenbank, Code, Konfiguration, SSL"
info ""
info "💡 Tipp: Richte einen Cronjob ein für automatische Backups:"
info "   crontab -e"
info "   Füge hinzu: 0 2 * * * $PROJECT_DIR/backup.sh"
info ""
log "🎉 Backup erfolgreich abgeschlossen!"</content>
<parameter name="filePath">/home/cedric/dartsturnier/backup.sh