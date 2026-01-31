# 🔴 KRITISCHER SICHERHEITSBERICHT - DARTSTURNIER APP
**Datum:** 25. Januar 2026  
**Analysierte Version:** Current Development Build

---

## ⚠️ KRITISCHE SCHWACHSTELLEN (Severity: CRITICAL)

### 1. **KEINE INPUT-VALIDIERUNG BEI WURF-BEARBEITUNG**
**Datei:** `/src/app/api/game/throw/edit/route.ts`  
**Severity:** 🔴 CRITICAL

```typescript
// GEFAHR: Keine Validierung der Dart-Werte!
dart1: dart1 !== undefined ? dart1 : throwToEdit.dart1,
dart2: dart2 !== undefined ? dart2 : throwToEdit.dart2,
dart3: dart3 !== undefined ? dart3 : throwToEdit.dart3,
score: score !== undefined ? score : throwToEdit.score
```

**Probleme:**
- ❌ Jeder kann beliebige Werte senden (z.B. dart1: 999999)
- ❌ Negative Werte möglich (z.B. dart1: -100)
- ❌ Score kann manipuliert werden (score: 1000000)
- ❌ Keine Überprüfung ob Score = dart1+dart2+dart3
- ❌ Keine Validierung ob Wurf regelkonform ist (Max 180, gültige Werte)

**Exploit-Beispiel:**
```bash
curl -X PUT /api/game/throw/edit \
  -H "x-board-code: ABC123" \
  -d '{"gameId":"xyz","throwIndex":0,"dart1":180,"dart2":180,"dart3":180,"score":540}'
# Spieler hat jetzt 540 Punkte in einem Wurf!
```

**Fix:**
```typescript
// Validierung hinzufügen
if (dart1 !== undefined && (dart1 < 0 || dart1 > 180)) {
  return NextResponse.json({ error: 'Invalid dart1 value' }, { status: 400 });
}
// Prüfe ob Score korrekt ist
const calculatedScore = (dart1 || throwToEdit.dart1) + (dart2 || throwToEdit.dart2) + (dart3 || throwToEdit.dart3);
if (score !== undefined && score !== calculatedScore) {
  return NextResponse.json({ error: 'Score mismatch' }, { status: 400 });
}
// Prüfe ob Dart-Werte regelkonform sind (nur 0-20, 25, 50 oder Vielfache davon)
```

---

### 2. **RACE CONDITION BEI WURF-ERSTELLUNG**
**Datei:** `/src/app/api/game/throw/route.ts`  
**Severity:** 🔴 CRITICAL

```typescript
// GEFAHR: Kein Lock-Mechanismus!
const throwResult = await prisma.throw.create({ data: throwData });
```

**Probleme:**
- ❌ Zwei Spieler können gleichzeitig werfen
- ❌ Doppelte Würfe möglich bei langsamer Verbindung
- ❌ Leg kann zweimal als gewonnen markiert werden
- ❌ Game State kann korrupt werden

**Exploit-Szenario:**
1. Spieler A wirft 180 (würde Leg gewinnen)
2. Request wird 2x schnell hintereinander gesendet
3. Beide Requests passieren die Validierung
4. 2 identische Würfe werden erstellt
5. Score wird doppelt gezählt

**Fix:**
```typescript
// Transaction mit optimistic locking
await prisma.$transaction(async (tx) => {
  const game = await tx.game.findUnique({ where: { id: gameId } });
  // Prüfe Version/Timestamp
  // Erstelle Wurf
  // Update Game
});
```

---

### 3. **BOARD-CODE KANN ERRATEN WERDEN**
**Datei:** `/src/lib/board-auth.ts`  
**Severity:** 🔴 CRITICAL

```typescript
export async function verifyBoardAccess(gameId: string, boardCode: string | null) {
  if (!boardCode) return false;
  // ...
  return game.board.accessCode === boardCode.toUpperCase();
}
```

**Probleme:**
- ❌ Kein Rate-Limiting
- ❌ Kurze Codes sind anfällig für Brute-Force (z.B. "ABC", "A1B2")
- ❌ Keine Sperrung nach fehlgeschlagenen Versuchen
- ❌ Keine IP-basierte Ratenbegrenzung
- ❌ Codes werden in Klartext verglichen (keine Hash-Vergleiche)

**Exploit:**
```python
# Brute Force Script
import requests
for code in ["AAA", "AAB", "AAC", ...]:  # Alle 3-Buchstaben Kombinationen
    response = requests.post("/api/game/throw", 
        headers={"x-board-code": code},
        json={"gameId":"xyz","playerId":"abc","dart1":20})
    if response.status_code != 403:
        print(f"GEFUNDEN: {code}")
```

**Fix:**
- Rate-Limiting implementieren (max 5 Versuche/Minute pro IP)
- Längere, sichere Codes verwenden (min. 12 Zeichen)
- Account Lockout nach 10 fehlgeschlagenen Versuchen
- Audit-Logging für fehlgeschlagene Versuche

---

## 🟠 HOHE SCHWACHSTELLEN (Severity: HIGH)

### 4. **KEINE TRANSAKTIONS-SICHERHEIT**
**Datei:** `/src/app/api/game/throw/edit/route.ts`  
**Severity:** 🟠 HIGH

```typescript
// GEFAHR: Mehrere separate DB-Calls ohne Transaction
const updatedThrow = await prisma.throw.update(...);
const updatedAllThrows = await prisma.throw.findMany(...);
```

**Problem:** 
Wenn Server zwischen den Calls abstürzt, sind Daten inkonsistent.

**Fix:**
```typescript
await prisma.$transaction([
  // Alle Updates in einer Transaction
]);
```

---

### 5. **FEHLENDE CSRF-PROTECTION**
**Datei:** Alle API-Routen  
**Severity:** 🟠 HIGH

**Problem:**
Keine CSRF-Token Validierung für state-changing Operationen.

**Exploit:**
```html
<!-- Angreifer-Website -->
<form action="https://darts-app.de/api/game/reset" method="POST">
  <input name="gameId" value="victim-game-id">
</form>
<script>document.forms[0].submit();</script>
```

**Fix:**
- CSRF-Tokens für alle POST/PUT/DELETE Requests
- SameSite Cookie Attribute setzen

---

### 6. **DEVELOPMENT SECRET IN PRODUKTION**
**Datei:** `.env`  
**Severity:** 🟠 HIGH

```env
NEXTAUTH_SECRET="development-secret-key-do-not-use-in-production"
```

**Problem:**
- ❌ Schwaches Secret
- ❌ Vorhersehbar
- ❌ Im Git-Repository (wenn .env eingecheckt ist)

**Fix:**
```bash
# Generiere starkes Secret
openssl rand -base64 32
# Setze in Umgebungsvariablen, NIEMALS in .env committen
```

---

### 7. **KEINE RATE-LIMITING**
**Alle API-Endpunkte**  
**Severity:** 🟠 HIGH

**Problem:**
Keine Begrenzung der Requests → DDoS-anfällig

**Fix:**
```typescript
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 60000, // 1 Minute
  max: 100 // Max 100 requests
});
```

---

### 8. **FEHLENDE INPUT-SANITIZATION**
**Frontend:** `/src/app/note/scheibe/[code]/page.tsx`  
**Severity:** 🟠 HIGH

**Problem:**
Spielernamen werden nicht sanitized → XSS möglich wenn von DB geladen

**Fix:**
```typescript
import DOMPurify from 'isomorphic-dompurify';
const safeName = DOMPurify.sanitize(playerName);
```

---

## 🟡 MITTLERE SCHWACHSTELLEN (Severity: MEDIUM)

### 9. **KEINE AUDIT-LOGS**
Keine Logging-Mechanismen für kritische Aktionen:
- Wurf-Bearbeitungen
- Game-Resets
- Board-Zugriffe

**Fix:** Audit-Log Tabelle erstellen

---

### 10. **EXPONIERTE INTERNE IDs**
Verwendung von Prisma CUIDs in URLs:
- `/api/game/throw/edit` → gameId ist vorhersehbar
- Enumeration-Angriffe möglich

**Fix:** UUIDs oder zusätzliche Access-Tokens verwenden

---

### 11. **FEHLENDE GAME-STATE VALIDIERUNG**
Bei Wurf-Bearbeitung wird nicht geprüft:
- Ist das Spiel bereits beendet?
- Gehört der Wurf zum richtigen Leg?
- Sind nachfolgende Würfe noch valide?

---

### 12. **KEIN TIMEOUT FÜR BOARDS**
Board-Codes laufen nie ab → Können unbegrenzt verwendet werden

**Fix:** Expiry-Timestamp für Boards

---

## 🔵 NIEDRIGE SCHWACHSTELLEN (Severity: LOW)

### 13. **VERBOSE ERROR MESSAGES**
```typescript
console.error('Fehler beim Bearbeiten des Wurfs:', error);
```
Error-Details werden geloggt → Info-Leakage

---

### 14. **KEINE CONTENT-SECURITY-POLICY**
Fehlende HTTP Security Headers:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options

---

### 15. **WEBSOCKET OHNE AUTHENTICATION**
WebSocket-Verbindungen haben keine explizite Auth-Prüfung

---

## 📊 ZUSAMMENFASSUNG

| Severity | Anzahl | Kritisch? |
|----------|--------|-----------|
| 🔴 CRITICAL | 3 | JA - SOFORT FIXEN! |
| 🟠 HIGH | 6 | JA - Diese Woche |
| 🟡 MEDIUM | 4 | Nächste 2 Wochen |
| 🔵 LOW | 3 | Nice-to-have |

---

## 🚨 SOFORTMASSNAHMEN (Diese Woche!)

1. ✅ **Input-Validierung für Wurf-Edit implementieren**
2. ✅ **Rate-Limiting für Board-Code Versuche**
3. ✅ **Transaktionen für alle DB-Operationen**
4. ✅ **Produktions-Secret ändern**
5. ✅ **CSRF-Protection aktivieren**

---

## 🛡️ EMPFOHLENE SECURITY-LIBRARIES

```bash
npm install helmet express-rate-limit joi validator csrf dompurify
```

---

**⚠️ DISCLAIMER:** Dies ist eine Sicherheitsanalyse. Die aufgeführten Schwachstellen sollten NICHT ausgenutzt werden. Dieser Report dient ausschließlich zur Verbesserung der Anwendungssicherheit.
