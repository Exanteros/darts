import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { playerId, statistics } = body;

    if (!playerId || !statistics) {
      return NextResponse.json(
        { error: 'Player ID und Statistiken erforderlich' },
        { status: 400 }
      );
    }

    // Statistiken aktualisieren
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: {
        average: statistics.average,
        firstNineAvg: statistics.firstNineAvg,
        highFinish: statistics.highFinish,
        oneEighties: statistics.oneEighties,
        checkoutRate: statistics.checkoutRate,
        doubleRate: statistics.doubleRate,
        bestLeg: statistics.bestLeg,
        totalPoints: statistics.totalPoints,
        legsPlayed: statistics.legsPlayed,
        legsWon: statistics.legsWon,
        matchesPlayed: statistics.matchesPlayed,
        matchesWon: statistics.matchesWon,
        currentRank: statistics.currentRank,
        prizeMoney: statistics.prizeMoney,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating player statistics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Statistiken' },
      { status: 500 }
    );
  }
}

// API für das Berechnen von Statistiken aus Spiel-Daten
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID erforderlich' },
        { status: 400 }
      );
    }

    // Spiel-Daten für den Spieler laden
    const player = await prisma.tournamentPlayer.findUnique({
      where: { id: playerId },
      include: {
        throws: {
          include: {
            game: true
          }
        },
        gamesAsPlayer1: {
          include: {
            throws: true
          }
        },
        gamesAsPlayer2: {
          include: {
            throws: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    // Statistiken berechnen
    const statistics = calculatePlayerStatistics(player);

    // Statistiken in der Datenbank aktualisieren
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: statistics,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      player: updatedPlayer,
      statistics
    });

  } catch (error) {
    console.error('Error calculating player statistics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Berechnen der Statistiken' },
      { status: 500 }
    );
  }
}

function calculatePlayerStatistics(player: any) {
  const throws = player.throws || [];
  const allGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];

  // Basis-Statistiken
  const totalThrows = throws.length;
  const totalPoints = throws.reduce((sum: number, t: any) => sum + (t.score || 0), 0);

  // Average berechnen
  const average = totalThrows > 0 ? totalPoints / totalThrows : 0;

  // 180er zählen
  const oneEighties = throws.filter((t: any) => t.score === 180).length;

  // High Finish (höchstes Checkout)
  let highFinish = 0;
  allGames.forEach((game: any) => {
    if (game.winnerId === player.id && game.status === 'FINISHED') {
      // Hier würde die Logik für das Checkout stehen
      // Vereinfacht: Nehmen wir an, das letzte Throw ist das Finish
      const gameThrows = game.throws.filter((t: any) => t.playerId === player.id);
      if (gameThrows.length > 0) {
        const lastThrow = gameThrows[gameThrows.length - 1];
        const finishScore = lastThrow.dart1 + lastThrow.dart2 + lastThrow.dart3;
        if (finishScore > highFinish) {
          highFinish = finishScore;
        }
      }
    }
  });

  // Legs und Matches zählen
  const legsPlayed = allGames.length;
  const legsWon = allGames.filter((g: any) => g.winnerId === player.id).length;

  // Matches aus Legs ableiten (vereinfacht)
  const matchesPlayed = Math.ceil(legsPlayed / 2); // Annahme: Best of 3
  const matchesWon = Math.ceil(legsWon / 2);

  // Checkout Rate (vereinfacht)
  const checkoutRate = legsPlayed > 0 ? (legsWon / legsPlayed) * 100 : 0;

  return {
    average: Math.round(average * 100) / 100,
    highFinish,
    oneEighties,
    checkoutRate: Math.round(checkoutRate * 100) / 100,
    totalPoints,
    legsPlayed,
    legsWon,
    matchesPlayed,
    matchesWon,
    // Diese würden manuell gesetzt werden
    firstNineAvg: null,
    doubleRate: null,
    bestLeg: null,
    currentRank: null,
    prizeMoney: player.prizeMoney || 0
  };
}
