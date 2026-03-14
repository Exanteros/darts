import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const tournamentSettings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' }
    });

    if (!tournamentSettings?.stripeEnabled || !tournamentSettings?.stripePublishableKey) {
      return NextResponse.json({
        success: false,
        message: 'Stripe ist nicht konfiguriert'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stripeEnabled: tournamentSettings.stripeEnabled,
      stripePublishableKey: tournamentSettings.stripePublishableKey
    });

  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Stripe-Konfiguration'
    }, { status: 500 });
  }
}
