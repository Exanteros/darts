import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { blurPlayerData } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht autorisiert'
      }, { status: 401 });
    }

    const { tournamentId, playerName } = await request.json();

    if (!tournamentId || !playerName) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID und Spielername sind erforderlich'
      }, { status: 400 });
    }

    // Überprüfe, ob das Turnier existiert und Anmeldungen offen sind
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { players: true }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({
        success: false,
        message: 'Anmeldung ist nicht mehr möglich'
      }, { status: 400 });
    }

    // Zähle nur aktive Spieler (nicht Warteliste oder Zurückgezogen)
    const activePlayerCount = await prisma.tournamentPlayer.count({
      where: {
        tournamentId: tournamentId,
        status: {
          in: ['REGISTERED', 'CONFIRMED', 'ACTIVE']
        }
      }
    });

    let playerStatus = 'REGISTERED';
    let successMessage = 'Erfolgreich für das Turnier angemeldet';

    if (activePlayerCount >= tournament.maxPlayers) {
      playerStatus = 'WAITING_LIST';
      successMessage = 'Turnier ist voll. Sie wurden auf die Warteliste gesetzt.';
    }

    // Überprüfe, ob der Benutzer bereits angemeldet ist
    const existingPlayer = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: session.user.id
        }
      }
    });

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        message: 'Sie sind bereits für dieses Turnier angemeldet'
      }, { status: 400 });
    }

    // Erstelle TournamentPlayer
    const tournamentPlayer = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        userId: session.user.id,
        playerName,
        status: playerStatus as any // Cast to any to avoid type issues with new enum value if types aren't regenerated yet
      },
      include: {
        tournament: true
      }
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      player: blurPlayerData(tournamentPlayer)
    });
  } catch (error) {
    console.error('Turnier-Anmeldung Fehler:', error);
    return NextResponse.json({
      success: false,
      message: 'Ein Fehler ist aufgetreten'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht autorisiert'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID ist erforderlich'
      }, { status: 400 });
    }

    // Hole die Anmeldung des Benutzers für dieses Turnier
    const player = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: session.user.id
        }
      },
      include: {
        tournament: true
      }
    });

    return NextResponse.json({
      success: true,
      player: player ? blurPlayerData(player) : null
    });
  } catch (error) {
    console.error('Turnier-Anmeldung Abruf Fehler:', error);
    return NextResponse.json({
      success: false,
      message: 'Ein Fehler ist aufgetreten'
    }, { status: 500 });
  }
}
