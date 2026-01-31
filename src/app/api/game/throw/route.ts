import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Throw, GameStatus, Prisma } from '@prisma/client';

import { verifyBoardAccess } from '@/lib/board-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// Validierungsfunktionen
function isValidDartValue(value: number): boolean {
  if (value === 0) return true; // Miss
  if (value === 25 || value === 50) return true; // Bull/Bullseye
  if (value >= 1 && value <= 20) return true; // Single
  if (value >= 2 && value <= 40 && value % 2 === 0) {
    const base = value / 2;
    if (base >= 1 && base <= 20) return true; // Double
  }
  if (value >= 3 && value <= 60 && value % 3 === 0) {
    const base = value / 3;
    if (base >= 1 && base <= 20) return true; // Triple
  }
  return false;
}

function validateThrowData(dart1: number, dart2: number, dart3: number, score: number) {
  if (!isValidDartValue(dart1)) {
    return { valid: false, error: `Ungültiger Wert für Dart 1: ${dart1}` };
  }
  if (!isValidDartValue(dart2)) {
    return { valid: false, error: `Ungültiger Wert für Dart 2: ${dart2}` };
  }
  if (!isValidDartValue(dart3)) {
    return { valid: false, error: `Ungültiger Wert für Dart 3: ${dart3}` };
  }

  const calculatedScore = dart1 + dart2 + dart3;
  if (calculatedScore !== score) {
    return { valid: false, error: `Score stimmt nicht überein: ${score} != ${calculatedScore}` };
  }

  if (score > 180 || score < 0) {
    return { valid: false, error: `Ungültiger Score: ${score}` };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate-Limiting: Max 30 Würfe pro Minute (verhindert Scripts)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `throw:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 30, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: 'Zu viele Würfe. Bitte langsamer werfen.',
        retryAfter: rateLimit.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.retryAfter || 60000) / 1000))
        }
      });
    }

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
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode, ip);

    if (!isAdmin && !isPlayer && !isBoardAuthorized) {
      return NextResponse.json({
        success: false,
        message: 'Sie sind nicht berechtigt, für diesen Spieler einen Wurf einzutragen.'
      }, { status: 403 });
    }

    // Use provided leg or fallback to current game leg
    const targetLeg = leg !== undefined ? leg : game.currentLeg;

    const dart1Val = dart1 || 0;
    const dart2Val = dart2 || 0;
    const dart3Val = dart3 || 0;
    const scoreVal = score !== undefined ? score : (dart1Val + dart2Val + dart3Val);

    // Validiere Wurf-Daten
    const validation = validateThrowData(dart1Val, dart2Val, dart3Val, scoreVal);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: validation.error
      }, { status: 400 });
    }

    const throwData = {
      gameId,
      playerId,
      leg: targetLeg,
      dart1: dart1Val,
      dart2: dart2Val,
      dart3: dart3Val,
      score: scoreVal
    };

    // Verwende Transaction für atomare Operationen
    const result = await prisma.$transaction(async (tx) => {
      // Create new throw (ALWAYS create, never overwrite)
      const throwResult = await tx.throw.create({
        data: throwData
      });

      // Berechne neue Legs-Scores für das aktuelle Leg
      const allThrows = await tx.throw.findMany({
        where: { gameId: gameId, leg: targetLeg }
      });

      const player1Throws = allThrows.filter(t => t.playerId === game.player1Id);
      const player2Throws = allThrows.filter(t => t.playerId === game.player2Id);

      const player1Score = player1Throws.reduce((sum, t) => sum + t.score, 0);
      const player2Score = player2Throws.reduce((sum, t) => sum + t.score, 0);

      // Check for Leg Win
      const POINTS_TO_WIN = 501;
      let legWon = false;
      let winnerId = null;

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
      const updatedGameResult = await tx.game.update({
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

      return {
        throw: throwResult,
        game: updatedGameResult,
        scores: { player1: player1Score, player2: player2Score },
        legWon,
        winnerId
      };
    });

    // Audit-Log
    console.log(`[AUDIT] Wurf erstellt - Game: ${gameId}, Player: ${playerId}, Score: ${scoreVal}, Board: ${request.headers.get('x-board-code')}`);

    return NextResponse.json({
      success: true,
      message: result.legWon ? 'Wurf erfolgreich registriert und Leg beendet' : 'Wurf erfolgreich registriert',
      data: result
    });

  } catch (error) {
    console.error('Fehler beim Registrieren des Wurfs:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Registrieren des Wurfs'
    }, { status: 500 });
  }
}
