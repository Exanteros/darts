import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Throw, GameStatus, Prisma } from '@prisma/client';

import { verifyBoardAccess } from '@/lib/board-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Note: We don't return 401 immediately because board access might be valid without session

    const body = await request.json();
    const { gameId, playerId, dart1, dart2, dart3, score, leg } = body;

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

    // Allow throws for finished games if it's the winning throw (race condition handling)
    if (game.status !== 'ACTIVE' && game.status !== 'FINISHED') {
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

    // Authorization Check: Nur der Spieler selbst, ein Admin oder ein autorisiertes Board darf werfen
    const isAdmin = session?.user?.role === 'ADMIN';
    const isPlayer = session?.user?.id === playerId;
    
    const boardCode = request.headers.get('x-board-code');
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode);

    if (!isAdmin && !isPlayer && !isBoardAuthorized) {
      return NextResponse.json({
        success: false,
        message: 'Sie sind nicht berechtigt, für diesen Spieler einen Wurf einzutragen.'
      }, { status: 403 });
    }

    // Use provided leg or fallback to current game leg
    const targetLeg = leg !== undefined ? leg : game.currentLeg;

    const throwData = {
      gameId,
      playerId,
      leg: targetLeg,
      dart1: dart1 || 0,
      dart2: dart2 || 0,
      dart3: dart3 || 0,
      score: score !== undefined ? score : ((dart1 || 0) + (dart2 || 0) + (dart3 || 0))
    };

    // Create new throw (ALWAYS create, never overwrite)
    const throwResult = await prisma.throw.create({
      data: throwData
    });

    // Berechne neue Legs-Scores für das aktuelle Leg
    const allThrows = await prisma.throw.findMany({
      where: { gameId: gameId, leg: targetLeg }
    });

    const player1Throws = allThrows.filter(t => t.playerId === game.player1Id);
    const player2Throws = allThrows.filter(t => t.playerId === game.player2Id);

    const player1Score = player1Throws.reduce((sum, t) => sum + t.score, 0);
    const player2Score = player2Throws.reduce((sum, t) => sum + t.score, 0);

    // Check for Leg Win
    // Assuming 501 game
    const POINTS_TO_WIN = 501;
    let legWon = false;
    let winnerId = null;
    let updatedGame = game;

    if (game.currentLeg === targetLeg) {
        if (playerId === game.player1Id && player1Score === POINTS_TO_WIN) {
            legWon = true;
            winnerId = game.player1Id;
        } else if (playerId === game.player2Id && player2Score === POINTS_TO_WIN) {
            legWon = true;
            winnerId = game.player2Id;
        }
    }

    // Always update game to clear currentThrow and update legs if won
    updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
            currentThrow: Prisma.JsonNull,
            ...(legWon && winnerId ? {
                player1Legs: { increment: winnerId === game.player1Id ? 1 : 0 },
                player2Legs: { increment: winnerId === game.player2Id ? 1 : 0 },
                currentLeg: { increment: 1 }
            } : {})
        },
        include: {
            player1: true,
            player2: true
        }
    });

    return NextResponse.json({
      success: true,
      message: legWon ? 'Wurf erfolgreich registriert und Leg beendet' : 'Wurf erfolgreich registriert',
      data: {
        throw: throwResult,
        game: updatedGame,
        scores: {
          player1: player1Score,
          player2: player2Score
        },
        legWon,
        winnerId
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
