import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastGameReset } from '@/lib/websocketBroadcast';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    // Finde das aktuelle Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Kein Turnier gefunden'
      }, { status: 404 });
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
