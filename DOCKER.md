# Docker Deployment Guide

## 🐳 Schnellstart mit Docker Compose

### Voraussetzungen
- Docker Engine 20.10+
- Docker Compose v2+

### 1. Environment Setup

Kopiere die Docker-Environment-Datei:
```bash
cp .env.docker .env.docker.local
```

Bearbeite `.env.docker.local` und setze mindestens:
- `NEXTAUTH_SECRET` (min. 32 Zeichen, generiere mit: `openssl rand -base64 32`)
- `DB_PASSWORD` (starkes Passwort)
- `REDIS_PASSWORD` (starkes Passwort)
- SMTP Credentials (wenn Magic Link Authentication verwendet wird)

### 2. Application starten

```bash
# Services starten (im Hintergrund)
docker-compose --env-file .env.docker.local up -d

# Logs anzeigen
docker-compose logs -f

# Nur App Logs
docker-compose logs -f app
```

### 3. Datenbank initialisieren

```bash
# Prisma Migrations ausführen
docker-compose exec app npx prisma migrate deploy

# Admin User erstellen
docker-compose exec app npx ts-node scripts/create-admin-user.ts
```

### 4. Zugriff

Die Anwendung läuft auf: http://localhost:3000

Health Check: http://localhost:3000/api/health

### Services verwalten

```bash
# Status prüfen
docker-compose ps

# Services stoppen
docker-compose stop

# Services neu starten
docker-compose restart

# Services stoppen und Container entfernen
docker-compose down

# Alle löschen inkl. Volumes (⚠️ DATEN GEHEN VERLOREN)
docker-compose down -v

# Rebuild nach Code-Änderungen
docker-compose build
docker-compose up -d
```

## 📦 Production Deployment (einzelnes Image)

### 1. Image bauen

```bash
docker build -t dartsturnier:latest .
```

### 2. Image ausführen

```bash
docker run -d \
  --name dartsturnier \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  -e REDIS_URL="redis://:password@host:6379" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret-min-32-chars" \
  -e SMTP_HOST="smtp.example.com" \
  -e SMTP_PORT="587" \
  -e SMTP_USER="user@example.com" \
  -e SMTP_PASSWORD="password" \
  -e SMTP_FROM="noreply@your-domain.com" \
  dartsturnier:latest
```

### 3. Datenbank Migrations

```bash
docker exec dartsturnier npx prisma migrate deploy
```

### 4. Admin User erstellen

```bash
docker exec -it dartsturnier npx ts-node scripts/create-admin-user.ts
```

## 🔧 Troubleshooting

### Container Logs prüfen
```bash
docker-compose logs app
docker logs dartsturnier
```

### In Container Shell
```bash
docker-compose exec app sh
docker exec -it dartsturnier sh
```

### Health Check Status
```bash
docker inspect --format='{{json .State.Health}}' dartsturnier | jq
```

### Prisma Studio (Development)
```bash
docker-compose exec app npx prisma studio
# Öffne http://localhost:5555
```

## 🚀 Production Best Practices

### 1. Verwende externe Datenbank und Redis
Für Production empfohlen:
- Managed PostgreSQL (z.B. AWS RDS, DigitalOcean Managed DB)
- Managed Redis (z.B. AWS ElastiCache, Upstash)

### 2. Sichere Secrets
Verwende Docker Secrets oder Umgebungsvariablen-Management:
```bash
docker secret create nextauth_secret /path/to/secret
```

### 3. Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL/TLS Setup
Verwende Certbot für Let's Encrypt:
```bash
certbot --nginx -d your-domain.com
```

### 5. Monitoring

Health Check Endpoint: `/api/health`

Integriere mit:
- Docker Health Checks
- Kubernetes Liveness/Readiness Probes
- Uptime Monitoring Services

### 6. Backups

PostgreSQL Backup:
```bash
docker-compose exec postgres pg_dump -U dartsturnier dartsturnier > backup.sql
```

Restore:
```bash
cat backup.sql | docker-compose exec -T postgres psql -U dartsturnier dartsturnier
```

## 🔐 Security Checklist

- [ ] NEXTAUTH_SECRET ist min. 32 Zeichen lang und random
- [ ] Starke Passwörter für Database und Redis
- [ ] SMTP Credentials sind sicher
- [ ] SSL/TLS ist konfiguriert (HTTPS)
- [ ] Firewall Regeln sind gesetzt
- [ ] Rate Limiting ist aktiv (Redis)
- [ ] Umgebungsvariablen sind nicht im Code
- [ ] Docker Image läuft als non-root User
- [ ] Volumes haben korrekte Permissions
- [ ] Regelmäßige Backups sind eingerichtet

## 📊 Resource Requirements

**Minimum:**
- CPU: 1 Core
- RAM: 1 GB
- Disk: 10 GB

**Empfohlen (Production):**
- CPU: 2+ Cores
- RAM: 2+ GB
- Disk: 20+ GB SSD

## 🔗 Weitere Informationen

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
