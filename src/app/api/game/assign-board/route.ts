import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendRoundNotificationEmail } from '@/lib/mail-events';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const body = await request.json();
    const { gameId, boardId } = body;

    if (!gameId || !boardId) {
      return NextResponse.json({
        success: false,
        message: 'Spiel-ID und Scheiben-ID sind erforderlich'
      }, { status: 400 });
    }

    // Prüfe ob das Spiel existiert und aktiv ist
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        board: true,
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

    // Prüfe ob die Scheibe existiert und aktiv ist
    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board || !board.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Scheibe nicht gefunden oder nicht aktiv'
      }, { status: 404 });
    }

    // Weise das Spiel der Scheibe zu
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        boardId: boardId,
        status: 'ACTIVE',
        startedAt: new Date()
      },
      include: {
        board: true,
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
        }
      }
    });

    // Sende Round Notification Emails an beide Spieler
    if (updatedGame.player1 && updatedGame.player2) {
      const player1User = await prisma.user.findFirst({
        where: { tournamentPlayers: { some: { id: updatedGame.player1.id } } }
      });
      const player2User = await prisma.user.findFirst({
        where: { tournamentPlayers: { some: { id: updatedGame.player2.id } } }
      });

      if (player1User?.email) {
        sendRoundNotificationEmail(
          player1User.email,
          game.round,
          updatedGame.player2.playerName,
          board.name,
          'in Kürze'
        );
      }

      if (player2User?.email) {
        sendRoundNotificationEmail(
          player2User.email,
          game.round,
          updatedGame.player1.playerName,
          board.name,
          'in Kürze'
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Spiel erfolgreich zugewiesen',
      data: {
        game: updatedGame,
        board: board
      }
    });

  } catch (error) {
    console.error('Fehler beim Zuweisen des Spiels:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Zuweisen des Spiels'
    }, { status: 500 });
  }
}
