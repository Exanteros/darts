# 🔒 Admin-Sicherheit & Zugriffskontrolle

## Übersicht

Das Admin-Panel ist vollständig gegen unbefugten Zugriff geschützt. Nur Benutzer mit der Rolle `ADMIN` können auf Admin-Funktionen zugreifen.

## Sicherheitsmaßnahmen

### 1. **Middleware-Schutz**
- **Datei:** `middleware.ts`
- **Schutz:** Alle `/admin/*` und `/api/tournament/*` Routen
- **Prüfung:** JWT-Token und `ADMIN`-Rolle
- **Fallback:** Automatische Weiterleitung zu `/login`

### 2. **Serverseitige Authentifizierung**
- **Admin-Layout:** Prüft Session und Rolle vor Rendering
- **API-Routen:** Jede Admin-API prüft explizit `session.user.role === 'ADMIN'`
- **Fehlermeldung:** "Administrator-Berechtigung erforderlich" (HTTP 403)

### 3. **Clientseitige Sicherheit**
- **AdminGuard-Komponente:** Zusätzliche clientseitige Rollenprüfung
- **useAdminCheck-Hook:** Einfache Admin-Status-Prüfung in Komponenten
- **Automatische Weiterleitung:** Bei fehlender Berechtigung

### 4. **API-Endpunkt-Schutz**
Alle folgenden API-Routen sind Admin-only:
- `/api/tournament/*` - Turnier-Management
- `/api/logs/*` - Logging-System
- `/api/admin/check` - Admin-Status-Prüfung

## Zugriffsrechte-Matrix

| Funktion | Admin | User | Gast |
|----------|-------|------|------|
| Admin-Dashboard | ✅ | ❌ | ❌ |
| Turnier-Erstellung | ✅ | ❌ | ❌ |
| Spieler-Verwaltung | ✅ | ❌ | ❌ |
| Live-Monitoring | ✅ | ❌ | ❌ |
| Logs & Fehler | ✅ | ❌ | ❌ |
| Turnier-Anmeldung | ❌ | ✅ | ✅ |
| Spieler-Registrierung | ❌ | ✅ | ✅ |

## Admin-Benutzer-Erstellung

```bash
# Seed-Script ausführen für Admin-Benutzer
npm run db:seed

# Admin-Zugangsdaten:
# E-Mail: admin@dartsturnier.de
# Passwort: admin123
```

## Sicherheits-Features

### 🔐 **Mehrschichtige Authentifizierung**
1. **JWT-Token-Verifikation**
2. **Session-basierte Rollenprüfung**
3. **Middleware-Level-Schutz**
4. **Clientseitige Validierung**

### 🚫 **Zugriffsverweigerung**
- **HTTP 401:** Nicht authentifiziert
- **HTTP 403:** Nicht autorisiert (keine Admin-Rolle)
- **Automatische Weiterleitung** zu Login-Seite

### 📊 **Audit-Logging**
- Alle Admin-Aktionen werden geloggt
- Fehler und Warnungen werden zentral gespeichert
- Admin-Logs sind nur für Administratoren zugänglich

## Best Practices

### Für Entwickler:
1. **Immer Admin-Rolle prüfen** in neuen Admin-API-Routen
2. **AdminGuard verwenden** für neue Admin-Seiten
3. **useAdminCheck-Hook** für clientseitige Prüfungen
4. **Fehlerbehandlung** mit entsprechenden HTTP-Statuscodes

### Für Administratoren:
1. **Starke Passwörter** verwenden
2. **Sitzungen regelmäßig beenden**
3. **Verdächtige Aktivitäten** im Log überwachen
4. **Regelmäßige Sicherheitsprüfungen** durchführen

## Notfall-Zugriff

Bei Problemen mit dem Admin-Zugang:
1. Datenbank direkt prüfen: `User.role === 'ADMIN'`
2. Seed-Script erneut ausführen
3. Bei technischen Problemen: Support kontaktieren

---

**Sicherheit hat höchste Priorität!** 🔒
