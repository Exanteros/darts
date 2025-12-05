#!/bin/bash

# 🎯 Darts Turnier - Ultimate Setup Script
# 100% Automated - Visual Excellence

set -e

# ==============================================================================
# 🎨 COLORS & STYLES
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ==============================================================================
# ⚙️ CONFIGURATION
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/dartsturnier-setup.log"
BACKUP_DIR="$HOME/backups"
TOTAL_STEPS=12
CURRENT_STEP=0

# ==============================================================================
# 🧊 SPINNING CUBE ANIMATION
# ==============================================================================
draw_cube() {
    clear
    echo -e "${CYAN}"
    echo "      D A R T S   T U R N I E R   S E T U P"
    echo -e "${NC}"
    
    local i=0
    local end=$((SECONDS+4))
    
    while [ $SECONDS -lt $end ]; do
        echo -e "${BLUE}"
        case $((i % 4)) in
            0)
echo "      +------+"
echo "     /      /|"
echo "    +------+ |"
echo "    |      | +"
echo "    |      |/"
echo "    +------+"
            ;;
            1)
echo "      .------+"
echo "     /|     /|"
echo "    +------+ |"
echo "    | |    | +"
echo "    | +----|/"
echo "    +------+"
            ;;
            2)
echo "      +------."
echo "     /|     /|"
echo "    +------+ |"
echo "    |      | |"
echo "    |      |/+"
echo "    +------+"
            ;;
            3)
echo "      +------+"
echo "     /      /|"
echo "    +------+ |"
echo "    |      | +"
echo "    |      |/"
echo "    +------+"
            ;;
        esac
        echo -e "${NC}"
        sleep 0.15
        # Move cursor up 6 lines
        echo -e "\033[7A"
        i=$((i+1))
    done
    # Clear the cube space
    echo -e "\033[7B"
}

# ==============================================================================
# 🛠️ HELPER FUNCTIONS
# ==============================================================================

# Header
show_header() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   🎯  D A R T S   T U R N I E R   -   S E T U P          ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Logging
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Progress Bar
show_progress() {
    local width=40
    local percent=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    
    printf "\r${BLUE}Progress: [${GREEN}"
    printf "%0.s▓" $(seq 1 $filled)
    printf "${DIM}"
    printf "%0.s░" $(seq 1 $empty)
    printf "${NC}${BLUE}] ${percent}%%${NC}"
}

# Task Runner with Spinner
run_task() {
    local description="$1"
    local command="$2"
    
    CURRENT_STEP=$((CURRENT_STEP + 1))
    
    echo ""
    echo -e "${BOLD}${PURPLE}Step $CURRENT_STEP/$TOTAL_STEPS:${NC} $description"
    show_progress
    echo ""
    
    # Start spinner in background
    local pid=$!
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    
    # Run command in background, redirect output to log
    eval "$command" >> "$LOG_FILE" 2>&1 &
    local cmd_pid=$!
    
    # Spinner loop
    tput civis # Hide cursor
    while kill -0 "$cmd_pid" 2>/dev/null; do
        local temp=${spinstr#?}
        printf "   ${CYAN}%c${NC}  Working..." "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\r"
    done
    tput cnorm # Show cursor
    
    # Check exit status
    wait "$cmd_pid"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        printf "\r   ${GREEN}✔${NC}  Done!      \n"
        log "SUCCESS: $description"
    else
        printf "\r   ${RED}✘${NC}  Failed!    \n"
        log "ERROR: $description"
        echo -e "${RED}Error details in $LOG_FILE${NC}"
        exit 1
    fi
}

# ==============================================================================
# 🚀 MAIN SCRIPT
# ==============================================================================

# Root Check
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Dieses Script darf nicht als root ausgeführt werden!${NC}"
   exit 1
fi

# Intro Animation
draw_cube
show_header

# Domain Input
if [ -z "$1" ]; then
    echo -e "${YELLOW}👋 Willkommen zum Setup-Assistenten!${NC}"
    echo ""
    echo -n -e "${BOLD}Bitte gib deine Domain ein (z.B. darts.de): ${NC}"
    read DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}❌ Domain ist erforderlich!${NC}"
        exit 1
    fi
else
    DOMAIN="$1"
fi

# Domain Validation
if ! echo "$DOMAIN" | grep -qE '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'; then
    echo -e "${RED}❌ Ungültige Domain: $DOMAIN${NC}"
    exit 1
fi

log "🚀 Starte Setup für Domain: $DOMAIN"

# 1. System Update
run_task "System aktualisieren & Basics installieren" \
    "sudo apt update && sudo apt upgrade -y && sudo apt install -y curl wget git htop ufw fail2ban software-properties-common apt-transport-https ca-certificates gnupg lsb-release nano"

# 2. Firewall
run_task "Firewall & Sicherheit konfigurieren" \
    "sudo ufw --force enable && sudo ufw allow ssh && sudo ufw allow 80 && sudo ufw allow 443 && sudo systemctl enable fail2ban && sudo systemctl start fail2ban"

# 3. Swap
if [ "$(free -m | grep '^Mem:' | awk '{print $2}')" -lt 2048 ]; then
    run_task "Swap-Speicher einrichten (Low RAM detected)" \
        "sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
else
    CURRENT_STEP=$((CURRENT_STEP + 1)) # Skip step count
fi

# 4. Node.js
run_task "Node.js 20 installieren" \
    "if ! command -v node &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; fi"

# 5. PostgreSQL
run_task "PostgreSQL 16 installieren" \
    "if ! command -v psql &> /dev/null; then sudo sh -c 'echo \"deb http://apt.postgresql.org/pub/repos/apt \$(lsb_release -cs)-pgdg main\" > /etc/apt/sources.list.d/pgdg.list' && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - && sudo apt update && sudo apt install -y postgresql-16 postgresql-contrib-16 && sudo systemctl start postgresql && sudo systemctl enable postgresql; fi"

# 6. Redis
run_task "Redis 7 installieren" \
    "if ! command -v redis-cli &> /dev/null; then curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg && echo \"deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb \$(lsb_release -cs) main\" | sudo tee /etc/apt/sources.list.d/redis.list && sudo apt update && sudo apt install -y redis && sudo systemctl start redis-server && sudo systemctl enable redis-server; fi"

# 7. Nginx
run_task "Nginx Webserver installieren" \
    "sudo apt install -y nginx && sudo systemctl enable nginx"

# 8. Certbot
run_task "SSL-Tools (Certbot) installieren" \
    "sudo apt install -y certbot python3-certbot-nginx"

# 9. Docker
run_task "Docker & Docker Compose installieren" \
    "if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker $USER && sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose; fi"

# 10. Project Setup
INSTALL_DIR="$(eval echo ~$SUDO_USER)"
[ -z "$INSTALL_DIR" ] && INSTALL_DIR="$HOME"
cd "$INSTALL_DIR"

run_task "Projekt-Repository klonen & vorbereiten" \
    "if [ -d 'dartsturnier' ]; then mkdir -p $BACKUP_DIR && sudo tar -czf $BACKUP_DIR/pre-setup-backup-\$(date +%Y%m%d_%H%M%S).tar.gz -C $INSTALL_DIR dartsturnier 2>/dev/null || true && sudo rm -rf dartsturnier; fi && git clone https://github.com/Exanteros/darts.git dartsturnier"

cd dartsturnier

# Patches & Config
run_task "Konfiguration & Patches anwenden" \
    "sed -i '/RUN npm run build/i ARG NEXTAUTH_SECRET=placeholder\nARG NEXTAUTH_URL=http://localhost:3000\nENV NEXTAUTH_SECRET=\$NEXTAUTH_SECRET\nENV NEXTAUTH_URL=\$NEXTAUTH_URL\n' Dockerfile && sed -i 's/provider = \"sqlite\"/provider = \"postgresql\"/' prisma/schema.prisma && npm install --legacy-peer-deps"

# Generate Secrets
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env.docker.local << EOF
# Database
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://dartsturnier:$DB_PASSWORD@postgres:5432/dartsturnier

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379

# NextAuth
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Darts Turnier <noreply@$DOMAIN>"

# Branding
BRAND_NAME="Darts Masters"
