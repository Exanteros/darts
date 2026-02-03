import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVictoryEmail, sendDefeatEmail, sendRoundNotificationEmail, sendFinalWinnerEmail } from '@/lib/mail-events';
import { broadcastGameUpdate } from '@/lib/websocketBroadcast';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyBoardAccess } from '@/lib/board-auth';

/**
 * Befördert den Gewinner eines Spiels in die nächste Runde
 */
async function promoteWinnerToNextRound(
  tournamentId: string,
  gameId: string,
  winnerId: string,
  currentRound: number
) {
  try {
    const nextRound = currentRound + 1;

    // Finde alle Spiele der aktuellen Runde
    const currentRoundGames = await prisma.game.findMany({
      where: {
        tournamentId: tournamentId,
        round: currentRound
      },
      orderBy: { id: 'asc' }
    });

    // Finde den Index des aktuellen Spiels
    const gameIndex = currentRoundGames.findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      console.log('⚠️  Spiel nicht in aktueller Runde gefunden');
      return;
    }

    // Berechne, in welches Spiel der nächsten Runde der Gewinner kommt
    // Spiele werden paarweise kombiniert: Spiel 0 + 1 -> Spiel 0, Spiel 2 + 3 -> Spiel 1, etc.
    const nextGameIndex = Math.floor(gameIndex / 2);
    
    // Prüfe, ob es eine nächste Runde gibt
    const nextRoundGames = await prisma.game.findMany({
      where: {
        tournamentId: tournamentId,
        round: nextRound
      },
      orderBy: { id: 'asc' }
    });

    if (nextRoundGames.length === 0) {
      console.log('🏁 Finale gewonnen - keine nächste Runde');
      return;
    }

    if (nextGameIndex >= nextRoundGames.length) {
      console.log('⚠️  Kein entsprechendes Spiel in nächster Runde gefunden - erstelle neues Spiel');
      
      // Load Bracket Config for Legs
      const bracketConfig = await prisma.bracketConfig.findFirst();
      let legsPerRound = { round1: 3, round2: 3, round3: 3, round4: 3, round5: 5, round6: 7 };
      try {
        if (bracketConfig?.legsPerRound) {
            legsPerRound = JSON.parse(bracketConfig.legsPerRound);
        }
      } catch (e) {
        console.error('Error parsing legsPerRound:', e);
      }
      
      const legsToWin = Math.ceil((legsPerRound[`round${nextRound}` as keyof typeof legsPerRound] || 3) / 2);

      // Bestimme Player1/2 Position
      const isPlayer1 = gameIndex % 2 === 0;

      await prisma.game.create({
        data: {
          tournamentId,
          round: nextRound,
          legsToWin,
          status: 'WAITING',
          // Set winner as player 1 or 2
          player1Id: isPlayer1 ? winnerId : null,
          player2Id: !isPlayer1 ? winnerId : null
        }
      });
      
      console.log(`✨ Neues Spiel für Runde ${nextRound} erstellt (Legs: ${legsToWin})`);
      return;
    }

    const nextGame = nextRoundGames[nextGameIndex];

    // Bestimme, ob der Gewinner Player1 oder Player2 im nächsten Spiel wird
    // Gerade Indizes (0, 2, 4, ...) -> Player1
    // Ungerade Indizes (1, 3, 5, ...) -> Player2
    const isPlayer1 = gameIndex % 2 === 0;

    const updateData = isPlayer1
      ? { player1Id: winnerId }
      : { player2Id: winnerId };

    await prisma.game.update({
      where: { id: nextGame.id },
      data: updateData
    });

    const winner = await prisma.tournamentPlayer.findUnique({
      where: { id: winnerId }
    });

    console.log(`➡️  ${winner?.playerName} befördert zu Runde ${nextRound} (als ${isPlayer1 ? 'Spieler 1' : 'Spieler 2'})`);

  } catch (error) {
    console.error('❌ Fehler beim Befördern des Gewinners:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, winner, player1Score, player2Score } = body;

    if (!gameId || !winner) {
      return NextResponse.json({
        success: false,
        message: 'Spiel-ID und Gewinner sind erforderlich'
      }, { status: 400 });
    }

    // Auth Check
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const boardCode = request.headers.get('x-board-code');
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode);

    if (!isAdmin && !isBoardAuthorized) {
      return NextResponse.json({
        success: false,
        message: 'Nicht autorisiert'
      }, { status: 403 });
    }

    // Prüfe ob das Spiel existiert
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player1: true,
        player2: true,
        board: true
      }
    });

    if (!game) {
      return NextResponse.json({
        success: false,
        message: 'Spiel nicht gefunden'
      }, { status: 404 });
    }

    if (game.status === 'FINISHED') {
      return NextResponse.json({
        success: false,
        message: 'Spiel wurde bereits beendet'
      }, { status: 400 });
    }

    // Bestimme den Gewinner
    const winnerId = game.player1?.playerName === winner 
      ? game.player1Id 
      : game.player2?.playerName === winner 
      ? game.player2Id 
      : null;

    if (!winnerId) {
      return NextResponse.json({
        success: false,
        message: 'Gewinner nicht gefunden'
      }, { status: 400 });
    }

    // Aktualisiere das Spiel
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'FINISHED',
        winnerId: winnerId,
        player1Legs: player1Score || 0,
        player2Legs: player2Score || 0
      },
      include: {
        player1: true,
        player2: true,
        winner: true
      }
    });

    // Entferne die Board-Zuweisung
    if (game.boardId) {
      await prisma.game.update({
        where: { id: gameId },
        data: {
          boardId: null
        }
      });
    }

    // Befördere Gewinner in die nächste Runde
    await promoteWinnerToNextRound(game.tournamentId, gameId, winnerId, game.round);

    // Sende Victory/Defeat Emails
    if (updatedGame.player1 && updatedGame.player2) {
      const winnerPlayer = updatedGame.winner;
      const loserPlayer = winnerPlayer?.id === updatedGame.player1.id ? updatedGame.player2 : updatedGame.player1;

      if (winnerPlayer && loserPlayer) {
        // Hole User-Daten
        const winnerUser = await prisma.user.findFirst({
          where: { 
            tournamentPlayers: { some: { id: winnerPlayer.id } }
          }
        });
        const loserUser = await prisma.user.findFirst({
          where: {
            tournamentPlayers: { some: { id: loserPlayer.id } }
          }
        });

        const winnerScore = winnerPlayer.id === updatedGame.player1.id ? updatedGame.player1Legs : updatedGame.player2Legs;
        const loserScore = loserPlayer.id === updatedGame.player1.id ? updatedGame.player1Legs : updatedGame.player2Legs;

        // Check if it's the final
        const isFinal = game.round === (await prisma.game.findMany({ 
          where: { tournamentId: game.tournamentId },
          select: { round: true },
          orderBy: { round: 'desc' },
          take: 1
        }))[0]?.round;

        if (winnerUser?.email) {
          if (isFinal) {
            // Sende Final Winner Email
            const tournament = await prisma.tournament.findUnique({ where: { id: game.tournamentId } });
            const totalWins = await prisma.game.count({
              where: { winnerId: winnerPlayer.id, status: 'FINISHED' }
            });
            sendFinalWinnerEmail(
              winnerUser.email,
              tournament?.name || 'Turnier',
              totalWins,
              game.round,
              `${winnerScore}:${loserScore}`
            );
          } else {
            // Sende Victory Email
            sendVictoryEmail(
              winnerUser.email,
              game.round,
              winnerScore || 0,
              loserPlayer.playerName,
              loserScore || 0,
              game.round + 1
            );
          }
        }

        if (loserUser?.email) {
          // Sende Defeat Email
          sendDefeatEmail(
            loserUser.email,
            game.round,
            loserScore || 0,
            winnerPlayer.playerName,
            winnerScore || 0
          );
        }
      }
    }

    console.log(`Game ${gameId} finished. Winner: ${winner} (${player1Score}-${player2Score})`);

    // Broadcast game update via WebSocket
    broadcastGameUpdate({
      gameId: updatedGame.id,
      status: 'finished',
      winner: updatedGame.winner?.playerName
    });

    return NextResponse.json({
      success: true,
      message: 'Spiel erfolgreich beendet',
      game: {
        id: updatedGame.id,
        winner: updatedGame.winner?.playerName,
        player1: updatedGame.player1?.playerName,
        player2: updatedGame.player2?.playerName,
        player1Legs: updatedGame.player1Legs,
        player2Legs: updatedGame.player2Legs,
        status: updatedGame.status
      }
    });
  } catch (error) {
    console.error('Error finishing game:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Beenden des Spiels',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
