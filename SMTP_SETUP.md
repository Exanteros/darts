# 🔒 SMTP KONFIGURATION - SETUP GUIDE

## ⚠️ WICHTIG
Die aktuellen SMTP-Credentials in der `.env` Datei sind **Beispielwerte** und funktionieren **NICHT**:
```env
SMTP_HOST=smtp.example.com  # ← Existiert nicht!
SMTP_PASS=password          # ← Unsicher!
```

**Magic Link E-Mails werden NICHT versendet bis echte Credentials konfiguriert sind!**

---

## 📧 EMPFOHLENE E-MAIL-PROVIDER

### 1. **SendGrid** (Empfohlen für kleine/mittlere Projekte)
- ✅ 100 E-Mails/Tag kostenlos
- ✅ Einfaches Setup
- ✅ Gute Zustellrate

**Setup:**
```bash
# 1. Account erstellen: https://sendgrid.com
# 2. API Key generieren: Settings → API Keys
# 3. .env konfigurieren:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASS=<IHR_SENDGRID_API_KEY>
SMTP_FROM="Darts Turnier" <noreply@ihre-domain.de>
```

### 2. **Mailgun** (Gut für mittlere/große Projekte)
- ✅ 5.000 E-Mails/Monat kostenlos (erste 3 Monate)
- ✅ Professionelle Features
- ✅ EU-Server verfügbar

**Setup:**
```bash
# 1. Account erstellen: https://mailgun.com
# 2. Domain verifizieren
# 3. .env konfigurieren:
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=postmaster@ihre-domain.de
SMTP_PASS=<IHR_MAILGUN_PASSWORD>
SMTP_FROM="Darts Turnier" <noreply@ihre-domain.de>
```

### 3. **AWS SES** (Für große Projekte / AWS-Nutzer)
- ✅ Sehr günstig ($0.10 per 1.000 E-Mails)
- ✅ Hochskalierbar
- ⚠️ Komplexeres Setup

**Setup:**
```bash
# 1. AWS Account + SES aktivieren
# 2. SMTP Credentials generieren
# 3. .env konfigurieren:
SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=<AWS_SMTP_USER>
SMTP_PASS=<AWS_SMTP_PASSWORD>
SMTP_FROM="Darts Turnier" <noreply@ihre-domain.de>
```

### 4. **Resend** (Modern & Developer-Friendly)
- ✅ 100 E-Mails/Tag kostenlos
- ✅ Sehr einfaches Setup
- ✅ Moderne API

**Setup:**
```bash
# 1. Account erstellen: https://resend.com
# 2. API Key generieren
# 3. .env konfigurieren:
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=<IHR_RESEND_API_KEY>
SMTP_FROM="Darts Turnier" <noreply@ihre-domain.de>
```

---

## 🧪 TESTING (Lokal/Entwicklung)

### Option A: Mailtrap (Empfohlen für Testing)
E-Mails werden abgefangen und nicht wirklich versendet:

```bash
# 1. Account erstellen: https://mailtrap.io
# 2. Inbox erstellen
# 3. .env für Entwicklung:
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=<MAILTRAP_USER>
SMTP_PASS=<MAILTRAP_PASS>
SMTP_FROM="Darts Turnier Dev" <dev@example.com>
```

### Option B: Ethereal Email (Instant Testing)
Automatisch generierte Test-Accounts ohne Registrierung:

```bash
# Code in src/lib/email.ts erweitern:
import nodemailer from 'nodemailer';

if (process.env.NODE_ENV === 'development') {
  const testAccount = await nodemailer.createTestAccount();
  // Verwendet testAccount.user und testAccount.pass
}
```

---

## 🔧 KONFIGURATION TESTEN

Nach dem Setup:

```bash
cd /home/cedric/dartsturnier

# 1. Server neu starten
npm run dev

# 2. Magic Link anfordern
# → http://localhost:3000/login
# → E-Mail eingeben und absenden

# 3. Logs prüfen
# Terminal sollte zeigen: "Magic Link Email sent to: <email>"

# 4. E-Mail-Inbox prüfen
# → Bei Mailtrap: In Web-Interface schauen
# → Bei echtem Provider: Normale Inbox prüfen
```

---

## ⚠️ HÄUFIGE PROBLEME

### Problem: "Connection refused" / "ETIMEDOUT"
**Lösung:**
- Firewall prüfen (Port 587/465 offen?)
- SMTP_HOST korrekt?
- Bei AWS: SES aus Sandbox-Mode nehmen

### Problem: E-Mails landen im Spam
**Lösung:**
- SPF Record setzen
- DKIM aktivieren (bei Provider)
- DMARC Policy setzen
- Eigene Domain verwenden (nicht @gmail.com als FROM)

### Problem: "Authentication failed"
**Lösung:**
- SMTP_USER und SMTP_PASS nochmal prüfen
- Bei SendGrid: "apikey" als Username verwenden
- API Key neu generieren

---

## 🔐 SECURITY BEST PRACTICES

1. **Niemals .env committen** (ist in .gitignore ✅)
2. **Starke Passwörter** für SMTP verwenden
3. **API Keys regelmäßig rotieren**
4. **Rate Limiting** nutzen (bereits implementiert ✅)
5. **TLS/SSL** immer aktivieren (SMTP_SECURE=true)

---

## 📝 NÄCHSTE SCHRITTE

1. [ ] E-Mail-Provider auswählen (SendGrid empfohlen)
2. [ ] Account erstellen und API Key generieren
3. [ ] `.env` Datei mit echten Credentials aktualisieren
4. [ ] Server neu starten
5. [ ] Magic Link Login testen
6. [ ] Für Produktion: Domain verifizieren und SPF/DKIM einrichten

---

**Erstellt:** 2025-11-26  
**Siehe auch:** SECURITY.md, PRODUCTION_CHECKLIST.md
