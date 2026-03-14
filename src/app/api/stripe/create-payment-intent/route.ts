import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { calculateStripePaymentAmounts, centsToEuro } from '@/lib/stripe-fees';



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, playerName, email } = body;

    if (!tournamentId || !playerName || !email) {
      return NextResponse.json({
        success: false,
        message: 'Fehlende erforderliche Felder'
      }, { status: 400 });
    }

    // Check capacity
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    if (tournament.entryFee <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Für dieses Turnier ist keine Stripe-Zahlung erforderlich'
      }, { status: 400 });
    }

    const activePlayerCount = await prisma.tournamentPlayer.count({
      where: {
        tournamentId: tournamentId,
        status: {
          in: ['REGISTERED', 'CONFIRMED', 'ACTIVE']
        }
      }
    });

    if (activePlayerCount >= tournament.maxPlayers) {
      return NextResponse.json({
        success: false,
        message: 'Turnier ist voll. Bitte aktualisieren Sie die Seite für die Warteliste.'
      }, { status: 400 });
    }

    // Hole Stripe-Schlüssel aus Turnier-Einstellungen
    const tournamentSettings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' }
    });

    if (!tournamentSettings?.stripeEnabled || !tournamentSettings?.stripeSecretKey) {
      return NextResponse.json({
        success: false,
        message: 'Stripe ist nicht konfiguriert'
      }, { status: 500 });
    }

    const stripe = new Stripe(tournamentSettings.stripeSecretKey);
    const amountDetails = calculateStripePaymentAmounts(Math.round(tournament.entryFee * 100));

    // Erstelle Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountDetails.totalAmountCents,
      currency: 'eur',
      metadata: {
        tournamentId,
        playerName,
        email,
        baseAmountCents: String(amountDetails.baseAmountCents),
        feeAmountCents: String(amountDetails.feeAmountCents),
        totalAmountCents: String(amountDetails.totalAmountCents),
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amountDetails: {
        baseAmount: centsToEuro(amountDetails.baseAmountCents),
        feeAmount: centsToEuro(amountDetails.feeAmountCents),
        totalAmount: centsToEuro(amountDetails.totalAmountCents),
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Erstellen des Payment Intents'
    }, { status: 500 });
  }
}
