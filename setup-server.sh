#!/bin/bash

# 🚀 Darts Turnier Server Setup Script
# Automatisiert die Grundinstallation für Ubuntu/Debian Server

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging Funktion
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Root Check
if [[ $EUID -eq 0 ]]; then
   error "Dieses Script darf nicht als root ausgeführt werden!"
   exit 1
fi

log "🚀 Starte Darts Turnier Server Setup..."

# System Update
log "📦 System aktualisieren..."
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools
log "🛠️ Grundlegende Tools installieren..."
sudo apt install -y curl wget git htop ufw fail2ban software-properties-common

# Firewall
log "🔥 Firewall konfigurieren..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Node.js 20
log "📦 Node.js 20 installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

log "Node.js Version: $(node --version)"
log "NPM Version: $(npm --version)"

# PostgreSQL 16
log "🐘 PostgreSQL 16 installieren..."
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install -y postgresql-16 postgresql-contrib-16
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Redis 7
log "🔴 Redis 7 installieren..."
if ! command -v redis-cli &> /dev/null; then
    curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
    sudo apt update
    sudo apt install -y redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
fi

# Nginx
log "🌐 Nginx installieren..."
sudo apt install -y nginx
sudo systemctl enable nginx

# Certbot für SSL
log "🔒 Certbot für SSL installieren..."
sudo apt install -y certbot python3-certbot-nginx

# Docker (optional)
read -p "🐳 Docker installieren? (empfohlen für einfachere Verwaltung) [y/N]: " install_docker
if [[ $install_docker =~ ^[Yy]$ ]]; then
    log "🐳 Docker installieren..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER

    log "🐳 Docker Compose installieren..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    info "Bitte melde dich neu an oder führe 'newgrp docker' aus, um Docker ohne sudo zu verwenden."
fi

log "✅ Grundinstallation abgeschlossen!"
info ""
info "📋 Nächste Schritte:"
info "1. Konfiguriere deine Domain/DNS"
info "2. Klone das Repository: git clone https://github.com/Exanteros/kneipenquiz.git"
info "3. Konfiguriere .env.local oder .env.docker.local"
info "4. Führe die Datenbank-Initialisierung durch"
info "5. Starte die Anwendung"
info ""
info "📖 Vollständige Anleitung: SERVER_SETUP.md"
info ""
warn "⚠️  Wichtige Sicherheitshinweise:"
warn "   - Ändere alle Standardpasswörter!"
warn "   - Aktiviere SSH-Key Authentication"
warn "   - Konfiguriere SSL/TLS mit Let's Encrypt"
warn "   - Richte regelmäßige Backups ein"</content>
<parameter name="filePath">/home/cedric/dartsturnier/setup-server.sh