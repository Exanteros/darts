import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const sortBy = searchParams.get('sortBy') || 'average'; // average, oneEighties, highFinish, etc.

    let whereClause: any = {};

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    // Rangliste basierend auf verschiedenen Kriterien
    const rankings = await prisma.tournamentPlayer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: getOrderByClause(sortBy)
    });

    // Rang berechnen und hinzufügen
    const rankedPlayers = rankings.map((player, index) => ({
      ...player,
      rank: index + 1,
      // Berechne zusätzliche Metriken
      winRate: player.legsPlayed && player.legsPlayed > 0
        ? Math.round((player.legsWon || 0) / player.legsPlayed * 100)
        : 0,
      matchWinRate: player.matchesPlayed && player.matchesPlayed > 0
        ? Math.round((player.matchesWon || 0) / player.matchesPlayed * 100)
        : 0
    }));

    return NextResponse.json({
      success: true,
      rankings: rankedPlayers,
      sortBy
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rangliste' },
      { status: 500 }
    );
  }
}

function getOrderByClause(sortBy: string) {
  switch (sortBy) {
    case 'average':
      return { average: 'desc' as const };
    case 'oneEighties':
      return { oneEighties: 'desc' as const };
    case 'highFinish':
      return { highFinish: 'desc' as const };
    case 'checkoutRate':
      return { checkoutRate: 'desc' as const };
    case 'totalPoints':
      return { totalPoints: 'desc' as const };
    case 'legsWon':
      return { legsWon: 'desc' as const };
    case 'matchesWon':
      return { matchesWon: 'desc' as const };
    case 'prizeMoney':
      return { prizeMoney: 'desc' as const };
    default:
      return { average: 'desc' as const };
  }
}
