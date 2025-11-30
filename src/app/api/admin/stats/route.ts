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

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

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
      // Anzahl der Benutzer
      prisma.user.count(),

      // Anzahl der Turniere
      prisma.tournament.count(),

      // Anzahl der aktiven Turniere (REGISTRATION_OPEN oder ACTIVE)
      prisma.tournament.count({
        where: {
          status: {
            in: ['REGISTRATION_OPEN', 'ACTIVE']
          }
        }
      }),

      // Gesamtanzahl der Turnier-Spieler
      prisma.tournamentPlayer.count(),

      // Anzahl der aktiven Spieler (in aktiven Turnieren)
      prisma.tournamentPlayer.count({
        where: {
          tournament: {
            status: {
              in: ['REGISTRATION_OPEN', 'ACTIVE']
            }
          }
        }
      }),

      // Gesamtanzahl der Spiele
      prisma.game.count(),

      // Anzahl der aktiven Spiele
      prisma.game.count({
        where: {
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
