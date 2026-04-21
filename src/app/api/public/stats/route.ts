import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

// Priorisiere in Gange befindliche oder mit offener Registrierung, ansonsten das Nächste
      let tournament = await prisma.tournament.findFirst({
        where: { status: { in: ['ACTIVE', 'REGISTRATION_OPEN'] } },
        orderBy: { startDate: 'asc' }
      });

      if (!tournament) {
        tournament = await prisma.tournament.findFirst({
          where: { startDate: { gte: now } },
          orderBy: { startDate: 'asc' }
        });
      }

      // Fallback: das neueste Turnier
      if (!tournament) {
        tournament = await prisma.tournament.findFirst({ orderBy: { startDate: 'desc' } });
    }

    const stats: any = {
      participants: 0,
      boards: 0,
      gameMode: '501',
      checkoutMode: 'DOUBLE_OUT',
      champions: 0
    };

    if (tournament) {
      const participants = await prisma.tournamentPlayer.count({
        where: {
          tournamentId: tournament.id,
          status: { in: ['REGISTERED', 'CONFIRMED', 'ACTIVE'] }
        }
      });

      const boards = await prisma.board.count({ where: { tournamentId: tournament.id, isActive: true } });

      // Wenn eine maximale Teilnehmerzahl definiert ist, zeige diese ("maximal möglich"),
      // sonst die aktuell registrierten Teilnehmer.
      stats.participants = tournament.maxPlayers ?? participants;
      stats.boards = boards;
      // Set enforced values per request: always show game mode as '501' and a single champion
      stats.gameMode = '501';
      stats.checkoutMode = tournament.checkoutMode || stats.checkoutMode;
      // Always one champion (there is only a single winner)
      stats.champions = 1;
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error in /api/public/stats:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Laden der Statistiken' }, { status: 500 });
  }
}
