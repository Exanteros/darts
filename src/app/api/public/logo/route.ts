import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Öffentliche API-Route zum Abrufen des Logos
export async function GET() {
  try {
    // Hole die Tournament-Settings (öffentlich)
    const settings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' },
      select: {
        mainLogo: true,
        sponsorLogos: true
      }
    });

    if (!settings) {
      return NextResponse.json({
        success: true,
        mainLogo: '',
        sponsorLogos: []
      });
    }

    return NextResponse.json({
      success: true,
      mainLogo: (settings as any).mainLogo || '',
      sponsorLogos: (settings as any).sponsorLogos && typeof (settings as any).sponsorLogos === 'string' 
        ? JSON.parse((settings as any).sponsorLogos) 
        : []
    });

  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json({
      success: false,
      mainLogo: '',
      sponsorLogos: []
    }, { status: 500 });
  }
}
