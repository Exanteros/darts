import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Finde die Hauptscheibe (isMain = true)
    const mainBoard = await prisma.board.findFirst({
      where: {
        isMain: true
      }
    });

    // Hole das aktuell aktive Spiel von der Hauptscheibe
    const activeGame = await prisma.game.findFirst({
      where: {
        status: 'ACTIVE',
        ...(mainBoard && { boardId: mainBoard.id }) // Nur Spiele von der Hauptscheibe
      },
      include: {
        player1: {
          include: {
            user: true
          }
        },
        player2: {
          include: {
            user: true
          }
        },
        board: true,
        tournament: true,
        throws: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 9 // Letzte 3 Würfe von beiden Spielern
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (!activeGame) {
      return NextResponse.json({
        game: null,
        message: mainBoard 
          ? `Kein aktives Spiel auf Hauptscheibe "${mainBoard.name}" gefunden`
          : 'Keine Hauptscheibe markiert oder kein aktives Spiel gefunden'
      });
    }

    // Berechne Statistiken für beide Spieler
    const player1Throws = activeGame.throws.filter(t => t.playerId === activeGame.player1Id);
    const player2Throws = activeGame.throws.filter(t => t.playerId === activeGame.player2Id);

    const player1Stats = calculatePlayerStats(player1Throws, activeGame.player1Legs);
    const player2Stats = calculatePlayerStats(player2Throws, activeGame.player2Legs);

    // Bestimme aktuellen Spieler aus currentThrow JSON-Feld oder fallback auf Berechnung
    let currentPlayer: 1 | 2 = 1;
    if (activeGame.currentThrow && typeof activeGame.currentThrow === 'object') {
      const throwData = activeGame.currentThrow as any;
      currentPlayer = throwData.player || 1;
    } else {
      // Fallback: abwechselnd basierend auf Wurfanzahl
      const totalThrows = activeGame.throws.length;
      currentPlayer = (totalThrows % 2) === 0 ? 1 : 2;
    }

    // Hole die Darts des aktuellen Spielers aus currentThrow (wenn er gerade wirft)
    let currentPlayerDarts: (string | null)[] = [];
    
    if (activeGame.currentThrow && typeof activeGame.currentThrow === 'object') {
      const throwData = activeGame.currentThrow as any;
      
      // Nur Darts anzeigen, wenn sie zum aktuellen Spieler gehören und bereits geworfen wurden
      if (throwData.player === currentPlayer && throwData.darts && Array.isArray(throwData.darts)) {
        currentPlayerDarts = throwData.darts
          .filter((d: number) => d > 0) // Nur geworfene Darts (> 0)
          .map((d: number) => formatDart(d))
          .filter((d: string | null) => d !== null);
      }
    }

    const gameData = {
      id: activeGame.id,
      tournamentId: activeGame.tournamentId,
      tournamentName: activeGame.tournament?.name || 'Darts Turnier',
      round: activeGame.round,
      boardId: activeGame.boardId,
      boardName: activeGame.board?.name || 'Unbekannt',
      player1Id: activeGame.player1Id,
      player2Id: activeGame.player2Id,
      player1Name: activeGame.player1?.playerName || 'Unbekannt',
      player2Name: activeGame.player2?.playerName || 'BYE',
      player1Score: 501 - player1Stats.totalScore,
      player2Score: 501 - player2Stats.totalScore,
      player1Legs: activeGame.player1Legs || 0,
      player2Legs: activeGame.player2Legs || 0,
      currentPlayer,
      status: activeGame.status,
      legsToWin: activeGame.legsToWin || 7,
      currentLeg: activeGame.currentLeg,
      player1Stats,
      player2Stats,
      lastThrows: activeGame.throws.slice(0, 6), // Letzte 6 Würfe
      currentPlayerDarts // Die 3 einzelnen Darts des aktuellen Spielers formatiert
    };

    return NextResponse.json({
      game: gameData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching live game data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Konvertiert einen Dart-Score in Notation (z.B. 60 -> "T20", 50 -> "BULL")
function formatDart(score: number): string | null {
  if (score === 0) return null; // Nicht geworfen
  if (score === 50) return 'BULL';
  if (score === 25) return '25'; // Outer Bull
  
  // Prüfe auf Triple (3x)
  if (score % 3 === 0 && score <= 60) {
    const base = score / 3;
    if (base >= 1 && base <= 20) return `T${base}`;
  }
  
  // Prüfe auf Double (2x)
  if (score % 2 === 0 && score <= 40) {
    const base = score / 2;
    if (base >= 1 && base <= 20) return `D${base}`;
  }
  
  // Single (1-20)
  if (score >= 1 && score <= 20) return `${score}`;
  
  // Fallback: einfach die Zahl zurückgeben
  return `${score}`;
}

function calculatePlayerStats(throws: any[], legsWon: number) {
  const totalScore = throws.reduce((sum, t) => sum + t.score, 0);
  const dartsThrown = throws.length * 3;
  const average = dartsThrown > 0 ? (totalScore / dartsThrown) * 3 : 0;

  // Berechne Checkout (vereinfacht)
  const remainingScore = 501 - totalScore;
  const checkout = remainingScore <= 170 && remainingScore > 1 ? remainingScore : null;

  // Letzte 3 Würfe
  const lastThreeThrows = throws.slice(0, 3).map(t => t.score);

  return {
    totalScore,
    dartsThrown,
    average: Math.round(average * 10) / 10,
    checkout,
    lastThrow: lastThreeThrows,
    legs: legsWon
  };
}
