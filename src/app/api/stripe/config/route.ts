import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const systemSettings = await prisma.systemSettings.findFirst();

    if (!systemSettings?.stripeEnabled || !systemSettings?.stripePublishableKey) {
      return NextResponse.json({
        success: false,
        message: 'Stripe ist nicht konfiguriert'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stripeEnabled: systemSettings.stripeEnabled,
      stripePublishableKey: systemSettings.stripePublishableKey
    });

  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Stripe-Konfiguration'
    }, { status: 500 });
  }
}
