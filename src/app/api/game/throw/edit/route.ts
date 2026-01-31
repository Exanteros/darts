import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { verifyBoardAccess } from '@/lib/board-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// Validierungsfunktionen
function isValidDartValue(value: number): boolean {
  if (value === 0) return true; // Miss
  if (value === 25 || value === 50) return true; // Bull/Bullseye
  // Reguläre Dart-Werte: 1-20 (Single), 2-40 (Double), 3-60 (Triple)
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
  // Validiere einzelne Dart-Werte
  if (!isValidDartValue(dart1)) {
    return { valid: false, error: `Ungültiger Wert für Dart 1: ${dart1}` };
  }
  if (!isValidDartValue(dart2)) {
    return { valid: false, error: `Ungültiger Wert für Dart 2: ${dart2}` };
  }
  if (!isValidDartValue(dart3)) {
    return { valid: false, error: `Ungültiger Wert für Dart 3: ${dart3}` };
  }

  // Prüfe Gesamtsumme
  const calculatedScore = dart1 + dart2 + dart3;
  if (calculatedScore !== score) {
    return { valid: false, error: `Score stimmt nicht überein: ${score} != ${calculatedScore}` };
  }

  // Prüfe maximalen Score (3x Triple 20 = 180)
  if (score > 180) {
    return { valid: false, error: `Score zu hoch: ${score} > 180` };
  }

  // Prüfe negative Werte
  if (score < 0 || dart1 < 0 || dart2 < 0 || dart3 < 0) {
    return { valid: false, error: 'Negative Werte sind nicht erlaubt' };
  }

  return { valid: true };
}

export async function PUT(request: NextRequest) {
  try {
    // Rate-Limiting: Max 20 Edits pro Minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `throw-edit:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 20, 60000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
        retryAfter: rateLimit.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.retryAfter || 60000) / 1000))
        }
      });
    }

    const session = await getServerSession(authOptions);

    const body = await request.json();
    const { gameId, throwIndex, dart1, dart2, dart3, score, leg } = body;

    if (!gameId || throwIndex === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Spiel-ID und Wurf-Index sind erforderlich'
      }, { status: 400 });
    }

    // Validiere throwIndex
    if (throwIndex < 0 || !Number.isInteger(throwIndex)) {
      return NextResponse.json({
        success: false,
        message: 'Ungültiger Wurf-Index'
      }, { status: 400 });
    }

    // Prüfe ob das Spiel existiert
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

    // Authorization Check
    const isAdmin = session?.user?.role === 'ADMIN';
    
    const boardCode = request.headers.get('x-board-code');
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode, ip);

    if (!isAdmin && !isBoardAuthorized) {
      return NextResponse.json({
        success: false,
        message: 'Sie sind nicht berechtigt, Würfe zu bearbeiten.'
      }, { status: 403 });
    }

    // Hole alle Würfe für dieses Spiel sortiert nach Erstellungszeit
    const allThrows = await prisma.throw.findMany({
      where: { gameId: gameId },
      orderBy: { createdAt: 'asc' }
    });

    if (throwIndex >= allThrows.length) {
      return NextResponse.json({
        success: false,
        message: 'Wurf-Index außerhalb des gültigen Bereichs'
      }, { status: 400 });
    }

    // Hole den zu bearbeitenden Wurf
    const throwToEdit = allThrows[throwIndex];

    // Bereite neue Werte vor (verwende alte Werte wenn nicht angegeben)
    const newDart1 = dart1 !== undefined ? dart1 : throwToEdit.dart1;
    const newDart2 = dart2 !== undefined ? dart2 : throwToEdit.dart2;
    const newDart3 = dart3 !== undefined ? dart3 : throwToEdit.dart3;
    const newScore = score !== undefined ? score : throwToEdit.score;

    // Validiere die neuen Wurf-Daten
    const validation = validateThrowData(newDart1, newDart2, newDart3, newScore);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: validation.error
      }, { status: 400 });
    }

    // Prüfe ob das Spiel noch bearbeitbar ist (nicht abgeschlossen)
    if (game.status === 'FINISHED' && game.finishedAt) {
      const hoursSinceFinish = (Date.now() - game.finishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceFinish > 24) {
        return NextResponse.json({
          success: false,
          message: 'Spiel ist bereits seit mehr als 24 Stunden beendet und kann nicht mehr bearbeitet werden'
        }, { status: 403 });
      }
    }

    // Verwende Transaction für atomare Operationen
    const result = await prisma.$transaction(async (tx) => {
      // Aktualisiere den Wurf
      const updatedThrow = await tx.throw.update({
        where: { id: throwToEdit.id },
        data: {
          dart1: newDart1,
          dart2: newDart2,
          dart3: newDart3,
          score: newScore
        }
      });

      // Berechne die neuen Leg-Scores
      const updatedAllThrows = await tx.throw.findMany({
        where: { gameId: gameId, leg: throwToEdit.leg },
        orderBy: { createdAt: 'asc' }
      });

      const player1Throws = updatedAllThrows.filter(t => t.playerId === game.player1Id);
      const player2Throws = updatedAllThrows.filter(t => t.playerId === game.player2Id);

      const player1Score = player1Throws.reduce((sum, t) => sum + t.score, 0);
      const player2Score = player2Throws.reduce((sum, t) => sum + t.score, 0);

      return {
        throw: updatedThrow,
        scores: {
          player1: player1Score,
          player2: player2Score
        }
      };
    });

    // Audit-Log
    console.log(`[AUDIT] Wurf bearbeitet - Game: ${gameId}, Index: ${throwIndex}, User: ${session?.user?.email || 'Board-' + request.headers.get('x-board-code')}, Alt: ${throwToEdit.score}, Neu: ${newScore}`);

    return NextResponse.json({
      success: true,
      message: 'Wurf erfolgreich aktualisiert',
      data: result
    });

  } catch (error) {
    console.error('Fehler beim Bearbeiten des Wurfs:', error);
    return NextResponse.json({
      success: false,
      message: 'Interner Serverfehler'
    }, { status: 500 });
  }
}
