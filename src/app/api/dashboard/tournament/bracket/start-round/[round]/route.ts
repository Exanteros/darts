import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Starte eine bestimmte Runde
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ round: string }> }
) {
  try {
    const { round } = await context.params;
    const roundNumber = parseInt(round);

    if (isNaN(roundNumber) || roundNumber < 1) {
      return NextResponse.json({ error: 'Ungültige Rundennummer' }, { status: 400 });
    }

    // Finde das aktuelle Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Kein Turnier gefunden' }, { status: 404 });
    }

    // Prüfe, ob die vorherige Runde abgeschlossen ist (außer bei Runde 1)
    if (roundNumber > 1) {
      const previousRoundGames = await prisma.game.findMany({
        where: {
          tournamentId: tournament.id,
          round: roundNumber - 1,
          status: { not: 'FINISHED' }
        }
      });

      if (previousRoundGames.length > 0) {
        return NextResponse.json({
          error: `Runde ${roundNumber - 1} ist noch nicht abgeschlossen. ${previousRoundGames.length} Spiel(e) noch aktiv.`
        }, { status: 400 });
      }
    }

    // Finde alle Spiele der angegebenen Runde, die noch nicht gestartet sind
    const roundGames = await prisma.game.findMany({
      where: {
        tournamentId: tournament.id,
        round: roundNumber,
        status: { not: 'FINISHED' }
      }
    });

    if (roundGames.length === 0) {
      return NextResponse.json({
        error: `Keine Spiele für Runde ${roundNumber} gefunden oder alle bereits abgeschlossen`
      }, { status: 400 });
    }

    // Setze alle Spiele der Runde auf WAITING (damit sie Boards zugewiesen bekommen)
    const updateResult = await prisma.game.updateMany({
      where: {
        tournamentId: tournament.id,
        round: roundNumber,
        status: { not: 'FINISHED' }
      },
      data: {
        status: 'WAITING',
        boardId: null // Entferne Board-Zuweisungen, damit sie neu zugewiesen werden können
      }
    });

    return NextResponse.json({
      success: true,
      message: `Runde ${roundNumber} wurde gestartet. ${updateResult.count} Spiel(e) wurden aktiviert.`,
      round: roundNumber,
      gamesStarted: updateResult.count
    });

  } catch (error) {
    console.error('Fehler beim Starten der Runde:', error);
    return NextResponse.json({
      error: 'Interner Serverfehler beim Starten der Runde'
    }, { status: 500 });
  }
}