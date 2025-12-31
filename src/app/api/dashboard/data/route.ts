import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Session-Prüfung
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const userId = session.user.id;
    const isGlobalAdmin = session.user.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isGlobalAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Keine Berechtigung'
        }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

    // Hole alle Turniere mit ihren Spielern (gefiltert nach Berechtigung)
    const tournaments = await prisma.tournament.findMany({
      where: isGlobalAdmin ? {} : {
        id: { in: allowedTournamentIds }
      },
      include: {
        _count: {
          select: {
            players: true
          }
        },
        players: {
          select: {
            id: true,
            playerName: true,
            status: true,
            paid: true,
            registeredAt: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        games: {
          select: {
            id: true,
            status: true,
            round: true,
            boardId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatiere die Daten für das Dashboard
    const dashboardData = tournaments.map((tournament, index) => {
      const activeGames = tournament.games.filter(g => g.status === 'ACTIVE' || g.status === 'WAITING');
      const currentRound = activeGames.length > 0 ? Math.max(...activeGames.map(g => g.round)) : 1;

      let statusText = 'Anmeldung';
      if (tournament.status === 'ACTIVE') {
        statusText = `Runde ${currentRound}`;
      } else if (tournament.status === 'FINISHED') {
        statusText = 'Beendet';
      } else if (tournament.status === 'REGISTRATION_CLOSED' || tournament.status === 'SHOOTOUT') {
        statusText = 'Shootout';
      }

      return {
        id: tournament.id,
        header: tournament.name,
        type: "Hauptturnier",
        status: statusText,
        target: tournament._count.players.toString(), // ECHTE Spielerzahl!
        limit: (tournament.maxPlayers / 2).toString(),
        reviewer: "Turnierleitung",
        scheibe: activeGames.length > 0 ? `Scheibe ${activeGames[0].boardId || '1'}` : "Noch nicht zugewiesen",
        spieler1: tournament.players.length > 0 ? tournament.players[0].playerName : "TBD",
        spieler2: tournament.players.length > 1 ? tournament.players[1].playerName : "TBD",
        status_detail: tournament.status === 'ACTIVE'
          ? `Live - ${activeGames.length} aktive Spiele`
          : tournament.status === 'REGISTRATION_OPEN'
            ? `${tournament._count.players} von ${tournament.maxPlayers} angemeldet`
            : "Turnier beendet",
        isCurrent: activeTournamentId ? tournament.id === activeTournamentId : index === 0
      };
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Dashboard-Daten'
    }, { status: 500 });
  }
}
