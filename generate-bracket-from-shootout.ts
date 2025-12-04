import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateBracketFromShootout() {
  try {
    console.log('🏆 Generiere Bracket basierend auf Shootout-Ergebnissen...');

    // 1. Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        players: { orderBy: { seed: 'asc' } }
      }
    });

    if (!tournament) {
      console.log('❌ Kein Turnier gefunden');
      return;
    }

    console.log(`📋 Turnier: ${tournament.name}`);

    // 2. Hole Shootout-Ergebnisse sortiert nach Score (absteigend)
    const shootoutResults = await prisma.shootoutResult.findMany({
      where: { tournamentId: tournament.id },
      include: { player: true },
      orderBy: { score: 'desc' }
    });

    if (shootoutResults.length === 0) {
      console.log('❌ Keine Shootout-Ergebnisse gefunden');
      return;
    }

    console.log(`🎯 ${shootoutResults.length} Shootout-Ergebnisse gefunden`);

    // Lade Bracket-Konfiguration
    const config = await prisma.bracketConfig.findFirst();
    let legsConfig: any = {};
    try {
        legsConfig = config?.legsPerRound ? JSON.parse(config.legsPerRound as string) : {};
    } catch (e) { console.error('Error parsing legs config', e); }

    const getLegsForRound = (round: number) => {
        if (legsConfig && legsConfig[`round${round}`]) {
            return legsConfig[`round${round}`];
        }
        // Fallback
        return round >= 5 ? 3 : 2;
    };

    // 3. Lösche alle bestehenden Spiele
    const deletedGames = await prisma.game.deleteMany({
      where: { tournamentId: tournament.id }
    });
    console.log(`✅ ${deletedGames.count} bestehende Spiele gelöscht`);

    // 4. Erstelle neue Bracket-Struktur basierend auf Shootout-Ranking
    // Für 64 Spieler: Single Elimination mit 6 Runden
    const rounds = [
      { round: 1, games: 32 },  // 64 -> 32
      { round: 2, games: 16 },  // 32 -> 16
      { round: 3, games: 8 },   // 16 -> 8
      { round: 4, games: 4 },   // 8 -> 4
      { round: 5, games: 2 },   // 4 -> 2
      { round: 6, games: 1 }    // 2 -> 1 (Finale)
    ];

    const games: any[] = [];

    // Bereite Spieler-Liste vor (Standard oder Zufall)
    let seedingList = [...shootoutResults];
    if (config?.seedingAlgorithm === 'random') {
        console.log('🎲 Zufällige Setzliste wird angewendet');
        for (let i = seedingList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [seedingList[i], seedingList[j]] = [seedingList[j], seedingList[i]];
        }
    }

    // Runde 1: Weise Spieler basierend auf Liste zu
    for (let i = 0; i < 32; i++) {
      const player1Index = i;
      const player2Index = 63 - i;

      const player1 = seedingList[player1Index]?.player;
      const player2 = seedingList[player2Index]?.player;

      games.push({
        tournamentId: tournament.id,
        round: 1,
        player1Id: player1?.id || null,
        player2Id: player2?.id || null,
        status: (player1 && player2) ? 'WAITING' : 'WAITING',
        legsToWin: getLegsForRound(1),
        boardId: null
      });
    }

    // Höhere Runden: Leere Spiele für spätere Zuweisung
    rounds.slice(1).forEach(({ round, games: gameCount }) => {
      for (let i = 0; i < gameCount; i++) {
        games.push({
          tournamentId: tournament.id,
          round,
          player1Id: null, // Beide Spieler null für höhere Runden
          player2Id: null,
          status: 'WAITING',
          legsToWin: getLegsForRound(round),
          boardId: null
        });
      }
    });

    // 5. Erstelle Spiele in der Datenbank
    const createdGames = [];
    for (const game of games) {
      const createdGame = await prisma.game.create({
        data: game
      });
      createdGames.push(createdGame);
    }

    console.log(`✅ ${createdGames.length} Spiele erstellt`);

    // 6. Weise erste Runde Scheiben zu
    const firstRoundGames = await prisma.game.findMany({
      where: {
        tournamentId: tournament.id,
        round: 1
      },
      take: 6,
      orderBy: { id: 'asc' }
    });

    const boards = await prisma.board.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { priority: 'asc' }
    });

    for (let i = 0; i < Math.min(firstRoundGames.length, boards.length); i++) {
      await prisma.game.update({
        where: { id: firstRoundGames[i].id },
        data: {
          boardId: boards[i].id,
          status: 'WAITING'
        }
      });
    }

    console.log(`✅ Erste ${Math.min(firstRoundGames.length, boards.length)} Spiele Scheiben zugewiesen`);

    // 7. Setze ein Spiel als aktiv
    const activeGame = await prisma.game.findFirst({
      where: {
        tournamentId: tournament.id,
        round: 1,
        boardId: { not: null }
      }
    });

    if (activeGame) {
      await prisma.game.update({
        where: { id: activeGame.id },
        data: {
          status: 'ACTIVE',
          startedAt: new Date()
        }
      });
      console.log('✅ Ein Spiel als aktiv markiert');
    }

    console.log('\n🎉 Bracket erfolgreich basierend auf Shootout-Ergebnissen generiert!');
    console.log('📊 Top 8 Spieler in Runde 1:');

    for (let i = 0; i < 8; i++) {
      const player1 = shootoutResults[i]?.player;
      const player2 = shootoutResults[63 - i]?.player;
      console.log(`${i + 1}. ${player1?.playerName} (${shootoutResults[i]?.score} pts) vs ${player2?.playerName} (${shootoutResults[63 - i]?.score} pts)`);
    }

  } catch (error) {
    console.error('❌ Fehler beim Generieren des Brackets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateBracketFromShootout();