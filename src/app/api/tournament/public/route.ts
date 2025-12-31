import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Hole alle Turniere (ohne Authentifizierung)
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        startDate: 'asc'
      }
    });

    const tournamentsWithCounts = await Promise.all(tournaments.map(async (tournament) => {
      const activeCount = await prisma.tournamentPlayer.count({
        where: {
          tournamentId: tournament.id,
          status: {
            in: ['REGISTERED', 'CONFIRMED', 'ACTIVE']
          }
        }
      });

      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        startDate: tournament.startDate.toISOString(),
        maxPlayers: tournament.maxPlayers,
        entryFee: tournament.entryFee,
        location: tournament.location,
        street: tournament.street,
        status: tournament.status,
        _count: {
          players: activeCount
        }
      };
    }));

    return NextResponse.json({
      success: true,
      tournaments: tournamentsWithCounts
    });

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Turniere'
    }, { status: 500 });
  }
}
