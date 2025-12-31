import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, playerName, email, amount } = body;

    if (!tournamentId || !playerName || !email) {
      return NextResponse.json({
        success: false,
        message: 'Fehlende erforderliche Felder'
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
       return NextResponse.json({
        success: false,
        message: 'Betrag fehlt'
      }, { status: 400 });
    }

    if (amount <= 0) {
       return NextResponse.json({
        success: false,
        message: 'Betrag muss größer als 0 sein'
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

    // Hole Stripe-Schlüssel aus System-Einstellungen
    const systemSettings = await prisma.systemSettings.findFirst();

    if (!systemSettings?.stripeEnabled || !systemSettings?.stripeSecretKey) {
      return NextResponse.json({
        success: false,
        message: 'Stripe ist nicht konfiguriert'
      }, { status: 500 });
    }

    const stripe = new Stripe(systemSettings.stripeSecretKey);

    // Erstelle Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe erwartet Cent-Beträge
      currency: 'eur',
      metadata: {
        tournamentId,
        playerName,
        email
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Erstellen des Payment Intents'
    }, { status: 500 });
  }
}
