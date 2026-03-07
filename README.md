# 🎯 Darts Tournament Management System

**Professional Tournament Management Software**  
**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL/SQLite  

**Dart Masters Puschendorf**

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:migrate

# Start everything (web, websocket & mail listener)
npm run dev:all
```

> ⚠️ **Important:** the admin inbox and auto‑reply system only work when the mail listener is running.  
> The CLI script (`scripts/mail-listener.ts`) polls the IMAP account every few seconds and triggers the
> AI response logic. In production this process is launched automatically via `start.sh`, but during
> local development you must either run `npm run mail:listen` in a separate terminal or use the
> updated `dev:all` script above. Without it you will only see new messages after refreshing the
> admin portal (because the sync is otherwise triggered only by the `/api/mail/inbox` endpoint).

### Production
```bash
# build and run via Docker or start.sh, the mail listener is already started there
```

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Production Server Setup

Für die Einrichtung auf einem neuen Server stehen drei Optionen zur Verfügung:

#### Option 1: 100% Automatisch (Empfohlen für Anfänger)
```bash
# Vollautomatisches Setup - nur Domain angeben!
./full-setup.sh yourdomain.com

# Das war's! Admin-User wird automatisch erstellt.
# Besuche https://yourdomain.com und melde dich an.
```

#### Option 2: Schnell-Setup (Für erfahrene Admins)
```bash
# Minimal Output, maximale Automation
./quick-setup.sh yourdomain.com
```

#### Option 3: Schritt-für-Schritt-Anleitung
```bash
# Für volle Kontrolle und Anpassungen
./setup-server.sh  # Grundinstallation
cat SERVER_SETUP.md  # Vollständige Anleitung folgen
```

### Nach der Installation

```bash
# Health Check durchführen
./health-check.sh

# Backup erstellen
./backup.sh

# Services verwalten
cd /home/ubuntu/dartsturnier
docker-compose logs -f    # Logs anzeigen
docker-compose restart    # Neustarten

# Updates durchführen (sicher mit Backup)
./update.sh
```

## 📚 Documentation

- [Server Setup Guide](SERVER_SETUP.md) - Komplette Server-Einrichtung von Grund auf
- [Docker Deployment](DOCKER.md) - Docker-basierte Installation und Verwaltung
- [Deployment Guide](DEPLOYMENT.md) - Allgemeine Production-Deployment-Instruktionen
- [Admin Security](ADMIN_SECURITY.md) - Admin-Authentifizierung und Sicherheit
- [SMTP Setup](SMTP_SETUP.md) - E-Mail-Konfiguration
- [Stripe Setup](STRIPE_SETUP.md) - Zahlungsabwicklung-Integration
- [Production Checklist](PRODUCTION_CHECKLIST.md) - Vorab-Deployment-Checkliste

---

---

## 🏗️ System-Architektur

### Datenbank (SQLite)
- [ ] **Spieler-Tabelle** - ID, Name, Anmeldung, Gebühren
- [ ] **Turnier-Tabelle** - Einstellungen, Status, Aktuelle Runde
- [ ] **Spiele-Tabelle** - Spieler1, Spieler2, Scheiben-ID, Status, Gewinner
- [ ] **Würfe-Tabelle** - Spiel-ID, Spieler-ID, Dart1, Dart2, Dart3, Leg, Score
- [ ] **Statistik-Tabelle** - Aggregierte Spieler-Stats Cache

### URL-Struktur
- [ ] **iPad Eingabe:** `/note/scheibe/[scheibenID]`
- [ ] **Monitor Anzeige:** `/display/scheibe/[scheibenID]`
- [ ] **Admin Panel:** `/admin/tournament`
- [ ] **Turnierbaum:** `/tournament/bracket`

---

## 🎮 Grundlegende Features

### 1. Spieler-Anmeldung & Gebührenverwaltung
- [ ] Spielername-Eingabe-Formular
- [ ] Automatische Gebührenberechnung basierend auf Turnier-Einstellungen
- [ ] Spielerlisten-Verwaltung
- [ ] Anmeldestatus-Tracking

### 2. Shootout & Setzlisten-System
- [ ] 3-Dart-Shootout-Interface für alle 64 Spieler
- [ ] Automatisches Ranking (#1 höchste Punkte → #64 niedrigste Punkte)
- [ ] Setzlisten-Algorithmus: #1 vs #64, #2 vs #63, etc.
- [ ] Turnierbaum-Generierung mit Sicherstellung: #1 trifft #2 frühestens im Finale

### 3. Turnierbaum-Verwaltung
- [ ] Interaktiver 64-Spieler Single-Elimination Turnierbaum
- [ ] Dynamisches Scheiben-Zuordnungssystem
- [ ] Spiele-Planungsalgorithmus
- [ ] "Drag & Drop" Spiel-Zuordnung zu Scheiben (Admin)

### 4. Spiel-Konfiguration
- [ ] **Spielmodus:** Nur 501
- [ ] **Leg-Einstellungen:** 
  - Runden 1-3: First to 2 Legs
  - Halbfinale aufwärts: First to 3 Legs
- [ ] Admin-Panel zur Änderung der Leg-Anforderungen pro Runde

### 5. Live-Punktesystem

#### iPad Eingabe-Interface (`/note/scheibe/[ID]`)
- [ ] Touch-optimierte Dart-Eingabe (Punkte pro Dart)
- [ ] Aktueller Spieler-Hinweis
- [ ] Leg/Spiel-Status-Anzeige
- [ ] Letzten Wurf rückgängig machen / bearbeiten
- [ ] Finish-Vorschläge
- [ ] Bust-Erkennung und -Behandlung

#### Monitor Anzeige (`/display/scheibe/[ID]`)
- [ ] Sauberes Scoreboard-Layout (OBS-ready)
- [ ] Spielernamen und aktuelle Punktestände
- [ ] Leg-Indikatoren und Match-Status
- [ ] "Wartet auf neues Spiel"-Zustand
- [ ] Automatischer Spiel-Übergang

### 6. Echtzeit-Datensynchronisation
- [ ] WebSocket-Verbindungen für Live-Updates
- [ ] Optimierter Datentransfer (minimale Bandbreite)
- [ ] Status-Synchronisation zwischen iPad ↔ Monitor
- [ ] Verbindungswiederherstellung

---

## 📊 Statistiken & Analysen

### Pro Spieler Statistiken
- [ ] **Durchschnitte:** Pro Dart, pro Leg, pro Spiel
- [ ] **Finishes:** Checkout-Prozentsatz, höchstes Finish
- [ ] **Würfe:** 180er, 140+, 100+ Anzahl
- [ ] **Performance:** Darts pro Leg Durchschnitt
- [ ] **Turnier-Verlauf:** Siege/Niederlagen pro Runde

### Pro Spiel Statistiken  
- [ ] Leg-für-Leg Aufschlüsselung
- [ ] Dart-Anzahl pro Leg
- [ ] Wurf-Muster
- [ ] Spieldauer-Tracking

### Turnier-Übersicht
- [ ] Live-Leaderboards
- [ ] Turnier-Highlights (höchster Durchschnitt, meiste 180er)
- [ ] Echtzeit-Turnierbaum-Status
- [ ] Export-Funktionen (CSV/JSON)

---

## 🎛️ Admin-Kontrollpanel

### Turnier-Verwaltung
- [ ] Turnier-Erstellung und -Einstellungen
- [ ] Spieler-Verwaltung (hinzufügen/entfernen/bearbeiten)
- [ ] Runden-Konfiguration (Leg-Anforderungen)
- [ ] Scheiben-Zuordnungs-Interface

### Intelligentes Scheiben-Zuordnungssystem
- [ ] **Automatischer Planungsalgorithmus:**
  - **Scheibe 1 Priorität:** Spannendste Spiele (Finale, Halbfinale, Top-Gesetzte)
  - **Runde-für-Runde Abarbeitung:** Komplett Runde 1 → Runde 2 → etc.
  - **Spieler-Cooldown:** Mindest-Pausenzeit zwischen Spielen
  - **Turnierbaum-Effizienz:** Optimaler Spielfluss
- [ ] **Scheiben-Hierarchie:**
  - **Scheibe 1:** Haupt-Broadcast-Scheibe (hallenweites Streaming)
  - **Scheiben 2-X:** Reguläre Turnier-Scheiben
  - **Algorithmus priorisiert** hoch gesetzte Spieler und spätere Runden für Scheibe 1
- [ ] **Manuelle Eingriffsmöglichkeiten:**
  - Drag-and-Drop Spiel-Neuzuordnung
  - Bestimmte Scheiben anhalten/pausieren
  - Bestimmte Matchups forciert zuordnen
  - Scheiben-Priorität anpassen
- [ ] **Visuelles Verwaltungs-Interface:**
  - Echtzeit-Scheiben-Status-Indikatoren
  - Spiele-Warteschlangen-Vorschau (nächste 5 Spiele)
  - Scheibe 1 spezielle Hervorhebung
  - Manuelle Spiel-Fortschritts-Kontrolle

### Live-Überwachung
- [ ] Alle Scheiben Status-Übersicht
- [ ] Spiel-Fortschritts-Tracking
- [ ] Fehler-Logging und -Warnungen
- [ ] Verbindungsstatus-Überwachung

---

## 🖥️ Anzeige & Broadcasting

### OBS-Integration
- [ ] IFRAME-kompatible Anzeige-Seiten
- [ ] Saubere, professionelle Turnier-Grafiken
- [ ] Anpassbare Overlay-Elemente
- [ ] Vollbild-optimierte Layouts

### Scheiben-spezifische Anzeigen
- [ ] Dynamischer Inhalt basierend auf Spiel-Zuordnung
- [ ] Sanfte Übergänge zwischen Spielen
- [ ] Klare "Warte"-Zustände
- [ ] Fehlerbehandlung

---

## ⚡ Performance & Zuverlässigkeit

### Optimierung
- [ ] Minimale Bandbreitennutzung
- [ ] Effiziente WebSocket-Nachrichten
- [ ] SQLite-Query-Optimierung
- [ ] Client-seitiges Caching

### Fehlerbehandlung
- [ ] Verbindungsverlust-Wiederherstellung
- [ ] Datenvalidierung und -bereinigung
- [ ] Würdevolle Verschlechterung
- [ ] Admin-Override-Funktionen

---

## 🔧 Technische Umsetzung

### API-Endpunkte
```
POST /api/tournament/create
GET  /api/tournament/[id]/status
POST /api/game/assign-board
POST /api/game/throw
GET  /api/stats/player/[id]
WS   /api/ws/board/[id]
```

### Datenbank-Schema Highlights
```sql
-- Spiele-Tabelle mit Scheiben-Zuordnung
CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  tournament_id INTEGER,
  player1_id INTEGER,
  player2_id INTEGER,
  board_id INTEGER,
  round INTEGER,
  legs_to_win INTEGER,
  status TEXT, -- 'waiting', 'active', 'finished'
  winner_id INTEGER
);
```

### Komponenten-Struktur
```
├── pages/
│   ├── note/scheibe/[id].js     # iPad Eingabe
│   ├── display/scheibe/[id].js  # Monitor Anzeige  
│   └── admin/tournament.js      # Kontrollpanel
├── components/
│   ├── ScoreEntry.js           # Dart-Eingabe Interface
│   ├── Scoreboard.js           # Anzeige-Komponente
│   └── BracketView.js          # Turnierbaum
└── hooks/
    ├── useWebSocket.js         # Echtzeit-Sync
    └── useGameState.js         # Spiel-Logik
```

---

## ✅ Erfolgskriterien
- [ ] Unter 100ms Eingabe-zu-Anzeige-Latenz
- [ ] Null Datenverlust während Spielen
- [ ] Intuitive Bedienung für Turnier-Personal
- [ ] Professionelle Broadcast-Qualität Anzeigen
- [ ] Stabile Funktionsweise für 8+ Stunden Turniere

---

## 🚀 Entwicklungsplan
- **November:** Kern-Entwicklung & Testing
- **Dezember:** Final-Polish & Deployment
- **Januar:** Live-Testing & Bugfixes
- **Februar:** Turnier ready! 🎉

## 📧 SMTP / Mail-Provider Konfiguration

Das Projekt unterstützt den Versand von E-Mails via SMTP (z. B. Postfix, Mailgun SMTP oder ein SMTP Relay). Konfiguriere die folgenden Umgebungsvariablen entweder in `.env` oder über dein Hosting:

 - `SMTP_LOGO_URL` - Optionale URL zum Firmen-/Event-Logo, das in HTML-Mails angezeigt wird

Es gibt einen Admin API-Endpunkt zum Testen der SMTP-Konfiguration:

- POST `/api/admin/mail/test` - Body: `{ "to": "empfaenger@example.com" }` (Admin-Session erforderlich)

Außerdem wird der Admin-Mail-Send-Endpoint (`/api/admin/mail/send`) nun tatsächlich SMTP für den Versand verwenden; falls keine SMTP-Config vorhanden ist, fällt das System auf Simulation zurück und loggt die E-Mails in der Server-Konsole.

Sicherheit: Halte SMTP-Zugangsdaten vertraulich und verwende Umgebungsvariablen für Produktions-Deployments.

Lokales Testen:

1) Setze die Umgebungsvariablen (am einfachsten in `.env.local`) und starte die Next.js-Entwicklung:

```bash
# Beispiel .env.local
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=foo
SMTP_PASS=bar
SMTP_FROM="Darts Turnier" <noreply@example.com>
# Optional
SMTP_TEST_TO=deine.email@example.com

npm run dev
```

2) oder nutze das mitgelieferte Test-Skript (falls du `npm`/`node` installiert hast):

```bash
npx tsx scripts/send-test-mail.ts deine.email@example.com
```

Das Skript verwendet die SMTP-Konfiguration, falls vorhanden, oder fällt auf die Simulation (Console-Logging) zurück.

- Algorithmus predict Single CheckOUT / Double was wird benötigt
