import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.user.id },
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

    const tournamentWhere = isAdmin ? {} : { id: { in: allowedTournamentIds } };
    const playerWhere = isAdmin ? {} : { tournamentId: { in: allowedTournamentIds } };
    const gameWhere = isAdmin ? {} : { tournament: { id: { in: allowedTournamentIds } } };

    // Hole echte Statistiken aus der Datenbank
    const [
      userCount,
      tournamentCount,
      activeTournaments,
      playerCount,
      activePlayers,
      totalGames,
      activeGames
    ] = await Promise.all([
      // Anzahl der Benutzer (nur für Global Admin relevant/sichtbar, sonst 0 oder gefiltert?)
      // Wir zeigen einfach alle User an, oder man könnte es auf User beschränken, die in den eigenen Turnieren sind.
      // Der Einfachheit halber: Global Count für Admin, sonst Count der Spieler in eigenen Turnieren (als Proxy für User)
      isAdmin ? prisma.user.count() : prisma.tournamentPlayer.count({ where: playerWhere }),

      // Anzahl der Turniere
      prisma.tournament.count({ where: tournamentWhere }),

      // Anzahl der aktiven Turniere (REGISTRATION_OPEN oder ACTIVE)
      prisma.tournament.count({
        where: {
          ...tournamentWhere,
          status: {
            in: ['REGISTRATION_OPEN', 'ACTIVE']
          }
        }
      }),

      // Gesamtanzahl der Turnier-Spieler
      prisma.tournamentPlayer.count({ where: playerWhere }),

      // Anzahl der aktiven Spieler (in aktiven Turnieren)
      prisma.tournamentPlayer.count({
        where: {
          ...playerWhere,
          tournament: {
            ...tournamentWhere, // Ensure tournament is also allowed (redundant but safe)
            status: {
              in: ['REGISTRATION_OPEN', 'ACTIVE']
            }
          }
        }
      }),

      // Gesamtanzahl der Spiele
      prisma.game.count({ where: gameWhere }),

      // Anzahl der aktiven Spiele
      prisma.game.count({
        where: {
          ...gameWhere,
          status: {
            in: ['WAITING', 'ACTIVE']
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        userCount,
        tournamentCount,
        activeTournaments,
        playerCount,
        activePlayers,
        totalGames,
        activeGames
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Statistiken'
    }, { status: 500 });
  }
}
