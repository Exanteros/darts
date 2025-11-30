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

    // Hole Turnier mit allen Details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            players: true,
            games: true
          }
        },
        players: {
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
        },
        boards: {
          orderBy: {
            priority: 'asc'
          }
        },
        games: {
          include: {
            player1: {
              select: {
                id: true,
                playerName: true
              }
            },
            player2: {
              select: {
                id: true,
                playerName: true
              }
            },
            board: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'asc'
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    // Verschleiere sensible Daten für Datenschutz
    const blurredTournament = {
      ...tournament,
      players: tournament.players.map(player => blurPlayerData(player)),
      games: tournament.games.map(game => ({
        ...game,
        player1: game.player1 ? blurPlayerData(game.player1) : null,
        player2: game.player2 ? blurPlayerData(game.player2) : null,
      }))
    };

    return NextResponse.json({
      success: true,
      tournament: blurredTournament
    });

  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden des Turniers'
    }, { status: 500 });
  }
}

export async function PUT(
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
    const { name, description, startDate, endDate, maxPlayers, entryFee, status } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID ist erforderlich'
      }, { status: 400 });
    }

    // Überprüfe, ob das Turnier existiert
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    // Aktualisiere Turnier
    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(maxPlayers && { maxPlayers }),
        ...(entryFee !== undefined && { entryFee }),
        ...(status && { status })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Turnier erfolgreich aktualisiert',
      tournament: updatedTournament
    });

  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Aktualisieren des Turniers'
    }, { status: 500 });
  }
}

export async function DELETE(
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
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    // Lösche Turnier (kaskadierend)
    await prisma.tournament.delete({
      where: { id: tournamentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Turnier erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Löschen des Turniers'
    }, { status: 500 });
  }
}
