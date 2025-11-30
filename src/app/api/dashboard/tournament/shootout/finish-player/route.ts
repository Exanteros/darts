import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Beende Shootout für einen Spieler
export async function POST(request: NextRequest) {
  try {
    const { playerId, score, throws } = await request.json();

    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Kein Turnier gefunden' },
        { status: 404 }
      );
    }

    // Speichere Shootout-Ergebnis in der Datenbank (erstelle oder aktualisiere)
    await prisma.shootoutResult.upsert({
      where: {
        tournamentId_playerId: {
          tournamentId: tournament.id,
          playerId: playerId
        }
      },
      update: {
        boardId: tournament.shootoutBoardId || undefined,
        score: score,
        dart1: throws[0] || 0,
        dart2: throws[1] || 0,
        dart3: throws[2] || 0
      },
      create: {
        tournamentId: tournament.id,
        playerId: playerId,
        boardId: tournament.shootoutBoardId || undefined,
        score: score,
        dart1: throws[0] || 0,
        dart2: throws[1] || 0,
        dart3: throws[2] || 0
      }
    });

    // Aktualisiere Spieler-Seed (vorläufig, wird bei Finalisierung korrigiert)
    await prisma.tournamentPlayer.update({
      where: {
        id: playerId
      },
      data: {
        seed: score // Vorläufiger Score als Seed
      }
    });

    // Prüfe, ob alle Spieler fertig sind
    const tournamentWithPlayers = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: true
      }
    });

    const activePlayers = tournamentWithPlayers?.players.filter(p => p.status === 'ACTIVE') || [];
    const completedPlayers = activePlayers.filter(p => p.seed !== null && p.seed > 0);

    return NextResponse.json({
      success: true,
      message: 'Shootout-Ergebnis gespeichert',
      allPlayersCompleted: completedPlayers.length === activePlayers.length
    });

  } catch (error) {
    console.error('Error finishing player shootout:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Shootout-Ergebnisses' },
      { status: 500 }
    );
  }
}
