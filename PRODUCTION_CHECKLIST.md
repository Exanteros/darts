# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## ✅ VOR PRODUKTIVBETRIEB ERFORDERLICH

### 🔐 Security (KRITISCH)
- [ ] **NEXTAUTH_SECRET**: Starken Secret generieren und setzen
  ```bash
  openssl rand -base64 32
  ```
- [ ] **SMTP Credentials**: Echte SMTP-Zugangsdaten konfigurieren
- [ ] **Database URL**: Produktionsdatenbank (PostgreSQL empfohlen statt SQLite)
- [ ] **Environment**: NODE_ENV=production setzen
- [ ] **.env Security**: .env nicht in Git committen (ist in .gitignore ✅)

### 🛡️ Infrastructure
- [ ] **HTTPS**: SSL/TLS-Zertifikat installiert (Let's Encrypt)
- [ ] **Firewall**: Nur Port 443 (HTTPS) nach außen öffnen
- [ ] **Backups**: Automatische Datenbank-Backups einrichten
- [ ] **Monitoring**: Error Tracking (z.B. Sentry) einrichten
- [ ] **Logging**: Produktions-Logs in externes System (nicht Console)

### ⚡ Performance & Skalierung
- [ ] **Rate Limiting**: Redis für Rate Limiting (siehe unten)
- [ ] **Session Store**: Redis für NextAuth Sessions (optional)
- [ ] **CDN**: Static Assets über CDN ausliefern
- [ ] **Database**: SQLite durch PostgreSQL ersetzen
- [ ] **Caching**: Redis für API-Response-Caching

### 🔧 Rate Limiting Migration (bei Skalierung)

**Option 1: Redis (empfohlen für Production)**
```bash
# 1. Redis installieren
npm install ioredis @upstash/redis

# 2. Environment Variable
echo "REDIS_URL=redis://localhost:6379" >> .env

# 3. Rate Limiting anpassen
# Siehe: docs/REDIS_RATE_LIMITING.md
```

**Option 2: Upstash Redis (Serverless)**
```bash
# Ideal für Vercel/Serverless Deployments
npm install @upstash/redis @upstash/ratelimit
```

### 📊 Monitoring
- [ ] **Health Check Endpoint**: /api/health erstellen
- [ ] **Uptime Monitoring**: UptimeRobot oder ähnliches
- [ ] **Error Tracking**: Sentry.io integrieren
- [ ] **Performance**: New Relic oder DataDog

### 🔄 CI/CD
- [ ] **Automated Tests**: Jest/Playwright Tests
- [ ] **Lint Checks**: ESLint in CI/CD Pipeline
- [ ] **TypeScript**: Keine Type Errors vor Deployment
- [ ] **Security Scan**: npm audit in Pipeline

## ⚠️ CURRENT STATUS (lokal/dev)

✅ **Entwicklung OK:**
- In-Memory Rate Limiting funktioniert für Single-Instance
- SQLite ausreichend für kleine Installationen (<1000 Benutzer)
- Console Logging OK für Entwicklung

❌ **Produktion NICHT OK:**
- Kein NEXTAUTH_SECRET gesetzt
- Beispiel-SMTP-Credentials
- Keine Security Headers (jetzt behoben ✅)
- XSS in Mail Preview (jetzt behoben ✅)

## 📚 Dokumentation

- **Security**: [SECURITY.md](./SECURITY.md)
- **Rate Limiting Details**: Siehe `src/app/api/auth/magic-link/request/route.ts`
- **Magic Link Flow**: Siehe SECURITY.md Abschnitt 1

## 🆘 Support

Bei Fragen zur Produktion-Deployment:
1. SECURITY.md lesen
2. Diese Checklist abarbeiten
3. Tests durchführen

---
**Erstellt:** 2025-01-19  
**Letzte Aktualisierung:** 2025-01-19
