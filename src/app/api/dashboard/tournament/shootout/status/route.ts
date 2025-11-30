import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Hole aktuellen Shootout-Status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activePlayerId = searchParams.get('activePlayer');

    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: {
          orderBy: { seed: 'asc' }
        },
        shootoutState: {
          include: {
            currentPlayer: true
          }
        }
      }
    });

    if (!tournament || tournament.status !== 'SHOOTOUT') {
      return NextResponse.json({
        status: null,
        currentPlayer: null,
        message: 'Kein aktives Shootout'
      });
    }

    // Finde aktive Spieler (die noch kein Shootout gemacht haben)
    const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE');

    // Prüfe Shootout-Ergebnisse
    const shootoutResults = await prisma.shootoutResult.findMany({
      where: { tournamentId: tournament.id }
    });

    const playersWithoutShootout = activePlayers.filter(player =>
      !shootoutResults.some(result => result.playerId === player.id)
    );

    // Finde Spieler, die bereits ein Shootout gemacht haben
    const playersWithShootout = activePlayers.filter(player =>
      shootoutResults.some(result => result.playerId === player.id)
    );

    // Hole oder erstelle Shootout-Status
    let shootoutState = tournament.shootoutState;
    if (!shootoutState) {
      shootoutState = await prisma.shootoutState.create({
        data: {
          tournamentId: tournament.id,
          status: 'waiting_for_selection'
        },
        include: {
          currentPlayer: true
        }
      });
    }

    // Basiere Status auf dem ShootoutState
    const currentPlayer = shootoutState.currentPlayer;

    if (shootoutState.status === 'player_selected' && currentPlayer) {
      // Admin hat Spieler ausgewählt - zeige "Player X läuft" Status
      return NextResponse.json({
        status: 'player_selected',
        currentPlayer: {
          id: currentPlayer.id,
          playerName: currentPlayer.playerName
        },
        message: `${currentPlayer.playerName} wurde ausgewählt - warte auf Shootout-Start`,
        remainingPlayers: playersWithoutShootout.length,
        completedPlayers: playersWithShootout.length,
        throwsCount: 0
      });
    }

    if (shootoutState.status === 'throwing' && currentPlayer) {
      // Spieler wirft gerade
      return NextResponse.json({
        status: 'throwing',
        currentPlayer: {
          id: currentPlayer.id,
          playerName: currentPlayer.playerName
        },
        message: `${currentPlayer.playerName} wirft gerade seine 3 Darts...`,
        remainingPlayers: playersWithoutShootout.length,
        completedPlayers: playersWithShootout.length,
        throwsCount: 0
      });
    }

    if (shootoutState.status === 'waiting_for_admin' && currentPlayer) {
      // Spieler hat geworfen, wartet auf nächste Admin-Auswahl
      return NextResponse.json({
        status: 'waiting_for_admin',
        currentPlayer: {
          id: currentPlayer.id,
          playerName: currentPlayer.playerName
        },
        message: `${currentPlayer.playerName} hat geworfen - warte auf nächste Spielerauswahl`,
        remainingPlayers: playersWithoutShootout.length,
        completedPlayers: playersWithShootout.length,
        throwsCount: 3
      });
    }

    // Alle Spieler haben Shootout gemacht
    if (playersWithoutShootout.length === 0) {
      return NextResponse.json({
        status: 'completed',
        currentPlayer: null,
        message: 'Alle Spieler haben das Shootout abgeschlossen',
        remainingPlayers: 0,
        completedPlayers: playersWithShootout.length
      });
    }

    // Warte auf erste Spielerauswahl oder nächste Auswahl nach abgeschlossenem Wurf
    return NextResponse.json({
      status: 'waiting_for_selection',
      currentPlayer: null,
      message: `${playersWithoutShootout.length} Spieler warten auf Auswahl für Shootout`,
      remainingPlayers: playersWithoutShootout.length,
      completedPlayers: playersWithShootout.length
    });

  } catch (error) {
    console.error('Error checking shootout status:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Shootout-Status' },
      { status: 500 }
    );
  }
}
