import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Hole Stripe-Konfiguration
    const systemSettings = await prisma.systemSettings.findFirst();

    if (!systemSettings?.stripeEnabled || !systemSettings?.stripeSecretKey || !systemSettings?.stripeWebhookSecret) {
      return NextResponse.json({
        success: false,
        message: 'Stripe ist nicht vollständig konfiguriert'
      }, { status: 500 });
    }

    const stripe = new Stripe(decrypt(systemSettings.stripeSecretKey));

    // Hole Raw Body für Signature Verification
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({
        success: false,
        message: 'Keine Stripe-Signatur gefunden'
      }, { status: 400 });
    }

    let event: Stripe.Event;

    // Verifiziere Webhook-Signatur
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        decrypt(systemSettings.stripeWebhookSecret)
      );
    } catch (err: any) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return NextResponse.json({
        success: false,
        message: `Webhook Error: ${err.message}`
      }, { status: 400 });
    }

    // Handle verschiedene Event-Typen
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);

        // Extrahiere Metadaten
        const { tournamentId, playerName, email } = paymentIntent.metadata;

        if (!tournamentId || !playerName || !email) {
          console.error('❌ Fehlende Metadaten in PaymentIntent:', paymentIntent.id);
          break;
        }

        // Suche oder erstelle User
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (!user) {
          // Erstelle neuen User wenn nicht vorhanden
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: playerName,
              password: '', // Kein Passwort bei Stripe-Registrierung
              role: 'USER'
            }
          });
          console.log('✅ Neuer User erstellt:', user.id);
        }

        // Prüfe ob Spieler bereits registriert ist
        const existingPlayer = await prisma.tournamentPlayer.findFirst({
          where: {
            tournamentId,
            userId: user.id
          }
        });

        if (existingPlayer) {
          console.log('⚠️  Spieler bereits registriert:', existingPlayer.id);
          break;
        }

        // Erstelle TournamentPlayer
        const tournamentPlayer = await prisma.tournamentPlayer.create({
          data: {
            tournamentId,
            userId: user.id,
            playerName,
            registrationDate: new Date(),
            paymentStatus: 'PAID',
            paymentMethod: 'STRIPE',
            stripePaymentIntentId: paymentIntent.id
          }
        });

        console.log('✅ Spieler registriert:', tournamentPlayer.id);

        // Optional: Sende Bestätigungs-E-Mail
        // TODO: Implementiere E-Mail-Versand

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', paymentIntent.id);
        
        // Optional: Benachrichtige Admin oder User
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Refund processed:', charge.id);

        // Suche TournamentPlayer mit dieser PaymentIntent
        const paymentIntentId = charge.payment_intent as string;
        
        const player = await prisma.tournamentPlayer.findFirst({
          where: {
            stripePaymentIntentId: paymentIntentId
          }
        });

        if (player) {
          // Setze Payment Status auf REFUNDED
          await prisma.tournamentPlayer.update({
            where: { id: player.id },
            data: {
              paymentStatus: 'REFUNDED'
            }
          });
          console.log('✅ Player status updated to REFUNDED:', player.id);
        }

        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    // Bestätige Receipt des Webhooks
    return NextResponse.json({ 
      success: true, 
      received: true 
    });

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// Webhook muss POST sein und Raw Body unterstützen
export const runtime = 'nodejs';
