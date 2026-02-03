import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Starte oder finalisiere Shootout
export async function POST(request: NextRequest) {
  try {
    const { action, selectedPlayers, boardId } = await request.json();

    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: {
          orderBy: { seed: 'asc' }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Kein Turnier gefunden' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Starte Shootout - setze Status auf SHOOTOUT und speichere die Scheibe
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { 
          status: 'SHOOTOUT',
          shootoutBoardId: boardId
        }
      });

      // Markiere ausgewählte Spieler für Shootout
      if (selectedPlayers && selectedPlayers.length > 0) {
        // Setze alle Spieler zuerst auf WITHDRAWN
        await prisma.tournamentPlayer.updateMany({
          where: { tournamentId: tournament.id },
          data: { status: 'WITHDRAWN' }
        });

        // Setze ausgewählte Spieler auf ACTIVE für Shootout
        for (const userId of selectedPlayers) {
          await prisma.tournamentPlayer.updateMany({
            where: {
              tournamentId: tournament.id,
              userId: userId
            },
            data: { status: 'ACTIVE' }
          });
        }
      } else {
        // Automatisch alle gültigen Spieler (nicht Warteliste) auf ACTIVE setzen
        await prisma.tournamentPlayer.updateMany({
          where: { 
            tournamentId: tournament.id,
            status: { in: ['REGISTERED', 'CONFIRMED'] }
          },
          data: { status: 'ACTIVE' }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Shootout gestartet',
        selectedPlayersCount: selectedPlayers?.length || tournament.players.length,
        boardId: boardId
      });

    } else if (action === 'start_single') {
      // Starte Shootout für einzelnen Spieler
      if (!selectedPlayers || selectedPlayers.length !== 1) {
        return NextResponse.json(
          { error: 'Bitte wählen Sie genau einen Spieler aus' },
          { status: 400 }
        );
      }

      const playerId = selectedPlayers[0];
      const player = tournament.players.find(p => p.userId === playerId);

      if (!player) {
        return NextResponse.json(
          { error: 'Spieler nicht gefunden' },
          { status: 404 }
        );
      }

      // Setze Spieler-Status auf ACTIVE
      await prisma.tournamentPlayer.update({
        where: { id: player.id },
        data: { status: 'ACTIVE' }
      });

      // Setze Turnier-Status auf SHOOTOUT falls noch nicht geschehen
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { 
          status: 'SHOOTOUT',
          shootoutBoardId: boardId
        }
      });

      // Erstelle oder aktualisiere Shootout-Ergebnis für diesen Spieler
      // Hier können wir zusätzliche Logik für sequentielle Verarbeitung hinzufügen

      return NextResponse.json({
        success: true,
        message: `Shootout für ${player.playerName} gestartet`,
        playerName: player.playerName,
        playerId: player.id,
        boardId: boardId
      });

    } else if (action === 'finalize') {
      // Finalisiere Shootout - setze Status auf ACTIVE und erstelle korrekte Seeds
      const tournamentWithPlayers = await prisma.tournament.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          players: {
            orderBy: { seed: 'desc' } // Höchster Score zuerst
          },
          shootoutResults: true
        }
      });

      if (!tournamentWithPlayers) {
        return NextResponse.json(
          { error: 'Turnier nicht gefunden' },
          { status: 400 }
        );
      }

      // Erstelle korrekte Seeds basierend auf Shootout-Ergebnissen
      const activePlayers = tournamentWithPlayers.players.filter(p => p.status === 'ACTIVE' || p.status === 'CONFIRMED');
      const shootoutResults = tournamentWithPlayers.shootoutResults;

      // Sortiere Spieler nach Shootout-Score (höchster Score = beste Platzierung)
      const playersWithResults = activePlayers.map(player => {
        const result = shootoutResults.find(r => r.playerId === player.id);
        return {
          ...player,
          shootoutScore: result?.score || 0
        };
      }).sort((a, b) => b.shootoutScore - a.shootoutScore);

      // Weise Seeds zu (1 = beste Platzierung)
      for (let i = 0; i < playersWithResults.length; i++) {
        await prisma.tournamentPlayer.update({
          where: { id: playersWithResults[i].id },
          data: { seed: i + 1 }
        });
      }

      // Setze Turnier-Status auf ACTIVE
      await prisma.tournament.update({
        where: { id: tournamentWithPlayers.id },
        data: { status: 'ACTIVE' }
      });

      // Erstelle Spiele basierend auf der Setzliste
      const seededPlayers = playersWithResults.sort((a, b) => (a.seed || 999) - (b.seed || 999));

      if (seededPlayers.length < 2) {
        return NextResponse.json(
          { error: 'Nicht genügend Spieler für Turnier' },
          { status: 400 }
        );
      }

      // Lade Bracket-Konfiguration
      const bracketConfig = await prisma.bracketConfig.findFirst();
      let legsPerRound = { round1: 3 };
      try {
        if (bracketConfig?.legsPerRound) {
            legsPerRound = JSON.parse(bracketConfig.legsPerRound);
        }
      } catch (e) {
        console.error('Error parsing legsPerRound:', e);
      }
      
      const legsToWin = Math.ceil((legsPerRound['round1' as keyof typeof legsPerRound] || 3) / 2);

      // Defines the specific matchup order (Snake/Custom)
      // This order ensures that 1vs64 is Game 1, 32vs33 is Game 2 etc.
      const customSeedingOrder = [
        1, 64, 32, 33, 16, 49, 17, 48, 8, 57, 25, 40, 9, 56, 24, 41,
        4, 61, 29, 36, 13, 52, 20, 45, 5, 60, 28, 37, 12, 53, 21, 44,
        3, 62, 30, 35, 19, 46, 14, 51, 6, 59, 27, 38, 22, 43, 54, 11,
        7, 58, 26, 39, 42, 23, 55, 10, 15, 50, 47, 18, 31, 34, 63, 2
      ];

      // Entscheide über Setzliste basierend auf Konfiguration
      let finalSeedingOrder: number[] = [];
      const seedingAlgorithm = bracketConfig?.seedingAlgorithm || 'standard';

      if (seedingAlgorithm === 'snake') {
        finalSeedingOrder = customSeedingOrder;
      } else {
        // Standard: 1 vs 64, 2 vs 63... sequential
        // But for consistent game creation, we usually pair them up.
        // If we want 1 vs 64 to be Game 1, 2 vs 63 to be Game 2...
        const maxSeed = seededPlayers.length > 64 ? 128 : (seededPlayers.length > 32 ? 64 : 32);
        for (let i = 0; i < maxSeed / 2; i++) {
            finalSeedingOrder.push(i + 1);
            finalSeedingOrder.push(maxSeed - i);
        }
        
        if (seedingAlgorithm === 'random') {
           // Shuffle pairs? Or shuffle players entirely?
           // Simple shuffle of the pairs created above to randomize game order?
           // Or random seeding assignments.
           // Random algorithm usually implies random seeds assignment, which we can't do here easily without re-assigning seeds.
           // For now, treat random as standard but we might want to implement real random later.
        }
      }

      // Erstelle nur die erste Runde - höhere Runden werden später bei Bedarf erstellt
      const games = [];
      
      // Erstelle Spiele basierend auf der vordefinierten Setzliste
      for (let i = 0; i < finalSeedingOrder.length; i += 2) {
        const seed1 = finalSeedingOrder[i];
        const seed2 = finalSeedingOrder[i+1];
        
        // Finde Spieler mit entsprechendem Seed
        const player1 = seededPlayers.find(p => p.seed === seed1);
        const player2 = seededPlayers.find(p => p.seed === seed2);

        // Erstelle Spiel nur wenn mindestens ein Spieler existiert oder wir im Snake-Modus sind (leere Slots erlauben für Bracket-Struktur?)
        // Wir erstellen Spiele wenn mindestens einer da ist.
        if (player1 || player2) {
          const game = await prisma.game.create({
            data: {
              tournamentId: tournamentWithPlayers.id,
              round: 1,
              player1Id: player1?.id || null, // Handle BYE if null
              player2Id: player2?.id || null,
              status: (player1 && player2) ? 'WAITING' : 'FINISHED', // Auto-win if bye
              winnerId: (player1 && !player2) ? player1.id : ((!player1 && player2) ? player2.id : null),
              legsToWin: legsToWin
            }
          });
          games.push(game);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Shootout finalisiert und erste Runde erstellt. Höhere Runden werden bei Bedarf automatisch generiert.`,
        gamesCreated: games.length,
        playersSeeded: seededPlayers.length,
        firstRoundComplete: true
      });

    } else if (action === 'reset') {
      // Setze Shootout zurück - lösche alle Ergebnisse und setze Status zurück
      const tournamentWithPlayers = await prisma.tournament.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          players: true,
          shootoutResults: true
        }
      });

      if (!tournamentWithPlayers) {
        return NextResponse.json(
          { error: 'Turnier nicht gefunden' },
          { status: 400 }
        );
      }

      // Lösche alle Shootout-Ergebnisse
      await prisma.shootoutResult.deleteMany({
        where: { tournamentId: tournamentWithPlayers.id }
      });

      // Setze alle Spieler zurück auf ACTIVE (oder ursprünglichen Status)
      await prisma.tournamentPlayer.updateMany({
        where: { tournamentId: tournamentWithPlayers.id },
        data: { 
          status: 'ACTIVE',
          seed: null // Setze Seeds zurück
        }
      });

      // Setze Turnier-Status zurück auf REGISTRATION_CLOSED und entferne Shootout-Scheibe
      await prisma.tournament.update({
        where: { id: tournamentWithPlayers.id },
        data: { 
          status: 'REGISTRATION_CLOSED',
          shootoutBoardId: null
        }
      });

      // Lösche alle Spiele (falls welche erstellt wurden)
      await prisma.game.deleteMany({
        where: { tournamentId: tournamentWithPlayers.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Shootout wurde zurückgesetzt',
        playersReset: tournamentWithPlayers.players.length,
        resultsDeleted: tournamentWithPlayers.shootoutResults.length
      });

    } else {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in shootout API:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// GET - Lade Shootout-Daten
export async function GET() {
  try {
    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: {
          orderBy: { seed: 'asc' }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        tournament: null,
        shootoutResults: []
      });
    }

    // Mock Shootout-Ergebnisse für Demo
    // In der echten Implementierung würden diese aus der Datenbank kommen
    const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE' || p.status === 'CONFIRMED');
    const shootoutResults = await prisma.shootoutResult.findMany({
      where: { tournamentId: tournament.id },
      include: { player: true }
    });

    // Erstelle Ergebnisse basierend auf gespeicherten Daten oder Mock-Daten
    const results = activePlayers.map(player => {
      const result = shootoutResults.find(r => r.playerId === player.id);
      if (result) {
        return {
          playerId: player.id,
          playerName: player.playerName,
          score: result.score,
          throws: [result.dart1, result.dart2, result.dart3],
          rank: 0
        };
      } else {
        // Fallback für Mock-Daten
        return {
          playerId: player.id,
          playerName: player.playerName,
          score: Math.floor(Math.random() * 180),
          throws: [Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60)],
          rank: 0
        };
      }
    });

    // Sortiere nach Score für Rangliste
    shootoutResults.sort((a, b) => b.score - a.score);
    shootoutResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        shootoutBoardId: tournament.shootoutBoardId,
        checkoutMode: tournament.checkoutMode
      },
      shootoutResults
    });

  } catch (error) {
    console.error('Error fetching shootout data:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Shootout-Daten' },
      { status: 500 }
    );
  }
}
