#!/bin/bash

# 🛠️ Darts Turnier - Ultimate Lokales Dev-Setup (Interactive)
# Generiert automatisch eine komplett ausgestattete .env Datei
# Fragt SMTP/Stripe Daten ab und richtet DB/Redis ein.

set -e

# Farben für hübschen Terminal-Output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starte interaktives Darts Turnier Setup...${NC}"
echo "--------------------------------------------------------"

# --- 1. INTERAKTIVE ABFRAGE ---
echo -e "${YELLOW}Bitte beantworte folgende Fragen für die Umgebungsvariablen.${NC}"
echo "(Drücke einfach ENTER, um den in eckigen Klammern [angegebenen] Standardwert zu übernehmen)"
echo ""

# Brand Name
read -p "Projekt/Brand Name [Darts Masters Local]: " BRAND_NAME
BRAND_NAME=${BRAND_NAME:-"Darts Masters Local"}

# SMTP Abfragen
echo ""
echo -e "${CYAN}--- E-Mail / SMTP Konfiguration ---${NC}"
read -p "SMTP Host [localhost]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-"localhost"}

read -p "SMTP Port [1025]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-"1025"}

read -p "SMTP Benutzer []: " SMTP_USER
read -p "SMTP Passwort []: " SMTP_PASS

read -p "Absender E-Mail (SMTP_FROM) [dev@localhost]: " SMTP_FROM
SMTP_FROM=${SMTP_FROM:-"dev@localhost"}

# Stripe Abfragen
echo ""
echo -e "${CYAN}--- Stripe (Payment) Konfiguration ---${NC}"
echo "Lass diese leer, wenn du aktuell keine Zahlungen testen willst."
read -p "Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) [pk_test_placeholder]: " STRIPE_PUB
STRIPE_PUB=${STRIPE_PUB:-"pk_test_placeholder"}

read -p "Stripe Secret Key (STRIPE_SECRET_KEY) [sk_test_placeholder]: " STRIPE_SEC
STRIPE_SEC=${STRIPE_SEC:-"sk_test_placeholder"}

read -p "Stripe Webhook Secret (STRIPE_WEBHOOK_SECRET) [whsec_placeholder]: " STRIPE_WH
STRIPE_WH=${STRIPE_WH:-"whsec_placeholder"}

echo "--------------------------------------------------------"
echo "✅ Eingaben gespeichert! Setup beginnt..."
echo ""

# --- 2. DOCKER PRÜFUNG ---
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Installiere Docker...${NC}"
    sudo apt update
    sudo apt install -y docker.io docker-compose openssl
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installiert! (Info: Evtl. musst du dich einmal ab- und wieder anmelden für die Gruppenrechte).${NC}"
fi

# --- 3. NPM PACKAGES ---
echo -e "${CYAN}📦 Installiere Node.js Abhängigkeiten...${NC}"
npm install

# --- 4. SECRETS GENERIEREN ---
echo -e "${CYAN}🔐 Generiere extrem sichere Passwörter und Secrets für DB/Redis...${NC}"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/ " | cut -c1-30)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/ " | cut -c1-30)
NEXTAUTH_SECRET=$(openssl rand -base64 48 | tr -d "=+/ " | cut -c1-40)

# --- 5. .ENV ERSTELLEN ---
echo -e "${CYAN}📝 Erstelle .env Datei...${NC}"
cat > .env << ENV_EOF
# ==========================================
# 🛠️ AUTO-GENERATED DEV ENVIRONMENT
# ==========================================

# --- App ---
NODE_ENV="development"
PORT=3000
BRAND_NAME="${BRAND_NAME}"

# --- Database (PostgreSQL via lokales Docker) ---
DB_PASSWORD="${DB_PASSWORD}"
DATABASE_URL="postgresql://dartsturnier:${DB_PASSWORD}@localhost:5432/dartsturnier?schema=public"

# --- Redis (lokales Docker) ---
REDIS_PASSWORD="${REDIS_PASSWORD}"
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"

# --- NextAuth ---
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# --- SMTP / E-Mail ---
SMTP_HOST="${SMTP_HOST}"
SMTP_PORT="${SMTP_PORT}"
SMTP_USER="${SMTP_USER}"
SMTP_PASS="${SMTP_PASS}"
SMTP_FROM="${SMTP_FROM}"

# --- Stripe (Payment) ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${STRIPE_PUB}"
STRIPE_SECRET_KEY="${STRIPE_SEC}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WH}"
ENV_EOF

echo -e "${GREEN}✅ .env erfolgreich befüllt!${NC}"

# --- 6. DOCKER STARTEN ---
echo -e "${CYAN}🐳 Starte PostgreSQL & Redis Container im Hintergrund...${NC}"
sudo docker-compose up -d postgres redis

# --- 7. DB SETUP ---
echo -e "${YELLOW}⏳ Warte 10 Sekunden, bis die Datenbank hochgefahren ist...${NC}"
sleep 10

echo -e "${CYAN}🗄️ Initialisiere Prisma Client...${NC}"
npx prisma generate

echo -e "${CYAN}🗄️ Aktualisiere die Prisma Datenbank (Migrate/Push)...${NC}"
npx prisma db push

echo ""
echo -e "${GREEN}✅✅✅ SETUP KOMPLETT ABGESCHLOSSEN! ✅✅✅${NC}"
echo "Zusammenfassung:"
echo " - Brand Name: ${BRAND_NAME}"
echo " - SMTP konfiguriert: ${SMTP_HOST} (User: ${SMTP_USER:-Keiner})"
echo " - Docker (DB & Redis) laufen mit dynamisch generierten Passwörtern"
echo " - Prisma Client & Tabellen generiert"
echo ""
echo -e "${CYAN}🚀 Du kannst die App jetzt starten mit:${NC}"
echo -e "${GREEN}👉 npm run dev:all${NC}"
