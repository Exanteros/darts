#!/bin/bash

# 🔍 Darts Turnier Health Check Script
# Überprüft den Status aller Services und Komponenten

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status Zähler
SERVICES_OK=0
SERVICES_TOTAL=0

check_service() {
    local service=$1
    local description=$2

    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

    if sudo systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "${GREEN}✅ $description: Running${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ $description: Stopped${NC}"
    fi
}

check_docker_service() {
    local service=$1
    local description=$2

    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

    if docker-compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✅ $description: Running${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ $description: Stopped${NC}"
    fi
}

check_port() {
    local port=$1
    local description=$2

    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ $description: Listening on port $port${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ $description: Port $port not accessible${NC}"
    fi
}

check_http() {
    local url=$1
    local description=$2

    SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

    if curl -s --max-time 10 "$url" > /dev/null; then
        echo -e "${GREEN}✅ $description: Accessible${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ $description: Not accessible${NC}"
    fi
}

echo "🔍 Darts Turnier Health Check"
echo "================================"
echo ""

# System Info
echo "🖥️  System Information:"
echo "   CPU Usage: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "   Memory: $(free -h | grep "^Mem:" | awk '{print $3 "/" $2}')"
echo "   Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo ""

# Services Check
echo "🔧 Services Status:"
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    # Docker Setup
    check_docker_service "postgres" "PostgreSQL (Docker)"
    check_docker_service "redis" "Redis (Docker)"
    check_docker_service "app" "Darts Turnier App (Docker)"
else
    # Native Setup
    check_service "postgresql" "PostgreSQL"
    check_service "redis-server" "Redis"
    check_service "dartsturnier" "Darts Turnier App"
fi

check_service "nginx" "Nginx Web Server"
echo ""

# Ports Check
echo "🔌 Network Ports:"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Node.js App"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
echo ""

# HTTP Endpoints Check
echo "🌐 HTTP Endpoints:"
if [ -f ".env.local" ] || [ -f ".env.docker.local" ]; then
    # Versuche Domain aus Environment zu lesen
    if [ -f ".env.local" ]; then
        DOMAIN=$(grep "NEXTAUTH_URL" .env.local | cut -d'=' -f2 | tr -d '"' | sed 's|https://||')
    elif [ -f ".env.docker.local" ]; then
        DOMAIN=$(grep "NEXTAUTH_URL" .env.docker.local | cut -d'=' -f2 | tr -d '"' | sed 's|https://||')
    fi

    if [ -n "$DOMAIN" ]; then
        check_http "https://$DOMAIN" "Main Website"
        check_http "https://$DOMAIN/api/health" "Health Check API"
    else
        check_http "http://localhost:3000" "Local App"
        check_http "http://localhost:3000/api/health" "Local Health Check"
    fi
else
    check_http "http://localhost:3000" "Local App"
    check_http "http://localhost:3000/api/health" "Local Health Check"
fi
echo ""

# Database Check
echo "🗄️  Database Status:"
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    # Docker PostgreSQL
    if docker-compose exec -T postgres pg_isready -U dartsturnier > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL: Connected${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ PostgreSQL: Connection failed${NC}"
    fi
else
    # Native PostgreSQL
    if sudo -u postgres pg_isready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL: Connected${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ PostgreSQL: Connection failed${NC}"
    fi
fi
SERVICES_TOTAL=$((SERVICES_TOTAL + 1))

# Redis Check
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    # Docker Redis
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis: Connected${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ Redis: Connection failed${NC}"
    fi
else
    # Native Redis
    if redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis: Connected${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo -e "${RED}❌ Redis: Connection failed${NC}"
    fi
fi
SERVICES_TOTAL=$((SERVICES_TOTAL + 1))
echo ""

# SSL Check
echo "🔒 SSL Certificate:"
if [ -d "/etc/letsencrypt/live" ]; then
    CERTS=$(find /etc/letsencrypt/live -name "cert.pem" | wc -l)
    if [ "$CERTS" -gt 0 ]; then
        echo -e "${GREEN}✅ SSL: $CERTS certificate(s) found${NC}"
        SERVICES_OK=$((SERVICES_OK + 1))

        # Check expiry
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$(ls /etc/letsencrypt/live | head -1)/cert.pem | cut -d'=' -f2)
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
        NOW=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_DATE - NOW) / 86400 ))

        if [ $DAYS_LEFT -lt 30 ]; then
            echo -e "${YELLOW}⚠️  SSL Certificate expires in $DAYS_LEFT days${NC}"
        else
            echo -e "${GREEN}✅ SSL Certificate valid for $DAYS_LEFT days${NC}"
        fi
    else
        echo -e "${RED}❌ SSL: No certificates found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  SSL: Let's Encrypt not configured${NC}"
fi
SERVICES_TOTAL=$((SERVICES_TOTAL + 1))
echo ""

# Summary
echo "📊 Summary:"
echo "   Services OK: $SERVICES_OK/$SERVICES_TOTAL"

if [ $SERVICES_OK -eq $SERVICES_TOTAL ]; then
    echo -e "${GREEN}🎉 All systems operational!${NC}"
    exit 0
elif [ $SERVICES_OK -ge $((SERVICES_TOTAL * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠️  Most systems operational${NC}"
    exit 1
else
    echo -e "${RED}❌ Critical systems down${NC}"
    exit 2
fi</content>
<parameter name="filePath">/home/cedric/dartsturnier/health-check.sh