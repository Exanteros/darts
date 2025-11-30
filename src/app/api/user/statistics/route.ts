import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Find the user's player record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Find player by userId
    const player = await prisma.tournamentPlayer.findFirst({
      where: { 
        userId: session.user.id 
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    if (!player) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Du bist noch in keinem Turnier angemeldet. Melde dich an, um deine Statistiken zu sehen!' 
        },
        { status: 200 }
      );
    }

    // Count total tournaments
    const tournamentsCount = await prisma.tournamentPlayer.count({
      where: { userId: session.user.id }
    });

    // Calculate additional metrics
    const gamesPlayed = (player.matchesPlayed || 0) + (player.legsPlayed || 0);
    const gamesWon = (player.matchesWon || 0) + (player.legsWon || 0);
    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

    const playerStats = {
      playerId: player.id,
      playerName: player.playerName,
      tournaments: tournamentsCount,
      gamesPlayed: gamesPlayed,
      gamesWon: gamesWon,
      winRate: winRate,
      average: player.average || 0,
      firstNineAvg: player.firstNineAvg || 0,
      highFinish: player.highFinish || 0,
      oneEighties: player.oneEighties || 0,
      checkoutRate: player.checkoutRate || 0,
      doubleRate: player.doubleRate || 0,
      bestLeg: player.bestLeg || null,
      totalPoints: player.totalPoints || 0,
      currentRank: player.currentRank || null,
      prizeMoney: player.prizeMoney || 0
    };

    return NextResponse.json({
      success: true,
      stats: playerStats
    });

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
