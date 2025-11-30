import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Hole alle Turniere (ohne Authentifizierung)
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: { players: true }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      tournaments: tournaments.map(tournament => ({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        startDate: tournament.startDate.toISOString(),
        maxPlayers: tournament.maxPlayers,
        entryFee: tournament.entryFee,
        status: tournament.status,
        _count: tournament._count
      }))
    });

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Turniere'
    }, { status: 500 });
  }
}
