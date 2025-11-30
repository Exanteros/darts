# 💳 STRIPE PAYMENT INTEGRATION - SETUP GUIDE

## 📋 ÜBERSICHT

Die Stripe-Integration ermöglicht es Teilnehmern, direkt über die Turnier-Registrierungsseite zu bezahlen.

**Status:** ✅ Vollständig implementiert

**Komponenten:**
- ✅ Stripe Dashboard-Konfiguration (`/dashboard/tournament`)
- ✅ Webhook-Handler (`/api/stripe/webhook`)
- ✅ Payment Intent API (`/api/stripe/create-payment-intent`)
- ✅ Frontend Payment Component (`TournamentPayment.tsx`)
- ✅ Registrierungsseite (`/tournament/register`)
- ✅ Datenbank-Schema mit Payment-Feldern

---

## 🚀 SETUP SCHRITTE

### 1. Stripe Account erstellen

1. Gehe zu [https://stripe.com](https://stripe.com)
2. Erstelle einen Account
3. Verifiziere deine E-Mail

### 2. API Keys erhalten

#### Test Mode (Entwicklung):
1. Dashboard → Developers → API Keys
2. Kopiere:
   - **Publishable key** (beginnt mit `pk_test_...`)
   - **Secret key** (beginnt mit `sk_test_...`)

#### Live Mode (Produktion):
1. Aktiviere deinen Account vollständig
2. Schalte auf "Live mode" um
3. Kopiere:
   - **Publishable key** (beginnt mit `pk_live_...`)
   - **Secret key** (beginnt mit `sk_live_...`)

### 3. Webhook einrichten

1. Dashboard → Developers → Webhooks → Add endpoint
2. **Endpoint URL:** `https://deine-domain.de/api/stripe/webhook`
3. **Events auswählen:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Webhook-Secret kopieren (beginnt mit `whsec_...`)

### 4. Keys im Dashboard konfigurieren

1. Gehe zu `/dashboard/tournament`
2. Scrolle zu "Stripe-Zahlungen"
3. Aktiviere den Toggle "Stripe-Zahlungen aktivieren"
4. Fülle die Felder aus:
   ```
   Publishable Key: pk_test_xxxxx
   Secret Key:      sk_test_xxxxx
   Webhook Secret:  whsec_xxxxx
   ```
5. Klicke auf "Stripe-Einstellungen speichern"

---

## 🧪 TESTING (Lokale Entwicklung)

### Stripe CLI installieren

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Webhook-Forwarding einrichten

```bash
# 1. Stripe CLI authentifizieren
stripe login

# 2. Webhook forwarding starten
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Output zeigt Webhook-Secret: whsec_xxxxx
# Diesen Secret im Dashboard eintragen!
```

### Test-Kreditkarten

Verwende diese Test-Kartennummern:

| Szenario | Kartennummer | CVV | Ablaufdatum |
|----------|--------------|-----|-------------|
| ✅ Erfolg | 4242 4242 4242 4242 | 123 | 12/34 |
| ❌ Abgelehnt | 4000 0000 0000 0002 | 123 | 12/34 |
| ⏳ 3D Secure | 4000 0027 6000 3184 | 123 | 12/34 |

### Test-Ablauf

1. **Server starten:**
   ```bash
   npm run dev
   ```

2. **Webhook-Forwarding (in separatem Terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Registrierung testen:**
   - Gehe zu `http://localhost:3000/tournament/register`
   - Fülle Formular aus
   - Verwende Test-Karte `4242 4242 4242 4242`
   - Zahlung sollte erfolgreich sein

4. **Webhook-Logs prüfen:**
   ```bash
   # Terminal mit stripe listen zeigt Webhook-Events
   ✅ payment_intent.succeeded
   ```

5. **Datenbank prüfen:**
   ```bash
   npx prisma studio
   # → TournamentPlayer Tabelle
   # → paymentStatus sollte "PAID" sein
   # → stripePaymentIntentId sollte gesetzt sein
   ```

---

## 📊 DATENBANK SCHEMA

```prisma
model TournamentPlayer {
  // ... andere Felder ...
  
  // Payment-Felder
  registrationDate      DateTime?
  paymentStatus         String?   // PENDING, PAID, FAILED, REFUNDED
  paymentMethod         String?   // STRIPE, CASH, FREE
  stripePaymentIntentId String?   @unique
}
```

---

## 🔄 WEBHOOK EVENTS

Der Webhook-Handler (`/api/stripe/webhook`) behandelt:

### 1. `payment_intent.succeeded`
- Erstellt oder findet User anhand E-Mail
- Erstellt `TournamentPlayer` Eintrag
- Setzt `paymentStatus = 'PAID'`
- Speichert `stripePaymentIntentId`

### 2. `payment_intent.payment_failed`
- Loggt Fehler
- Optional: Benachrichtige Admin

### 3. `charge.refunded`
- Findet `TournamentPlayer` mit PaymentIntent ID
- Setzt `paymentStatus = 'REFUNDED'`

---

## 🔐 SECURITY FEATURES

1. **Webhook Signature Verification:**
   ```typescript
   stripe.webhooks.constructEvent(body, signature, webhookSecret)
   ```

2. **Idempotenz:**
   - Prüft ob Spieler bereits registriert
   - Verhindert doppelte Registrierungen

3. **Atomic Operations:**
   - Verwendet Prisma Transactions
   - Sicher bei gleichzeitigen Webhooks

---

## 💰 ZAHLUNGSABLAUF

```
1. User füllt Formular aus (/tournament/register)
   ↓
2. Frontend: POST /api/stripe/create-payment-intent
   → Erstellt PaymentIntent in Stripe
   → Gibt clientSecret zurück
   ↓
3. Stripe Payment Element
   → User gibt Kartendaten ein
   → Frontend bestätigt Payment
   ↓
4. Stripe sendet Webhook: payment_intent.succeeded
   ↓
5. Backend (/api/stripe/webhook)
   → Erstellt User (falls neu)
   → Registriert Spieler im Turnier
   → Setzt paymentStatus = "PAID"
   ↓
6. Frontend zeigt Erfolg
   → Redirect zu /tournament/registration/success
```

---

## 🛠️ API ENDPOINTS

### POST `/api/stripe/create-payment-intent`
Erstellt PaymentIntent für Turnier-Registrierung.

**Request:**
```json
{
  "tournamentId": "clxxx",
  "playerName": "Max Mustermann",
  "email": "max@example.com",
  "amount": 25.00
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### POST `/api/stripe/webhook`
Empfängt Stripe Webhook Events.

**Headers:**
```
stripe-signature: t=xxx,v1=xxx
```

**Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

### GET `/api/stripe/config`
Gibt Publishable Key für Frontend.

**Response:**
```json
{
  "success": true,
  "stripeEnabled": true,
  "stripePublishableKey": "pk_test_xxx"
}
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Stripe ist nicht konfiguriert"

**Lösung:**
1. Prüfe Dashboard: Stripe-Toggle aktiviert?
2. Alle 3 Keys eingetragen?
3. Keys mit korrektem Prefix?
   - Publishable: `pk_test_` oder `pk_live_`
   - Secret: `sk_test_` oder `sk_live_`
   - Webhook: `whsec_`

### Problem: Webhook kommt nicht an

**Lösung (Lokal):**
```bash
# Stripe CLI Forwarding prüfen
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Logs prüfen
tail -f .next/trace
```

**Lösung (Produktion):**
1. Webhook-URL korrekt: `https://domain.de/api/stripe/webhook`?
2. SSL-Zertifikat gültig?
3. Server erreichbar?
4. Stripe Dashboard → Webhooks → Event Log prüfen

### Problem: Payment schlägt fehl

**Lösung:**
1. Browser-Console auf Fehler prüfen
2. Network Tab: Welche API fehlgeschlagen?
3. Server-Logs prüfen
4. Stripe Dashboard → Payments → Details ansehen

### Problem: User wird nicht registriert

**Lösung:**
1. Webhook in Stripe Dashboard prüfen:
   - Events → Details → Response anschauen
2. Server-Logs nach Fehler durchsuchen:
   ```bash
   # Im Terminal mit npm run dev
   ```
3. Datenbank prüfen:
   ```bash
   npx prisma studio
   # TournamentPlayer Tabelle checken
   ```

---

## 📈 PRODUKTION CHECKLIST

- [ ] **Live Keys verwenden** (`pk_live_`, `sk_live_`)
- [ ] **Webhook URL auf Production** setzen
- [ ] **HTTPS aktiviert** (Stripe erfordert HTTPS)
- [ ] **Webhook-Signatur-Verifizierung** aktiv
- [ ] **Error Monitoring** einrichten (Sentry)
- [ ] **Payment Logs** implementieren
- [ ] **E-Mail-Benachrichtigungen** für erfolgreiche Zahlungen
- [ ] **Refund-Policy** definieren
- [ ] **Support-E-Mail** hinterlegen
- [ ] **Stripe-Gebühren** berücksichtigen (ca. 1,4% + 0,25€)
- [ ] **Impressum & Datenschutz** auf Registrierungsseite

---

## 💡 BEST PRACTICES

1. **Test Mode zuerst:**
   - Immer erst mit Test-Keys entwickeln
   - Erst nach erfolgreichem Testing auf Live umstellen

2. **Webhook-Logs:**
   - Alle Webhook-Events loggen
   - Bei Fehler Admin benachrichtigen

3. **Idempotenz:**
   - Webhook kann mehrfach gesendet werden
   - Immer prüfen ob Spieler bereits registriert

4. **Error Handling:**
   - Alle Stripe-API-Calls in try-catch
   - User-freundliche Fehlermeldungen

5. **Security:**
   - Secret Key **NIEMALS** im Frontend
   - Nur Publishable Key im Frontend
   - Webhook-Signatur **IMMER** verifizieren

---

## 📚 WEITERE RESSOURCEN

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)

---

**Erstellt:** 26. November 2025  
**Status:** ✅ Production Ready
