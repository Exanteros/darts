import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { blurPlayerData } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const { id: tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID ist erforderlich'
      }, { status: 400 });
    }

    // Überprüfe, ob das Turnier existiert
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    // Hole alle Spieler für dieses Turnier
    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        registeredAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      players: players.map(player => blurPlayerData({
        id: player.id,
        playerName: player.playerName,
        status: player.status,
        paid: player.paid,
        registeredAt: player.registeredAt.toISOString(),
        user: player.user
      }))
    });

  } catch (error) {
    console.error('Error fetching tournament players:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Spieler'
    }, { status: 500 });
  }
}
