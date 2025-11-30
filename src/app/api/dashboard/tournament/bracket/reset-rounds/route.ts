import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Finde das aktuelle Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Kein Turnier gefunden' }, { status: 404 });
    }

    // Setze alle Spiele zurück auf WAITING und entferne Board-Zuweisungen
    const updateResult = await prisma.game.updateMany({
      where: {
        tournamentId: tournament.id,
        status: { in: ['ACTIVE', 'FINISHED'] }
      },
      data: {
        status: 'WAITING',
        boardId: null,
        winnerId: null
      }
    });

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} Spiel(e) wurden zurückgesetzt.`,
      gamesReset: updateResult.count
    });

  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Runden:', error);
    return NextResponse.json({
      error: 'Interner Serverfehler beim Zurücksetzen der Runden'
    }, { status: 500 });
  }
}