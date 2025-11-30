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

    // Hole alle Turniere mit Spieler-Statistiken
    const tournaments = await prisma.tournament.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatiere die Daten für das Frontend (vereinfacht für Access-Seite)
    const formattedTournaments = tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      status: tournament.status
    }));

    return NextResponse.json({
      tournaments: formattedTournaments
    });

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Turniere'
    }, { status: 500 });
  }
}
