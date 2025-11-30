import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlayerStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Basis-Query für TournamentPlayer
    let whereClause: any = {};

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    if (status) {
      whereClause.status = status as PlayerStatus;
    }

    if (search) {
      whereClause.OR = [
        { playerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Spieler mit Paginierung laden
    const [players, totalCount] = await Promise.all([
      prisma.tournamentPlayer.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true
            }
          },
          _count: {
            select: {
              gamesAsPlayer1: true,
              gamesAsPlayer2: true,
              throws: true
            }
          }
        },
        orderBy: [
          { registeredAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tournamentPlayer.count({ where: whereClause })
    ]);

    // Statistiken berechnen
    const stats = await prisma.tournamentPlayer.groupBy({
      by: ['status'],
      where: tournamentId ? { tournamentId } : {},
      _count: {
        id: true
      }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      players,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        ...statusStats
      }
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { playerId, updates } = body;

    if (!playerId || !updates) {
      return NextResponse.json(
        { error: 'PlayerId und Updates erforderlich' },
        { status: 400 }
      );
    }

    // Spieler aktualisieren
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'PlayerId erforderlich' },
        { status: 400 }
      );
    }

    // Spieler aus Turnier entfernen
    await prisma.tournamentPlayer.delete({
      where: { id: playerId }
    });

    return NextResponse.json({
      success: true,
      message: 'Spieler erfolgreich entfernt'
    });

  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
