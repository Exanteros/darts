import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastGameReset } from '@/lib/websocketBroadcast';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.user.id },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Keine Berechtigung'
        }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    // Finde das aktuelle Turnier
    // Use activeTournamentId from cookie if available
    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;
    
    let tournament = null;

    if (activeTournamentId) {
      tournament = await prisma.tournament.findUnique({
        where: { id: activeTournamentId }
      });
    }

    if (!tournament) {
      tournament = await prisma.tournament.findFirst({
        where: isAdmin ? {} : { id: { in: allowedTournamentIds } },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Kein Turnier gefunden'
      }, { status: 404 });
    }

    // Check access for the specific tournament
    if (!isAdmin && !allowedTournamentIds.includes(tournament.id)) {
      return NextResponse.json({
        success: false,
        message: 'Keine Berechtigung für dieses Turnier'
      }, { status: 403 });
    }

    // Lösche alle Throws von Spielen, die zurückgesetzt werden
    const gamesToReset = await prisma.game.findMany({
      where: {
        tournamentId: tournament.id,
        status: {
          in: ['ACTIVE', 'FINISHED']
        }
      },
      select: { id: true }
    });

    const gameIds = gamesToReset.map(g => g.id);

    if (gameIds.length > 0) {
      await prisma.throw.deleteMany({
        where: {
          gameId: {
            in: gameIds
          }
        }
      });
    }

    // Setze alle ACTIVE und FINISHED Spiele zurück auf WAITING
    const updatedGames = await prisma.game.updateMany({
      where: {
        tournamentId: tournament.id,
        status: {
          in: ['ACTIVE', 'FINISHED']
        }
      },
      data: {
        status: 'WAITING',
        winnerId: null,
        boardId: null,
        player1Legs: 0,
        player2Legs: 0,
        currentLeg: 1
      }
    });

    // Boards werden automatisch durch die Entfernung der boardId in den Games zurückgesetzt
    console.log(`Reset ${updatedGames.count} games to WAITING status`);

    // Broadcast game reset via WebSocket
    broadcastGameReset();

    return NextResponse.json({
      success: true,
      message: `${updatedGames.count} Spiele wurden zurückgesetzt`,
      gamesReset: updatedGames.count
    });
  } catch (error) {
    console.error('Error resetting games:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Zurücksetzen der Spiele',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
