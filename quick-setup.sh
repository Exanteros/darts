#!/bin/bash

# 🚀 Schnell-Setup für erfahrene Admins
# Weniger Output, mehr Automation

set -e

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
    echo "Verwendung: $0 <domain>"
    echo "Beispiel: $0 darts-turnier.de"
    exit 1
fi

echo "🚀 Starte Schnell-Setup für $DOMAIN..."

# System aktualisieren
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw fail2ban software-properties-common

# Firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update && sudo apt install -y postgresql-16 postgresql-contrib-16
sudo systemctl enable --now postgresql

# Redis
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update && sudo apt install -y redis
sudo systemctl enable --now redis-server

# Nginx & SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Projekt
cd /home/ubuntu
[ -d "dartsturnier" ] && sudo rm -rf dartsturnier
git clone https://github.com/Exanteros/kneipenquiz.git dartsturnier
cd dartsturnier

npm install

# Konfiguration
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env.docker.local << EOF
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Darts Turnier <noreply@$DOMAIN>"
BRAND_NAME="Darts Masters Puschendorf"
EOF

# Services starten
docker-compose --env-file .env.docker.local up -d postgres redis
sleep 10

# Datenbank
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx ts-node scripts/create-admin-user.ts

# App starten
docker-compose --env-file .env.docker.local up -d

# Nginx
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
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dartsturnier /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# SSL (versuchen)
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null || echo "SSL später manuell: sudo certbot --nginx -d $DOMAIN"

echo ""
echo "🎉 Setup fertig!"
echo "🌐 https://$DOMAIN"
echo "🔧 Konfiguriere SMTP in .env.docker.local"
echo "📊 Status: dartsturnier-health"</content>
<parameter name="filePath">/home/cedric/dartsturnier/quick-setup.sh