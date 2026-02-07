import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET - Lade Turnierbaum-Daten
export async function GET() {
  try {
    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

    let tournament;
    
    if (activeTournamentId) {
      tournament = await prisma.tournament.findUnique({
        where: { id: activeTournamentId },
        include: { players: { orderBy: { seed: 'asc' } } }
      });
    }

    if (!tournament) {
      tournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { players: { orderBy: { seed: 'asc' } } }
      });
    }

    if (!tournament) {
      return NextResponse.json({ 
        tournament: null, games: [], boards: [], brackets: null,
        shootoutResults: [], shootoutStats: { totalPlayers: 0, completedShootouts: 0, pendingShootouts: 0, progressPercentage: 0 }
      });
    }

    const games = await prisma.game.findMany({
      where: { 
        tournamentId: tournament.id,
        round: { not: 999 }, // Exclude test games
        // player1Id: { not: null }, // Removed to show empty bracket slots
        // player2Id: { not: null }  // Removed to show empty bracket slots
      },
      include: { player1: true, player2: true, winner: true, board: true },
      orderBy: [{ round: 'asc' }, { id: 'asc' }]
    });

    let boards = await prisma.board.findMany({
      where: { isActive: true },
      include: { games: { where: { status: { in: ['ACTIVE', 'WAITING'] } }, include: { player1: true, player2: true } } },
      orderBy: { priority: 'asc' }
    });

    if (boards.length === 0) {
      for (let i = 1; i <= 3; i++) {
        await prisma.board.create({
          data: {
            name: `Scheibe ${i}`, tournamentId: tournament.id, isActive: true, priority: i,
            accessCode: `BOARD_${i}`, legSettings: { legsPerGame: 3 }
          }
        });
      }
      boards = await prisma.board.findMany({
        where: { tournamentId: tournament.id },
        include: { games: { where: { status: { in: ['ACTIVE', 'WAITING'] } }, include: { player1: true, player2: true } } },
        orderBy: { priority: 'asc' }
      });
    }

    // Load configurations
    const bracketConfig = await prisma.bracketConfig.findFirst() || {
      autoAssignBoards: true,
      mainBoardPriority: true,
      distributeEvenly: false,
      mainBoardPriorityLevel: 'finals'
    };
    
    const systemSettings = await prisma.systemSettings.findFirst({
      where: { id: 'default' }
    }) || { maxConcurrentGames: 8 };

    // Automatisch Boards zuweisen, wenn Spiele verfügbar sind
    if (games.length > 0 && bracketConfig.autoAssignBoards) {
      const activeGamesCount = await prisma.game.count({
          where: {
              tournamentId: tournament.id,
              status: 'ACTIVE'
          }
      });
      
      const maxSlots = systemSettings.maxConcurrentGames;
      
      // Only proceed if we haven't reached the global game limit
      if (activeGamesCount < maxSlots) {
        const [availableBoards, readyGames] = await Promise.all([
          prisma.board.findMany({
            where: { isActive: true },
            include: { games: { where: { status: 'ACTIVE' } } },
            orderBy: { priority: 'asc' }
          }),
          prisma.game.findMany({
            where: { tournamentId: tournament.id, status: 'WAITING', boardId: null, player1Id: { not: null }, player2Id: { not: null } },
            include: { player1: true, player2: true },
            orderBy: { round: 'asc' }
          })
        ]);

        // Algorithmus zur Berechnung der Spiel-Wichtigkeit
        const calculateGameImportance = (game: any, maxRound: number) => {
          if (bracketConfig.distributeEvenly && !bracketConfig.mainBoardPriority) {
              return 0; // Keine Priorisierung
          }

          let importance = 0;

          // 1. Runden-Bonus: Höhere Runden sind wichtiger
          const roundBonus = (game.round / maxRound) * 50;
          importance += roundBonus;

          // 2. Finale-Bonus: Letzte Runde bekommt extra Punkte
          if (game.round === maxRound) {
            importance += 100;
          }

          // 3. Ranking-Unterschied: Große Unterschiede machen Spiele spannender
          if (game.player1 && game.player2) {
            // Use seed if available, otherwise simplified ID check
            const player1Rank = game.player1.seed || 100;
            const player2Rank = game.player2.seed || 100;
            const rankDiff = Math.abs(player1Rank - player2Rank);
            importance += Math.min(rankDiff * 2, 50); 
          }

          return importance;
        };

        // Finde die maximale Runde für die Berechnung
        const maxRound = Math.max(...readyGames.map(g => g.round));

        // Sortiere Spiele nach Wichtigkeit (höchste zuerst)
        const sortedGames = readyGames
          .map(game => ({
            ...game,
            importance: calculateGameImportance(game, maxRound)
          }))
          .sort((a, b) => b.importance - a.importance);

        // Finde die Hauptscheibe (falls vorhanden)
        const mainBoard = availableBoards.find(board => board.isMain && board.games.length === 0);
        
        // Andere verfügbare Boards (frei)
        let otherBoards = availableBoards.filter(board => (!board.isMain || !bracketConfig.mainBoardPriority) && board.games.length === 0);
        
        if (bracketConfig.distributeEvenly) {
            // Shuffle boards slightly or just ensure we don't always pick top priority if distribute even is on?
            // "Alle Scheiben nutzen" might mean we just iterate all of them.
            // Existing sort by priority is usually fine, but let's ensure we use all.
            // Actually otherBoards are already filtered to be free boards.
        }

        let assignedCount = 0;
        let globalSlotsLeft = maxSlots - activeGamesCount;

        // 1. Weise das wichtigste Spiel der Hauptscheibe zu
        if (bracketConfig.mainBoardPriority && mainBoard && sortedGames.length > 0 && globalSlotsLeft > 0) {
          await prisma.game.update({
            where: { id: sortedGames[0].id },
            data: { boardId: mainBoard.id }
          });
          assignedCount++;
          globalSlotsLeft--;
          sortedGames.shift(); // Entferne das zugewiesene Spiel
        }

        // 2. Weise die restlichen Spiele den anderen verfügbaren Boards zu
        for (const board of otherBoards) {
          if (globalSlotsLeft > 0 && sortedGames.length > 0) {
            await prisma.game.update({
              where: { id: sortedGames[0].id },
              data: { boardId: board.id }
            });
            assignedCount++;
            globalSlotsLeft--;
            sortedGames.shift();
          }
        }

        // Spiele neu laden, wenn Boards zugewiesen wurden
        if (assignedCount > 0) {
          const updatedGames = await prisma.game.findMany({
            where: { tournamentId: tournament.id },
            include: { player1: true, player2: true, winner: true, board: true },
            orderBy: [{ round: 'asc' }, { id: 'asc' }]
          });
          games.splice(0, games.length, ...updatedGames);

          // Boards auch neu laden
          boards = await prisma.board.findMany({
            where: { isActive: true },
            include: { games: { where: { status: { in: ['ACTIVE', 'WAITING'] } }, include: { player1: true, player2: true } } },
            orderBy: { priority: 'asc' }
          });
        }
      }
    }

    const formattedGames = games.map(game => ({
      id: game.id, round: game.round,
      player1: game.player1 ? { id: game.player1.id, playerName: game.player1.playerName, seed: game.player1.seed } : null,
      player2: game.player2 ? { id: game.player2.id, playerName: game.player2.playerName, seed: game.player2.seed } : null,
      winner: game.winner ? { id: game.winner.id, playerName: game.winner.playerName } : null,
      status: game.status, boardId: game.boardId, boardName: game.board?.name || null,
      startedAt: game.startedAt, finishedAt: game.finishedAt
    }));

    const formattedBoards = boards.map(board => {
      const activeGame = board.games.find(g => g.status === 'ACTIVE');
      const waitingGames = board.games.filter(g => g.status === 'WAITING');
      return {
        id: board.id, name: board.name, priority: board.priority, isActive: board.isActive,
        currentGame: activeGame ? { id: activeGame.id, player1: activeGame.player1?.playerName, player2: activeGame.player2?.playerName, status: activeGame.status } : null,
        queueLength: waitingGames.length, status: activeGame ? 'active' : board.isActive ? 'idle' : 'maintenance'
      };
    });

    const gamesByRound = formattedGames.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push(game);
      return acc;
    }, {} as Record<number, any[]>);

    const rounds = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);
    const brackets = rounds.length > 0 ? {
      rounds: rounds.map(roundNum => {
        const roundsFromEnd = rounds.length - roundNum + 1;
        let roundName = `Runde ${roundNum}`;
        if (roundsFromEnd === 1) {
          roundName = 'Finale';
        }
        return { roundNumber: roundNum, roundName, matches: gamesByRound[roundNum] };
      }),
      totalRounds: rounds.length,
      activeRound: rounds.find(r => gamesByRound[r].some((g: any) => g.status === 'ACTIVE')) || Math.min(...rounds)
    } : null;

    const shootoutResults = await prisma.shootoutResult.findMany({
      where: { tournamentId: tournament.id },
      include: { player: true, board: true },
      orderBy: [{ rank: 'asc' }, { score: 'desc' }]
    });

    const formattedShootoutResults = shootoutResults.map(result => ({
      playerId: result.player.id, playerName: result.player.playerName, score: result.score,
      throws: [result.dart1, result.dart2, result.dart3].filter(dart => dart > 0),
      rank: result.rank, boardName: result.board?.name || null, completedAt: result.completedAt
    }));

    const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE' || p.status === 'CONFIRMED');
    const completedShootouts = shootoutResults.length;
    const totalPlayers = activePlayers.length;

    return NextResponse.json({
      tournament: {
        id: tournament.id, name: tournament.name, status: tournament.status,
        players: tournament.players.map(player => ({
          id: player.id, userId: player.userId, playerName: player.playerName, status: player.status, seed: player.seed
        })),
        shootoutBoardId: tournament.shootoutBoardId
      },
      games: formattedGames, boards: formattedBoards, brackets: brackets,
      shootoutResults: formattedShootoutResults,
      shootoutStats: { totalPlayers, completedShootouts, pendingShootouts: totalPlayers - completedShootouts, progressPercentage: totalPlayers > 0 ? Math.round((completedShootouts / totalPlayers) * 100) : 0 }
    });

  } catch (error) {
    console.error('Error loading tournament bracket:', error);
    return NextResponse.json({ error: 'Fehler beim Laden des Turnierbaums' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'assign_game': {
        const { gameId, boardId } = body;
        if (!gameId || !boardId) return NextResponse.json({ error: 'gameId und boardId sind erforderlich' }, { status: 400 });
        
        // Hole Board-Einstellungen für Legs
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        let updateData: any = { boardId, status: 'WAITING' };

        if (board && board.legSettings) {
            try {
                const settings = typeof board.legSettings === 'string' 
                   ? JSON.parse(board.legSettings) 
                   : board.legSettings;
                   
                if (settings.legsPerGame) {
                    updateData.legsToWin = Number(settings.legsPerGame);
                }
            } catch (e) {
                console.error("Error parsing board leg settings", e);
            }
        }

        await prisma.game.update({ where: { id: gameId }, data: updateData });
        return NextResponse.json({ success: true, message: 'Spiel erfolgreich zugewiesen' });
      }

      case 'start_game': {
        const { gameId } = body;
        if (!gameId) return NextResponse.json({ error: 'gameId ist erforderlich' }, { status: 400 });
        await prisma.game.update({ where: { id: gameId }, data: { status: 'ACTIVE', startedAt: new Date() } });
        return NextResponse.json({ success: true, message: 'Spiel erfolgreich gestartet' });
      }

      case 'auto_schedule': {
        const tournament = await prisma.tournament.findFirst({
          where: { OR: [{ status: 'ACTIVE' }, { status: 'SHOOTOUT' }] },
          orderBy: { createdAt: 'desc' }
        });
        if (!tournament) return NextResponse.json({ error: 'Kein aktives Turnier gefunden' }, { status: 404 });
        
        // Lade Bracket-Konfiguration
        const config = await prisma.bracketConfig.findFirst();
        
        if (config && !config.autoAssignBoards) {
           return NextResponse.json({ error: 'Automatische Zuordnung ist deaktiviert' }, { status: 400 });
        }

        // Parse legsPerRound
        let legsConfig: any = {};
        try {
            legsConfig = config?.legsPerRound ? JSON.parse(config.legsPerRound as string) : {};
        } catch (e) { console.error('Error parsing legs config', e); }

        const [availableBoards, readyGames] = await Promise.all([
          prisma.board.findMany({
            where: { tournamentId: tournament.id, isActive: true },
            include: { games: { where: { status: 'ACTIVE' } } },
            orderBy: { priority: 'asc' }
          }),
          prisma.game.findMany({
            where: { 
                tournamentId: tournament.id, 
                status: 'WAITING', 
                boardId: null, 
                player1Id: { not: null }, 
                player2Id: { not: null } 
            },
            orderBy: [{ round: 'desc' }, { id: 'asc' }] // Höhere Runden zuerst (Finale/Halbfinale)
          })
        ]);

        let assignedCount = 0;
        
        // Identifiziere Mainboard
        const mainBoard = availableBoards.find(b => b.isMain) || availableBoards[0];
        
        // Helper: Ist das Board frei?
        const isBoardFree = (boardId: string) => {
            const board = availableBoards.find(b => b.id === boardId);
            return board && board.games.length === 0;
        };

        // Helper: Markiere Board als belegt (lokal für diesen Request)
        const occupyBoard = (boardId: string) => {
            const board = availableBoards.find(b => b.id === boardId);
            if (board) board.games.push({ status: 'ACTIVE' } as any);
        };

        for (const game of readyGames) {
            let targetBoardId: string | null = null;
            
            // Prüfe auf Mainboard-Priorität
            const isImportantGame = config?.mainBoardPriority && (
                config.mainBoardPriorityLevel === 'all' ||
                (config.mainBoardPriorityLevel === 'semifinals' && game.round >= 5) ||
                (config.mainBoardPriorityLevel === 'finals' && game.round >= 6)
            );

            if (isImportantGame) {
                if (mainBoard && isBoardFree(mainBoard.id)) {
                    targetBoardId = mainBoard.id;
                }
            } else {
                // Normales Spiel
                const freeBoards = availableBoards.filter(b => b.games.length === 0);
                
                if (freeBoards.length > 0) {
                    if (config?.mainBoardPriority && mainBoard) {
                        // Wenn Mainboard Priorität aktiv ist, versuche Mainboard für unwichtige Spiele zu vermeiden,
                        // es sei denn es ist das einzige freie Board oder wir wollen alle nutzen
                        const otherBoards = freeBoards.filter(b => b.id !== mainBoard.id);
                        if (otherBoards.length > 0) {
                            targetBoardId = otherBoards[0].id;
                        } else if (config.distributeEvenly) {
                            targetBoardId = mainBoard.id;
                        }
                    } else {
                        // Nimm einfach das erste freie Board
                        targetBoardId = freeBoards[0].id;
                    }
                }
            }

            if (targetBoardId) {
                // Bestimme Legs für diese Runde aus Config
                let legsToWin = game.legsToWin;
                if (legsConfig) {
                    const roundKey = `round${game.round}`;
                    if (legsConfig[roundKey]) {
                        legsToWin = legsConfig[roundKey];
                    }
                }

                // Check Board Specific Settings (Overrides Bracket Config if set)
                const board = availableBoards.find(b => b.id === targetBoardId);
                if (board && board.legSettings) {
                    try {
                        const bSettings = typeof board.legSettings === 'string'
                            ? JSON.parse(board.legSettings)
                            : board.legSettings;
                        
                        // Type assertion for TS if needed, or just standard access
                        if ((bSettings as any).legsPerGame) {
                            legsToWin = Number((bSettings as any).legsPerGame);
                        }
                    } catch (e) {
                        // ignore parse error
                    }
                }

                await prisma.game.update({ 
                    where: { id: game.id }, 
                    data: { 
                        boardId: targetBoardId,
                        legsToWin: legsToWin 
                    } 
                });
                occupyBoard(targetBoardId);
                assignedCount++;
            }
        }
        return NextResponse.json({ success: true, assignedGames: assignedCount, message: `${assignedCount} Spiele automatisch zugewiesen` });
      }

      case 'reset_assignments': {
        const tournament = await prisma.tournament.findFirst({ where: { OR: [{ status: 'ACTIVE' }, { status: 'SHOOTOUT' }] } });
        if (!tournament) return NextResponse.json({ error: 'Kein aktives Turnier gefunden' }, { status: 404 });
        const result = await prisma.game.updateMany({
          where: { tournamentId: tournament.id, status: { in: ['WAITING', 'ACTIVE'] } },
          data: { boardId: null, status: 'WAITING', startedAt: null }
        });
        return NextResponse.json({ success: true, resetCount: result.count, message: `${result.count} Spiele zurückgesetzt` });
      }

      case 'update_board_status': {
        const { boardId, isActive } = body;
        if (!boardId || typeof isActive !== 'boolean') return NextResponse.json({ error: 'boardId und isActive sind erforderlich' }, { status: 400 });
        await prisma.board.update({ where: { id: boardId }, data: { isActive } });
        return NextResponse.json({ success: true, message: `Board ${isActive ? 'aktiviert' : 'deaktiviert'}` });
      }

      case 'reset_shootout': {
        const tournament = await prisma.tournament.findFirst({
          where: { OR: [{ status: 'ACTIVE' }, { status: 'SHOOTOUT' }] },
          orderBy: { createdAt: 'desc' }
        });
        if (!tournament) return NextResponse.json({ error: 'Kein aktives Turnier gefunden' }, { status: 404 });
        
        // Lösche alle Shootout-Ergebnisse
        const deletedResults = await prisma.shootoutResult.deleteMany({
          where: { tournamentId: tournament.id }
        });

        // Setze Turnier-Status zurück auf ACTIVE falls es SHOOTOUT war
        if (tournament.status === 'SHOOTOUT') {
          await prisma.tournament.update({
            where: { id: tournament.id },
            data: { status: 'ACTIVE' }
          });
        }

        return NextResponse.json({ 
          success: true, 
          deletedCount: deletedResults.count,
          message: `Shootout komplett zurückgesetzt - ${deletedResults.count} Ergebnisse gelöscht`
        });
      }

      case 'swap_players': {
        const { sourceMatchId, targetMatchId, sourcePlayer, targetPlayer } = body;
        if (!sourceMatchId || !targetMatchId || !sourcePlayer || !targetPlayer) {
          return NextResponse.json({ error: 'Alle Parameter sind erforderlich' }, { status: 400 });
        }

        // Hole beide Spiele
        const sourceGame = await prisma.game.findUnique({
          where: { id: sourceMatchId },
          include: { player1: true, player2: true }
        });
        const targetGame = await prisma.game.findUnique({
          where: { id: targetMatchId },
          include: { player1: true, player2: true }
        });

        if (!sourceGame || !targetGame) {
          return NextResponse.json({ error: 'Ein oder beide Spiele nicht gefunden' }, { status: 404 });
        }

        // Bestimme die Spieler-IDs zum Tauschen
        let sourcePlayerId: string | null = null;
        let targetPlayerId: string | null = null;

        if (sourcePlayer === 'player1') {
          sourcePlayerId = sourceGame.player1?.id || null;
        } else if (sourcePlayer === 'player2') {
          sourcePlayerId = sourceGame.player2?.id || null;
        }

        if (targetPlayer === 'player1') {
          targetPlayerId = targetGame.player1?.id || null;
        } else if (targetPlayer === 'player2') {
          targetPlayerId = targetGame.player2?.id || null;
        }

        // Tausche die Spieler
        const updateData1: any = {};
        const updateData2: any = {};

        if (sourcePlayer === 'player1') {
          updateData1.player1Id = targetPlayerId;
        } else if (sourcePlayer === 'player2') {
          updateData1.player2Id = targetPlayerId;
        }

        if (targetPlayer === 'player1') {
          updateData2.player1Id = sourcePlayerId;
        } else if (targetPlayer === 'player2') {
          updateData2.player2Id = sourcePlayerId;
        }

        await prisma.game.update({
          where: { id: sourceMatchId },
          data: updateData1
        });

        await prisma.game.update({
          where: { id: targetMatchId },
          data: updateData2
        });

        return NextResponse.json({ success: true, message: 'Spieler erfolgreich getauscht' });
      }

      default:
        return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in bracket POST:', error);
    return NextResponse.json({ error: 'Server-Fehler beim Verarbeiten der Anfrage' }, { status: 500 });
  }
}
