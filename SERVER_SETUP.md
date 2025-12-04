# 🚀 Darts Turnier Server Setup - Komplette Anleitung

## Übersicht
Diese Anleitung führt dich durch die komplette Einrichtung des Darts-Turnier-Systems auf einem neuen Ubuntu/Debian Server.

**Benötigte Komponenten:**
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Nginx (Reverse Proxy)
- SSL-Zertifikate (Let's Encrypt)
- Systemd Services

---

## 📋 Vorbereitung

### 1. Server-Grundkonfiguration

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools installieren
sudo apt install -y curl wget git htop ufw fail2ban

# Firewall konfigurieren
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Swap-Speicher hinzufügen (falls < 2GB RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Domain/DNS konfigurieren
Stelle sicher, dass deine Domain auf die Server-IP zeigt:
- A-Record: `yourdomain.com` → `SERVER_IP`
- A-Record: `www.yourdomain.com` → `SERVER_IP` (optional)

---

## 🛠️ Option 1: Native Installation (Empfohlen für volle Kontrolle)

### 1. Node.js 20 installieren

```bash
# Node.js 20 Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt-get install -y nodejs

# Version prüfen
node --version  # Sollte 20.x.x zeigen
npm --version   # Sollte 10.x.x zeigen
```

### 2. PostgreSQL 16 installieren

```bash
# PostgreSQL Repository hinzufügen
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# PostgreSQL installieren
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# PostgreSQL starten und aktivieren
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Datenbank und User erstellen
sudo -u postgres psql -c "CREATE USER dartsturnier WITH PASSWORD 'DEIN_STARKES_PASSWORT_HIER';"
sudo -u postgres psql -c "CREATE DATABASE dartsturnier OWNER dartsturnier;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dartsturnier TO dartsturnier;"

# PostgreSQL für Remote-Zugriff konfigurieren (optional)
# sudo nano /etc/postgresql/16/main/pg_hba.conf
# Füge hinzu: host    dartsturnier    dartsturnier    127.0.0.1/32    md5
# sudo systemctl restart postgresql
```

### 3. Redis 7 installieren

```bash
# Redis Repository hinzufügen
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# Redis installieren
sudo apt update
sudo apt install -y redis

# Redis mit Passwort konfigurieren
sudo nano /etc/redis/redis.conf
# Suche und ändere:
# requirepass dein_redis_passwort_hier
# bind 127.0.0.1 ::1

# Redis starten und aktivieren
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Passwort testen
redis-cli -a dein_redis_passwort_hier ping
```

### 4. Projekt bereitstellen

```bash
# Projekt klonen (ersetze mit deinem Repository)
cd /home/ubuntu
git clone https://github.com/Exanteros/kneipenquiz.git dartsturnier
cd dartsturnier

# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env.local
nano .env.local
```

**Wichtige .env.local Konfiguration:**

```bash
# Database
DATABASE_URL="postgresql://dartsturnier:DEIN_DB_PASSWORT@localhost:5432/dartsturnier"

# NextAuth (REQUIRED - Generiere mit: openssl rand -base64 32)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"

# Redis Rate Limiting
REDIS_URL="redis://:DEIN_REDIS_PASSWORT@localhost:6379"

# SMTP Configuration (für Magic Link Authentication)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Darts Turnier <noreply@yourdomain.com>"

# Branding
BRAND_NAME="Darts Masters Puschendorf"
SMTP_LOGO_URL="https://yourdomain.com/logo.png"

# Production
NODE_ENV="production"
```

### 5. Datenbank initialisieren

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank-Migration ausführen
npx prisma migrate deploy

# Admin User erstellen (optional)
npx ts-node scripts/create-admin-user.ts
```

### 6. Anwendung bauen

```bash
# Production Build erstellen
npm run build
```

### 7. Systemd Service erstellen

```bash
sudo nano /etc/systemd/system/dartsturnier.service
```

**Service-Datei Inhalt:**

```ini
[Unit]
Description=Darts Turnier Application
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/dartsturnier
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dartsturnier

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable dartsturnier
sudo systemctl start dartsturnier

# Status prüfen
sudo systemctl status dartsturnier
sudo journalctl -u dartsturnier -f
```

### 8. Nginx Reverse Proxy konfigurieren

```bash
# Nginx installieren
sudo apt install -y nginx

# Site-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/dartsturnier
```

**Nginx Konfiguration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Logs
    access_log /var/log/nginx/dartsturnier_access.log;
    error_log /var/log/nginx/dartsturnier_error.log;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Upload Size Limit
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

```bash
# Konfiguration aktivieren
sudo ln -s /etc/nginx/sites-available/dartsturnier /etc/nginx/sites-enabled/

# Default Site deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# Konfiguration testen
sudo nginx -t

# Nginx neu starten
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. SSL mit Let's Encrypt

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat beantragen
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Cronjob für automatische Verlängerung (wird automatisch eingerichtet)
sudo crontab -l | grep certbot
```

---

## 🐳 Option 2: Docker Installation (Einfacher)

### 1. Docker installieren

```bash
# Docker Repository hinzufügen
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Neuanmeldung für Docker-Gruppe
newgrp docker
```

### 2. Projekt bereitstellen

```bash
cd /home/ubuntu
git clone https://github.com/Exanteros/kneipenquiz.git dartsturnier
cd dartsturnier

# Docker Environment erstellen
cp .env.docker .env.docker.local
nano .env.docker.local
```

**Wichtige .env.docker.local Konfiguration:**

```bash
# Database
DB_PASSWORD=DEIN_STARKES_DB_PASSWORT

# Redis
REDIS_PASSWORD=DEIN_STARKES_REDIS_PASSWORT

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# SMTP (für Magic Link)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Darts Turnier <noreply@yourdomain.com>"

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Docker Services starten

```bash
# Services starten
docker-compose --env-file .env.docker.local up -d

# Status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f
```

### 4. Datenbank initialisieren

```bash
# Prisma Migration ausführen
docker-compose exec app npx prisma migrate deploy

# Admin User erstellen
docker-compose exec app npx ts-node scripts/create-admin-user.ts
```

### 5. Nginx für Docker-Setup

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/dartsturnier
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dartsturnier /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL für Docker

```bash
sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com -d www.yourdomain.com
# SSL-Pfade in Nginx-Konfiguration aktualisieren
sudo systemctl restart nginx
```

---

## 🔧 Nach der Installation

### 1. Erster Test

```bash
# HTTP-Zugriff testen
curl -I http://yourdomain.com

# HTTPS-Zugriff testen
curl -I https://yourdomain.com

# Health Check
curl https://yourdomain.com/api/health
```

### 2. Admin User einrichten

Besuche `https://yourdomain.com` und erstelle deinen ersten Admin-Account über die Registrierung, oder verwende das Script:

```bash
# Bei Docker
docker-compose exec app npx ts-node scripts/create-admin-user.ts

# Bei Native Installation
npx ts-node scripts/create-admin-user.ts
```

### 3. E-Mail-Konfiguration testen

Gehe zu `https://yourdomain.com/dashboard/mail` und sende eine Test-E-Mail.

### 4. Backup einrichten

**PostgreSQL Backup Script:**

```bash
sudo nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dartsturnier_$DATE.sql"

mkdir -p $BACKUP_DIR

# PostgreSQL Backup
PGPASSWORD=DEIN_DB_PASSWORT pg_dump -h localhost -U dartsturnier dartsturnier > $BACKUP_FILE

# Alte Backups löschen (behalte 7 Tage)
find $BACKUP_DIR -name "dartsturnier_*.sql" -mtime +7 -delete

echo "Backup erstellt: $BACKUP_FILE"
```

```bash
chmod +x /home/ubuntu/backup.sh

# Cronjob für tägliches Backup um 2:00 Uhr
crontab -e
# Füge hinzu: 0 2 * * * /home/ubuntu/backup.sh
```

---

## 📊 Monitoring & Wartung

### 1. Logs überwachen

```bash
# Systemd Logs
sudo journalctl -u dartsturnier -f

# Nginx Logs
sudo tail -f /var/log/nginx/dartsturnier_access.log
sudo tail -f /var/log/nginx/dartsturnier_error.log

# Docker Logs
docker-compose logs -f app
```

### 2. System überwachen

```bash
# Ressourcen prüfen
htop
df -h
free -h

# Docker Container Status
docker stats

# Datenbank Status
sudo -u postgres psql -d dartsturnier -c "SELECT version();"
```

### 3. Updates durchführen

```bash
# System Updates
sudo apt update && sudo apt upgrade -y

# Projekt Updates
cd /home/ubuntu/dartsturnier
git pull
npm install
npm run build
sudo systemctl restart dartsturnier

# Docker Updates
docker-compose pull
docker-compose up -d
```

---

## 🚨 Troubleshooting

### Häufige Probleme

**1. Anwendung startet nicht:**
```bash
sudo journalctl -u dartsturnier -n 50
# Prüfe Environment-Variablen und Datenbank-Verbindung
```

**2. Datenbank-Verbindungsfehler:**
```bash
# PostgreSQL Status
sudo systemctl status postgresql

# Verbindung testen
psql -h localhost -U dartsturnier -d dartsturnier
```

**3. Redis-Verbindungsfehler:**
```bash
# Redis Status
sudo systemctl status redis-server

# Verbindung testen
redis-cli -a dein_passwort ping
```

**4. SSL-Probleme:**
```bash
# Zertifikat prüfen
sudo certbot certificates

# Nginx Konfiguration testen
sudo nginx -t
```

**5. Hohe CPU/Memory Nutzung:**
```bash
# Prozesse prüfen
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head

# Node.js spezifisch
sudo journalctl -u dartsturnier | grep -i error
```

---

## 🔐 Security Checklist

- [ ] SSH-Key Authentication aktiviert (keine Passwörter)
- [ ] UFW Firewall konfiguriert
- [ ] Fail2Ban installiert und aktiv
- [ ] Starke Passwörter für alle Services
- [ ] NEXTAUTH_SECRET ist 32+ Zeichen lang
- [ ] SSL/TLS ist aktiv (HTTPS)
- [ ] Automatische Updates aktiviert
- [ ] Regelmäßige Backups eingerichtet
- [ ] Unnötige Services deaktiviert
- [ ] Root-Login deaktiviert

---

## 📞 Support

Bei Problemen:
1. Logs prüfen (`sudo journalctl -u dartsturnier -f`)
2. System-Status prüfen (`sudo systemctl status dartsturnier`)
3. Health-Check testen (`curl https://yourdomain.com/api/health`)
4. GitHub Issues für bekannte Probleme prüfen

**Erfolgreich eingerichtet? 🎯**
Dein Darts-Turnier-System sollte nun unter `https://yourdomain.com` erreichbar sein!</content>
<parameter name="filePath">/home/cedric/dartsturnier/SERVER_SETUP.md