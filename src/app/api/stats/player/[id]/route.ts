import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Authentifizierung erforderlich'
      }, { status: 401 });
    }

    const { id: playerId } = await params;

    if (!playerId) {
      return NextResponse.json({
        success: false,
        message: 'Spieler-ID ist erforderlich'
      }, { status: 400 });
    }

    // Hole Spieler-Informationen
    const player = await prisma.tournamentPlayer.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json({
        success: false,
        message: 'Spieler nicht gefunden'
      }, { status: 404 });
    }

    // Hole alle Würfe des Spielers
    const throws = await prisma.throw.findMany({
      where: { playerId: playerId },
      include: {
        game: {
          select: {
            round: true,
            status: true,
            legsToWin: true
          }
        }
      }
    });

    // Berechne Statistiken
    const totalThrows = throws.length;
    const totalScore = throws.reduce((sum, t) => sum + t.score, 0);
    const averageScore = totalThrows > 0 ? totalScore / totalThrows : 0;

    // Dart-Statistiken
    const allDarts = throws.flatMap(t => [t.dart1, t.dart2, t.dart3]);
    const totalDarts = allDarts.length;
    const averagePerDart = totalDarts > 0 ? totalScore / totalDarts : 0;

    // Highscores
    const highScores = throws
      .map(t => t.score)
      .sort((a, b) => b - a)
      .slice(0, 5);

    // 180er, 140+, 100+
    const scores180 = throws.filter(t => t.score === 180).length;
    const scores140Plus = throws.filter(t => t.score >= 140 && t.score < 180).length;
    const scores100Plus = throws.filter(t => t.score >= 100 && t.score < 140).length;

    // Spiel-Statistiken
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { player1Id: playerId },
          { player2Id: playerId }
        ]
      },
      include: {
        winner: true
      }
    });

    const totalGames = games.length;
    const wonGames = games.filter(g => g.winnerId === playerId).length;
    const winRate = totalGames > 0 ? (wonGames / totalGames) * 100 : 0;

    // Runden-Statistiken
    const roundStats = [1, 2, 3, 4, 5, 6].map(round => {
      const roundThrows = throws.filter(t => t.game.round === round);
      const roundGames = games.filter(g => g.round === round);
      const roundWins = roundGames.filter(g => g.winnerId === playerId).length;

      return {
        round,
        games: roundGames.length,
        wins: roundWins,
        throws: roundThrows.length,
        averageScore: roundThrows.length > 0
          ? roundThrows.reduce((sum, t) => sum + t.score, 0) / roundThrows.length
          : 0
      };
    });

    const stats = {
      player: {
        id: player.id,
        name: player.playerName,
        userName: player.user?.name,
        status: player.status,
        seed: player.seed
      },
      tournament: {
        name: player.tournament?.name,
        status: player.tournament?.status
      },
      overall: {
        totalGames,
        wonGames,
        winRate: Math.round(winRate * 100) / 100,
        totalThrows,
        totalScore,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePerDart: Math.round(averagePerDart * 100) / 100,
        highScores
      },
      scores: {
        scores180,
        scores140Plus,
        scores100Plus
      },
      rounds: roundStats
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Fehler beim Laden der Spieler-Statistiken:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Spieler-Statistiken'
    }, { status: 500 });
  }
}
