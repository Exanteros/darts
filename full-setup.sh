#!/bin/bash

# 🎯 Darts Turnier - Vollautomatisches Setup
# 100% Rundum-Betreuung - Nur Domain angeben und fertig!

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Konfiguration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/dartsturnier-setup.log"
BACKUP_DIR="/home/ubuntu/backups"

# Logging Funktion
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2 | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${PURPLE}[STEP] $1${NC}" | tee -a "$LOG_FILE"
}

# Root Check
if [[ $EUID -eq 0 ]]; then
   error "Dieses Script darf nicht als root ausgeführt werden!"
fi

# Domain Eingabe
if [ -z "$1" ]; then
    echo -e "${CYAN}🎯 Darts Turnier - Vollautomatisches Setup${NC}"
    echo "=============================================="
    echo ""
    echo "Dieses Script richtet das komplette Darts-Turnier-System ein."
    echo "Du musst nur deine Domain angeben - alles andere wird automatisch gemacht!"
    echo ""
    read -p "Gib deine Domain ein (z.B. darts-turnier.de): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        error "Domain ist erforderlich!"
    fi
else
    DOMAIN="$1"
fi

# Domain validieren
if ! echo "$DOMAIN" | grep -qE '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'; then
    error "Ungültige Domain: $DOMAIN"
fi

log "🚀 Starte vollautomatisches Setup für Domain: $DOMAIN"

# System aktualisieren
step "1/12 - System aktualisieren..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop ufw fail2ban software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Firewall konfigurieren
step "2/12 - Firewall einrichten..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Swap-Speicher (falls < 2GB RAM)
if [ "$(free -m | grep '^Mem:' | awk '{print $2}')" -lt 2048 ]; then
    step "3/12 - Swap-Speicher einrichten..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Node.js 20 installieren
step "4/12 - Node.js 20 installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# PostgreSQL 16 installieren
step "5/12 - PostgreSQL 16 installieren..."
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install -y postgresql-16 postgresql-contrib-16
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Redis 7 installieren
step "6/12 - Redis 7 installieren..."
if ! command -v redis-cli &> /dev/null; then
    curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
    sudo apt update
    sudo apt install -y redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
fi

# Nginx installieren
step "7/12 - Nginx installieren..."
sudo apt install -y nginx
sudo systemctl enable nginx

# Certbot für SSL
step "8/12 - SSL-Zertifikate vorbereiten..."
sudo apt install -y certbot python3-certbot-nginx

# Docker installieren (für einfachere Verwaltung)
step "9/12 - Docker installieren..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Projekt bereitstellen
step "10/12 - Projekt bereitstellen..."
cd /home/ubuntu

# Backup vorhandener Installation
if [ -d "dartsturnier" ]; then
    warn "Vorhandene Installation gefunden - erstelle Backup..."
    mkdir -p "$BACKUP_DIR"
    sudo tar -czf "$BACKUP_DIR/pre-setup-backup-$(date +%Y%m%d_%H%M%S).tar.gz" -C /home/ubuntu dartsturnier 2>/dev/null || true
    sudo rm -rf dartsturnier
fi

# Repository klonen
git clone https://github.com/Exanteros/kneipenquiz.git dartsturnier
cd dartsturnier

# Dependencies installieren
npm install

# Starke Passwörter generieren
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Environment-Datei erstellen
cat > .env.docker.local << EOF
# Database
DB_PASSWORD=$DB_PASSWORD

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# NextAuth
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# SMTP (wird später konfiguriert)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Darts Turnier <noreply@$DOMAIN>"

# Branding
BRAND_NAME="Darts Masters Puschendorf"
SMTP_LOGO_URL="https://$DOMAIN/logo.png"
EOF

# Datenbank und Redis starten
step "11/12 - Services starten..."
docker-compose --env-file .env.docker.local up -d postgres redis

# Warten auf Datenbank
info "Warte auf PostgreSQL..."
sleep 10
docker-compose exec -T postgres pg_isready -U dartsturnier

# Datenbank initialisieren
info "Datenbank initialisieren..."
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy

# Admin User erstellen
info "Admin User erstellen..."
docker-compose exec app npx ts-node scripts/create-admin-user.ts

# Anwendung starten
docker-compose --env-file .env.docker.local up -d

# Nginx konfigurieren
step "12/12 - Webserver konfigurieren..."
sudo tee /etc/nginx/sites-available/dartsturnier > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dartsturnier /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# SSL-Zertifikat beantragen
info "SSL-Zertifikat beantragen..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || warn "SSL-Zertifikat konnte nicht automatisch beantragt werden. Führe später 'sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN' manuell aus."

# Backup-Script einrichten
step "Bonus - Backup-System einrichten..."
mkdir -p "$BACKUP_DIR"
sudo tee /etc/cron.daily/dartsturnier-backup > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="dartsturnier_$TIMESTAMP"

cd /home/ubuntu/dartsturnier

# PostgreSQL Backup
docker-compose exec -T postgres pg_dump -U dartsturnier -d dartsturnier > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"

# Konfiguration sichern
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" .env.docker.local docker-compose.yml

# Gesamt-Backup komprimieren
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" ${BACKUP_NAME}_*.sql ${BACKUP_NAME}_*.tar.gz

# Aufräumen
rm -f ${BACKUP_NAME}_*.sql ${BACKUP_NAME}_*.tar.gz

# Alte Backups löschen (7 Tage)
find "$BACKUP_DIR" -name "dartsturnier_*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /etc/cron.daily/dartsturnier-backup

# Monitoring-Script einrichten
sudo tee /usr/local/bin/dartsturnier-health > /dev/null << 'EOF'
#!/bin/bash
cd /home/ubuntu/dartsturnier

SERVICES_OK=0
SERVICES_TOTAL=0

check_service() {
    local service=$1
    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))
    if sudo systemctl is-active --quiet "$service" 2>/dev/null; then
        echo "✅ $service: Running"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo "❌ $service: Stopped"
    fi
}

check_docker_service() {
    local service=$1
    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "✅ $service: Running"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo "❌ $service: Stopped"
    fi
}

echo "🔍 Darts Turnier Health Check"
echo "=============================="
check_service "nginx"
check_docker_service "postgres"
check_docker_service "redis"
check_docker_service "app"

if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Health Check: OK"
    SERVICES_OK=$((SERVICES_OK + 1))
else
    echo "❌ Health Check: Failed"
fi
SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

echo ""
echo "Services OK: $SERVICES_OK/$SERVICES_TOTAL"

if [ $SERVICES_OK -eq $SERVICES_TOTAL ]; then
    echo "🎉 All systems operational!"
    exit 0
else
    echo "⚠️  Some services are down"
    exit 1
fi
EOF

sudo chmod +x /usr/local/bin/dartsturnier-health

# Finale Konfiguration
success "🎯 Setup abgeschlossen!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DEIN DARTS-TURNIER-SYSTEM IST BEREIT!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Deine Website: https://$DOMAIN"
echo "🔐 Admin-Login: https://$DOMAIN/login"
echo ""
echo "📧 WICHTIG: Konfiguriere E-Mail für Magic Link Authentication:"
echo "   Bearbeite: /home/ubuntu/dartsturnier/.env.docker.local"
echo "   Setze SMTP_USER und SMTP_PASS für Gmail oder deinen Provider"
echo ""
echo "🛠️  Verwaltung:"
echo "   • Status prüfen: dartsturnier-health"
echo "   • Logs anzeigen: cd /home/ubuntu/dartsturnier && docker-compose logs -f"
echo "   • Backup manuell: /etc/cron.daily/dartsturnier-backup"
echo "   • Services neustarten: cd /home/ubuntu/dartsturnier && docker-compose restart"
echo ""
echo "🔒 Sicherheit:"
echo "   • SSH-Key Authentication aktivieren (empfohlen)"
echo "   • Regelmäßige Backups werden automatisch erstellt"
echo "   • SSL-Zertifikat ist aktiv"
echo ""
echo "📞 Support:"
echo "   Bei Problemen: dartsturnier-health (für Diagnose)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
warn "⚠️  Bitte jetzt deine Domain-DNS auf diese Server-IP zeigen lassen!"
info "Server-IP: $(curl -s ifconfig.me)"
echo ""
log "Setup erfolgreich abgeschlossen am $(date)"</content>
<parameter name="filePath">/home/cedric/dartsturnier/full-setup.sh