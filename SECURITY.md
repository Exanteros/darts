# Security Übersicht - Darts Masters Puschendorf

## Anmeldungssystem - Magic Link

### Implementierte Sicherheitsmaßnahmen

#### 1. **Rate Limiting**
- **IP-basiert**: Max. 5 Magic Link Anfragen pro Stunde
- **Email-basiert**: Max. 5 Magic Link Anfragen pro E-Mail pro Stunde
- **Token-Verifikation**: Max. 10 Versuche pro IP pro Stunde
- **Retry-After Header**: Gibt an, wann erneut versucht werden kann

#### 2. **Token-Sicherheit**
- **Kryptographisch sicher**: 64 Bytes (128 hex chars) via `crypto.randomBytes()`
- **Single-Use**: Token kann nur einmal verwendet werden
- **Kurze Gültigkeit**: 15 Minuten (statt 24h)
- **Format-Validierung**: Nur gültige hex-Tokens werden akzeptiert
- **Atomare Updates**: Race Condition Prevention durch Prisma Transactions

#### 3. **Timing-Attack Prevention**
- Gleiche Antwortzeit bei existierenden und nicht-existierenden Usern
- Keine detaillierten Fehlermeldungen an den Client
- Konstante Verarbeitungszeit durch künstliche Verzögerungen

#### 4. **Session-Sicherheit**
- **JWT Strategy**: Sichere Token-basierte Sessions
- **Session-Rotation**: Token werden alle 24h automatisch erneuert
- **Max Age**: Sessions laufen nach 7 Tagen ab
- **Secure Cookies**: httpOnly, secure (in Production), sameSite
- **Token-Validierung**: Timestamp-basierte Überprüfung

#### 5. **Email-Validierung**
- Regex-basierte Format-Prüfung
- Längen-Begrenzung (max. 255 Zeichen)
- Normalisierung (lowercase, trim)
- Type-Checking (string validation)

#### 6. **Input-Sanitization**
- Alle Eingaben werden validiert und normalisiert
- SQL-Injection Prevention durch Prisma ORM
- XSS-Prevention durch React und Next.js

#### 7. **HTTPS-Enforcement**
- Produktion erfordert HTTPS für NEXTAUTH_URL
- Secure Cookie Flag in Production
- HSTS Header empfohlen (via Next.js Config)

#### 8. **Audit Logging**
- Alle Magic Link Anfragen werden geloggt
- Erfolgreiche und fehlgeschlagene Versuche werden protokolliert
- IP-Adressen werden für Sicherheitsanalysen gespeichert

#### 9. **Token-Cleanup**
- Automatisches Löschen abgelaufener Tokens
- Löschen aller Tokens nach erfolgreicher Verwendung
- Cleanup alter verwendeter Tokens

#### 10. **Open Redirect Prevention**
- Validierung aller Weiterleitungs-URLs
- Nur interne URLs werden akzeptiert
- Base URL Überprüfung

### Best Practices

#### Umgebungsvariablen
Stelle sicher, dass folgende Variablen gesetzt sind:

```env
NEXTAUTH_SECRET=<starkes-secret-mindestens-32-zeichen>
NEXTAUTH_URL=https://deine-domain.de
NODE_ENV=production
```

#### NEXTAUTH_SECRET generieren
```bash
openssl rand -base64 32
```

#### Empfohlene Next.js Security Headers

In `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ]
    }
  ]
}
```

### Monitoring & Alerts

#### Empfohlene Überwachung
- Rate Limit Violations
- Fehlgeschlagene Token-Verifikationen
- Ungewöhnliche Aktivitätsmuster
- Mehrfache fehlgeschlagene Login-Versuche

#### Log-Analyse
Alle sicherheitsrelevanten Events werden in der Console geloggt:
- `Magic Link requested for user X from IP Y`
- `Successful magic link verification for user X from IP Y`
- `Failed password login attempt for email@example.com`

### Sicherheits-Checkliste

- [x] Rate Limiting implementiert
- [x] CSRF-Protection (via NextAuth)
- [x] XSS-Prevention (via React/Next.js)
- [x] SQL-Injection Prevention (via Prisma)
- [x] Sichere Token-Generierung
- [x] Session-Management
- [x] Input-Validierung
- [x] Audit Logging
- [x] HTTPS-Enforcement
- [x] Open Redirect Prevention
- [x] Timing-Attack Prevention
- [ ] Content Security Policy (empfohlen)
- [ ] Subresource Integrity (empfohlen)
- [ ] Redis für Rate Limiting (empfohlen für Production)

### Bekannte Limitationen

1. **In-Memory Rate Limiting**: Aktuell wird ein In-Memory Store verwendet. Für Production wird Redis empfohlen.
2. **Email-Sicherheit**: DKIM/SPF sollten konfiguriert sein.
3. **2FA**: Aktuell nicht implementiert (optional für zukünftige Versionen).

### Reporting

Sicherheitslücken bitte melden an: security@dartsturnier.de

### Updates

Letzte Überprüfung: 26. November 2025
