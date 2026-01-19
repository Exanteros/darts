import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.user.id },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    // Get active tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        ...(isAdmin ? {} : { id: { in: allowedTournamentIds } }),
        status: {
          in: ['UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'SHOOTOUT', 'ACTIVE']
        }
      },
      orderBy: { startDate: 'desc' }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'No active tournament found' }, { status: 404 });
    }

    // Get all registered players (excluding withdrawn and waiting list)
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        tournamentId: tournament.id,
        status: {
          notIn: ['WITHDRAWN', 'WAITING_LIST']
        }
      },
      select: {
        id: true,
        seed: true,
        shootoutResults: {
          select: {
            id: true
          }
        }
      }
    });

    const totalPlayers = players.length;
    const playersWithShootout = players.filter(p => p.shootoutResults.length > 0).length;
    const allCompleted = totalPlayers > 0 && totalPlayers === playersWithShootout;

    return NextResponse.json({
      totalPlayers,
      playersWithShootout,
      allCompleted,
      tournamentId: tournament.id
    });

  } catch (error) {
    console.error('Error checking shootout status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
