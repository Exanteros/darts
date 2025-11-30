import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({
        success: false,
        message: 'Spiel-ID ist erforderlich'
      }, { status: 400 });
    }

    // Prüfe ob das Spiel existiert und wartet
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: true,
        player2: true,
        board: true
      }
    });

    if (!game) {
      return NextResponse.json({
        success: false,
        message: 'Spiel nicht gefunden'
      }, { status: 404 });
    }

    if (game.status !== 'WAITING') {
      return NextResponse.json({
        success: false,
        message: `Spiel ist nicht im WAITING-Status (aktueller Status: ${game.status})`
      }, { status: 400 });
    }

    if (!game.boardId) {
      return NextResponse.json({
        success: false,
        message: 'Spiel ist keiner Scheibe zugewiesen'
      }, { status: 400 });
    }

    // Setze das Spiel auf ACTIVE
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'ACTIVE'
      },
      include: {
        player1: true,
        player2: true,
        board: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Spiel erfolgreich gestartet',
      game: {
        id: updatedGame.id,
        player1: updatedGame.player1?.playerName,
        player2: updatedGame.player2?.playerName,
        boardName: updatedGame.board?.name,
        boardAccessCode: updatedGame.board?.accessCode
      }
    });

  } catch (error) {
    console.error('Fehler beim Starten des Spiels:', error);
    return NextResponse.json({
      success: false,
      message: 'Interner Serverfehler beim Starten des Spiels'
    }, { status: 500 });
  }
}