import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Aktualisiere Shootout-Status
export async function POST(request: NextRequest) {
  try {
    const { action, playerId, score } = await request.json();

    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        shootoutState: true
      }
    });

    if (!tournament || tournament.status !== 'SHOOTOUT') {
      return NextResponse.json(
        { error: 'Kein aktives Shootout gefunden' },
        { status: 404 }
      );
    }

    // Auth Check
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const boardCode = request.headers.get('x-board-code');
    
    let isBoardAuthorized = false;
    if (boardCode && tournament.shootoutBoardId) {
       const board = await prisma.board.findUnique({
         where: { id: tournament.shootoutBoardId }
       });
       if (board && board.accessCode === boardCode.toUpperCase()) {
         isBoardAuthorized = true;
       }
    }

    if (!isAdmin && !isBoardAuthorized) {
      return NextResponse.json({
        error: 'Nicht autorisiert'
      }, { status: 403 });
    }

    if (action === 'select_player') {
      // Admin wählt einen Spieler aus
      if (!playerId) {
        return NextResponse.json(
          { error: 'PlayerId erforderlich' },
          { status: 400 }
        );
      }

      // Hole oder erstelle Shootout-Status
      let shootoutState = tournament.shootoutState;
      if (!shootoutState) {
        shootoutState = await prisma.shootoutState.create({
          data: {
            tournamentId: tournament.id,
            status: 'player_selected',
            currentPlayerId: playerId
          }
        });
      } else {
        // Aktualisiere bestehenden Status
        shootoutState = await prisma.shootoutState.update({
          where: { id: shootoutState.id },
          data: {
            status: 'player_selected',
            currentPlayerId: playerId
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Spieler ${playerId} für Shootout ausgewählt`,
        playerId: playerId,
        status: 'player_selected'
      });

    } else if (action === 'start_throwing') {
      // Shootout-Start für Spieler auf der Scheibe
      if (!tournament.shootoutState || !tournament.shootoutState.currentPlayerId) {
        return NextResponse.json(
          { error: 'Kein Spieler ausgewählt' },
          { status: 400 }
        );
      }

      // Status auf "throwing" setzen
      await prisma.shootoutState.update({
        where: { id: tournament.shootoutState.id },
        data: {
          status: 'throwing'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Shootout gestartet - Spieler wirft',
        status: 'throwing'
      });

    } else if (action === 'complete_throwing') {
      // Spieler hat die 3 Würfe abgeschlossen
      if (!tournament.shootoutState || !tournament.shootoutState.currentPlayerId) {
        return NextResponse.json(
          { error: 'Kein aktiver Spieler gefunden' },
          { status: 400 }
        );
      }

      // Status auf "waiting_for_admin" setzen
      await prisma.shootoutState.update({
        where: { id: tournament.shootoutState.id },
        data: {
          status: 'waiting_for_admin'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Würfe abgeschlossen - warte auf Admin',
        status: 'waiting_for_admin'
      });

    } else if (action === 'finish_player' || action === 'cancel_selection') {
      // Admin bestätigt das Ende des Spielers oder bricht die Auswahl ab
      if (!tournament.shootoutState) {
        return NextResponse.json(
          { error: 'Kein Shootout-Status gefunden' },
          { status: 400 }
        );
      }

      // Zurück zu "waiting_for_selection" für nächsten Spieler
      await prisma.shootoutState.update({
        where: { id: tournament.shootoutState.id },
        data: {
          status: 'waiting_for_selection',
          currentPlayerId: null
        }
      });

      return NextResponse.json({
        success: true,
        message: action === 'cancel_selection' ? 'Auswahl abgebrochen' : 'Spieler abgeschlossen - bereit für nächste Auswahl',
        status: 'waiting_for_selection'
      });

    } else if (action === 'set_active_player') {
      // Legacy-Support für die alte API
      return NextResponse.json({
        success: true,
        message: `Spieler ${playerId} als aktiv markiert`,
        playerId: playerId
      });

    } else {
      return NextResponse.json(
        { error: 'Unbekannte Aktion' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating shootout status:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Shootout-Status' },
      { status: 500 }
    );
  }
}
