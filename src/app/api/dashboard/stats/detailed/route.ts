import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Hole das neueste Turnier mit allen Daten
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        players: {
          include: {
            user: true,
            gamesAsPlayer1: {
              where: { status: 'FINISHED' },
              include: {
                throws: true
              }
            },
            gamesAsPlayer2: {
              where: { status: 'FINISHED' },
              include: {
                throws: true
              }
            },
            gamesAsWinner: true
          }
        },
        games: {
          include: {
            player1: true,
            player2: true,
            winner: true,
            throws: true
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        error: 'Kein Turnier gefunden'
      }, { status: 404 });
    }

    // Berechne Statistiken
    const totalPlayers = tournament.players.length;
    const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE').length;
    const withdrawnPlayers = tournament.players.filter(p => p.status === 'WITHDRAWN').length;

    const totalGames = tournament.games.length;
    const finishedGames = tournament.games.filter(g => g.status === 'FINISHED').length;
    const activeGames = tournament.games.filter(g => g.status === 'ACTIVE').length;
    const waitingGames = tournament.games.filter(g => g.status === 'WAITING').length;

    // Würfe und Scores
    const allThrows = tournament.games.flatMap(g => g.throws);
    const totalThrows = allThrows.length;
    const totalScore = allThrows.reduce((sum, t) => sum + t.score, 0);
    const averageScore = totalThrows > 0 ? totalScore / totalThrows : 0;
    
    // Höchster Einzelwurf (nicht Score - einzelner Dart!)
    const allDarts = allThrows.flatMap(t => [t.dart1, t.dart2, t.dart3]).filter(d => d > 0);
    const highestScore = allDarts.length > 0 ? Math.max(...allDarts) : 0;

    // Checkouts (Gewonnene Legs)
    const totalCheckouts = tournament.games.reduce((sum, game) => {
      return sum + (game.player1Legs || 0) + (game.player2Legs || 0);
    }, 0);

    // Aktuelle Runde
    const currentRound = tournament.games.length > 0 ? Math.max(...tournament.games.map(g => g.round)) : 0;
    const maxRounds = Math.ceil(Math.log2(tournament.maxPlayers));

    // Top Spieler berechnen
    const playerStats = tournament.players.map(player => {
      const wins = player.gamesAsWinner.length;
      const allPlayerGames = [...player.gamesAsPlayer1, ...player.gamesAsPlayer2];
      const playerThrows = allPlayerGames.flatMap(g => 
        g.throws.filter(t => t.playerId === player.id)
      );
      const playerScore = playerThrows.reduce((sum, t) => sum + t.score, 0);
      const playerAverage = playerThrows.length > 0 ? playerScore / playerThrows.length : 0;
      
      const checkouts = allPlayerGames.reduce((sum, game) => {
        return sum + (game.player1Id === player.id ? (game.player1Legs || 0) : (game.player2Legs || 0));
      }, 0);

      return {
        name: player.playerName,
        wins,
        averageScore: playerAverage,
        checkouts
      };
    });

    // Sortiere nach Siegen, dann nach Average
    const topPlayers = playerStats
      .filter(p => p.wins > 0 || p.averageScore > 0) // Nur Spieler mit Aktivität
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.averageScore - a.averageScore;
      })
      .slice(0, 10);

    // Letzte 5 beendete Spiele
    const recentGames = tournament.games
      .filter(g => g.status === 'FINISHED' && g.finishedAt)
      .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())
      .slice(0, 5)
      .map(game => ({
        id: game.id,
        player1Name: game.player1?.playerName || 'Unbekannt',
        player2Name: game.player2?.playerName || 'BYE',
        winnerName: game.winner?.playerName || '',
        player1Score: game.player1Legs || 0,
        player2Score: game.player2Legs || 0,
        finishedAt: game.finishedAt!.toISOString()
      }));

    // Lustige Statistik: Wurf-Intensität nach Tageszeit
    const throwsByHour = allThrows.reduce((acc: any, t) => {
      const hour = new Date(t.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const throwIntensityChart = Object.entries(throwsByHour)
      .map(([hour, count]) => ({
        name: `${hour}h`,
        value: count as number,
        label: `${hour}:00 Uhr - ${count} Würfe`
      }))
      .slice(0, 12);

    // Lustige Statistik: "Glücks-Index" pro Spieler (Verhältnis Siege zu Spielen)
    const luckIndexChart = playerStats
      .filter(p => p.wins > 0)
      .slice(0, 8)
      .map(p => {
        const totalGames = tournament.players
          .find(pl => pl.playerName === p.name)?.gamesAsPlayer1.length || 1;
        const luckIndex = Math.round((p.wins / Math.max(totalGames, 1)) * 100);
        return {
          name: p.name.split(' ')[0],
          value: luckIndex,
          label: `${p.name}: ${luckIndex}% Glück`
        };
      });

    // Lustige Statistik: "Dart-Verschwendung" (Würfe mit 0 Punkten)
    const missedThrows = allThrows.filter(t => t.score === 0).length;
    const accuracyRate = totalThrows > 0 ? ((totalThrows - missedThrows) / totalThrows) * 100 : 100;
    const wasteChart = [
      { name: 'Treffer', value: totalThrows - missedThrows, label: `${totalThrows - missedThrows} Treffer` },
      { name: 'Daneben', value: missedThrows, label: `${missedThrows} Fehlwürfe` }
    ];

    // Lustige Statistik: "Nervenfaktor" (Durchschnittliche Spieldauer in Würfen)
    const avgThrowsPerGame = finishedGames > 0 ? Math.round(totalThrows / finishedGames) : 0;
    const nerveFactor = tournament.games
      .filter(g => g.status === 'FINISHED')
      .slice(-10)
      .map((game, index) => {
        const gameThrows = game.throws.length;
        return {
          name: `G${index + 1}`,
          value: gameThrows,
          label: `Spiel ${index + 1}: ${gameThrows} Würfe`
        };
      });

    // Lustige Statistik: "Dart-Dealer" (Spieler mit meisten Würfen)
    const mostThrowsChart = playerStats
      .map(p => {
        const player = tournament.players.find(pl => pl.playerName === p.name);
        const allPlayerGames = [...(player?.gamesAsPlayer1 || []), ...(player?.gamesAsPlayer2 || [])];
        const throwCount = allPlayerGames.flatMap(g => g.throws.filter(t => t.playerId === player?.id)).length;
        return {
          name: p.name.split(' ')[0],
          value: throwCount,
          label: `${p.name}: ${throwCount} Würfe`
        };
      })
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Lustige Statistik: "Checkout-Champion" (Erfolgsquote)
    const checkoutChampChart = playerStats
      .filter(p => p.checkouts > 0)
      .slice(0, 8)
      .map(p => ({
        name: p.name.split(' ')[0],
        value: p.checkouts,
        label: `${p.name}: ${p.checkouts} Checkouts`
      }));

    const stats = {
      totalPlayers,
      activePlayers,
      withdrawnPlayers,
      totalGames,
      finishedGames,
      activeGames,
      waitingGames,
      totalThrows,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore,
      totalCheckouts,
      currentRound,
      maxRounds,
      tournamentName: tournament.name,
      tournamentStatus: tournament.status,
      startDate: tournament.startDate?.toISOString() || '',
      topPlayers,
      recentGames,
      // Lustige Zusatz-Stats
      missedThrows,
      accuracyRate: Math.round(accuracyRate * 10) / 10,
      avgThrowsPerGame,
      charts: {
        throwIntensity: throwIntensityChart,
        luckIndex: luckIndexChart,
        wasteChart: wasteChart,
        nerveFactor: nerveFactor,
        mostThrows: mostThrowsChart,
        checkoutChamp: checkoutChampChart
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching detailed tournament stats:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
