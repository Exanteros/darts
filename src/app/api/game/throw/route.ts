import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Throw, GameStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Authentifizierung erforderlich'
      }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, playerId, dart1, dart2, dart3, score } = body;

    if (!gameId || !playerId) {
      return NextResponse.json({
        success: false,
        message: 'Spiel-ID und Spieler-ID sind erforderlich'
      }, { status: 400 });
    }

    // Prüfe ob das Spiel existiert und aktiv ist
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: true,
        player2: true
      }
    });

    if (!game) {
      return NextResponse.json({
        success: false,
        message: 'Spiel nicht gefunden'
      }, { status: 404 });
    }

    if (game.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        message: 'Spiel ist nicht aktiv'
      }, { status: 400 });
    }

    // Prüfe ob der Spieler zu diesem Spiel gehört
    if (game.player1Id !== playerId && game.player2Id !== playerId) {
      return NextResponse.json({
        success: false,
        message: 'Spieler gehört nicht zu diesem Spiel'
      }, { status: 403 });
    }

    const throwData = {
      gameId,
      playerId,
      leg: game.currentLeg,
      dart1: dart1 || 0,
      dart2: dart2 || 0,
      dart3: dart3 || 0,
      score: score !== undefined ? score : ((dart1 || 0) + (dart2 || 0) + (dart3 || 0))
    };

    // Create new throw (ALWAYS create, never overwrite)
    const throwResult = await prisma.throw.create({
      data: throwData
    });

    // Berechne neue Legs-Scores
    const allThrows = await prisma.throw.findMany({
      where: { gameId: gameId }
    });

    const player1Throws = allThrows.filter(t => t.playerId === game.player1Id && t.leg === game.currentLeg);
    const player2Throws = allThrows.filter(t => t.playerId === game.player2Id && t.leg === game.currentLeg);

    const player1Score = player1Throws.reduce((sum, t) => sum + t.score, 0);
    const player2Score = player2Throws.reduce((sum, t) => sum + t.score, 0);

    // Prüfe ob ein Spieler gewonnen hat
    let winnerId = null;
    let nextLeg = game.currentLeg;

    if (player1Score >= 501 && player2Score >= 501) {
      // Beide haben das Leg beendet - nächstes Leg
      nextLeg = game.currentLeg + 1;
    } else if (player1Score >= 501) {
      // Spieler 1 hat gewonnen
      const newPlayer1Legs = game.player1Legs + 1;
      if (newPlayer1Legs >= game.legsToWin) {
        winnerId = game.player1Id;
      }
    } else if (player2Score >= 501) {
      // Spieler 2 hat gewonnen
      const newPlayer2Legs = game.player2Legs + 1;
      if (newPlayer2Legs >= game.legsToWin) {
        winnerId = game.player2Id;
      }
    }

    // Update game status
    const gameUpdate: {
      currentLeg: number;
      winnerId?: string | null;
      status?: GameStatus;
      finishedAt?: Date;
    } = {
      currentLeg: nextLeg
    };

    if (winnerId) {
      gameUpdate.winnerId = winnerId;
      gameUpdate.status = 'FINISHED';
      gameUpdate.finishedAt = new Date();
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: gameUpdate,
      include: {
        player1: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        player2: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        winner: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Wurf erfolgreich registriert',
      data: {
        throw: throwResult,
        game: updatedGame,
        scores: {
          player1: player1Score,
          player2: player2Score
        }
      }
    });

  } catch (error) {
    console.error('Fehler beim Registrieren des Wurfs:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Registrieren des Wurfs'
    }, { status: 500 });
  }
}
