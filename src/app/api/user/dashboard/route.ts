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

    const userId = session.user.id;

    // Hole User-Details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true
      }
    });

    // Hole alle Turnier-Registrierungen des Users
    const userTournaments = await prisma.tournamentPlayer.findMany({
      where: {
        userId: userId
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            entryFee: true
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    // Formatiere die Daten für das Frontend
    const tournaments = userTournaments.map(player => ({
      id: player.tournament.id,
      name: player.tournament.name,
      status: player.status,
      tournamentStatus: player.tournament.status,
      startDate: player.tournament.startDate.toISOString(),
      playerName: player.playerName,
      paid: player.paid,
      paymentStatus: player.paymentStatus || 'PENDING',
      paymentMethod: player.paymentMethod,
      registeredAt: player.registeredAt.toISOString(),
      entryFee: player.tournament.entryFee || 0,
      // Statistiken
      average: player.average,
      firstNineAvg: player.firstNineAvg,
      highFinish: player.highFinish,
      oneEighties: player.oneEighties || 0,
      checkoutRate: player.checkoutRate,
      matchesPlayed: player.matchesPlayed || 0,
      matchesWon: player.matchesWon || 0,
      currentRank: player.currentRank,
      prizeMoney: player.prizeMoney || 0
    }));

    // Berechne Statistiken
    const registeredTournaments = tournaments.length;
    const activeTournaments = tournaments.filter(t =>
      t.status === 'ACTIVE' || t.status === 'CONFIRMED'
    ).length;
    const completedTournaments = tournaments.filter(t =>
      t.status === 'ELIMINATED' || t.status === 'WITHDRAWN'
    ).length;
    const totalPaid = tournaments
      .filter(t => t.paid && t.entryFee)
      .reduce((sum, t) => sum + t.entryFee, 0);

    return NextResponse.json({
      success: true,
      user,
      tournaments,
      stats: {
        registeredTournaments,
        activeTournaments,
        completedTournaments,
        totalPaid
      }
    });

  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der User-Daten'
    }, { status: 500 });
  }
}
