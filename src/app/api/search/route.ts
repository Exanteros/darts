import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.toLowerCase();

    // Suche in Spielern
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        playerName: {
          contains: searchTerm,
        },
      },
      include: {
        tournament: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    // Suche in Turnieren
    const tournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
            },
          },
          {
            description: {
              contains: searchTerm,
            },
          },
        ],
      },
      take: 5,
    });

    // Ergebnisse formatieren
    const results = [
      ...players.map(player => ({
        type: 'player' as const,
        title: player.playerName,
        description: `Turnier: ${player.tournament.name} • Seed: ${player.seed || 'N/A'}`,
        url: `/dashboard/players?search=${encodeURIComponent(player.playerName)}`,
      })),
      ...tournaments.map(tournament => ({
        type: 'tournament' as const,
        title: tournament.name,
        description: tournament.description || 'Kein Beschreibung verfügbar',
        url: `/dashboard/tournament`,
      })),
    ];

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Suche' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
