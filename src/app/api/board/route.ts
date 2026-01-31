import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSecureBoardCode } from '@/lib/board-code-generator';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Authentifizierung erforderlich'
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

    // Hole alle Scheiben für das Turnier
    const boards = await prisma.board.findMany({
      where: {
        tournamentId: tournamentId
      },
      include: {
        games: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            player1: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            player2: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        priority: 'asc'
      }
    });

    // Formatiere die Daten für das Frontend
    const formattedBoards = boards.map(board => ({
      id: board.id,
      name: board.name,
      isActive: board.isActive,
      priority: board.priority,
      currentGame: board.games[0] ? {
        id: board.games[0].id,
        round: board.games[0].round,
        status: board.games[0].status,
        player1: {
          name: board.games[0]?.player1?.playerName,
          userName: board.games[0]?.player1?.user?.name
        },
        player2: board.games[0].player2 ? {
          name: board.games[0]?.player2?.playerName,
          userName: board.games[0]?.player2?.user?.name
        } : null,
        score: {
          player1Legs: board.games[0]?.player1Legs,
          player2Legs: board.games[0]?.player2Legs,
          legsToWin: board.games[0]?.legsToWin
        }
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedBoards
    });

  } catch (error) {
    console.error('Fehler beim Laden der Scheiben:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Scheiben'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, tournamentId, priority } = body;

    if (!name || !tournamentId) {
      return NextResponse.json({
        success: false,
        message: 'Name und Turnier-ID sind erforderlich'
      }, { status: 400 });
    }

    // Erstelle neue Scheibe
    const board = await prisma.board.create({
      data: {
        name,
        tournamentId,
        priority: priority || 1,
        accessCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        isActive: true
      }
    });
    


    return NextResponse.json({
      success: true,
      message: 'Scheibe erfolgreich erstellt',
      data: board
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Scheibe:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Erstellen der Scheibe'
    }, { status: 500 });
  }
}
