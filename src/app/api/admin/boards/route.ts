import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Generiere einen sicheren 12-Zeichen Code
function generateSecureBoardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/admin/boards - Alle Boards abrufen
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    const boards = await prisma.board.findMany({
      where: isAdmin ? {} : {
        tournamentId: { in: allowedTournamentIds }
      },
      include: {
        tournament: true,
        games: {
          where: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'WAITING' }
            ]
          },
          include: {
            player1: true,
            player2: true
          }
        }
      },
      orderBy: { priority: 'desc' }
    });

    // Transform to match UI expectations
    const transformedBoards = boards.map((board: any) => {
      const activeGame = board.games.find((g: any) => g.status === 'ACTIVE');
      const waitingGames = board.games.filter((g: any) => g.status === 'WAITING');

      return {
        id: board.id,
        name: board.name,
        accessCode: board.accessCode,
        isActive: board.isActive,
        priority: board.priority,
        isMain: board.isMain || false,
        currentGame: activeGame ? {
          id: activeGame.id,
          player1: activeGame.player1?.playerName || 'Unbekannt',
          player2: activeGame.player2?.playerName || 'Unbekannt',
          status: activeGame.status
        } : null,
        queueLength: waitingGames.length
      };
    });

    return NextResponse.json({ success: true, boards: transformedBoards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/boards - Neues Board erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    const body = await request.json();
    const { name, location, legSettings } = body;

    // Finde das passende Turnier
    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;
    
    let tournament = null;

    if (activeTournamentId) {
      // Verify access
      if (isAdmin || allowedTournamentIds.includes(activeTournamentId)) {
        tournament = await prisma.tournament.findUnique({
          where: { id: activeTournamentId }
        });
      }
    }

    if (!tournament) {
      // Finde das erste aktive Turnier oder erstelle ein Standard-Turnier (nur Admin)
      // Filter by access
      tournament = await prisma.tournament.findFirst({
        where: {
          ...(isAdmin ? {} : { id: { in: allowedTournamentIds } }),
          status: 'ACTIVE'
        }
      });
    }

    if (!tournament) {
      // Fallback to any tournament
      tournament = await prisma.tournament.findFirst({
        where: isAdmin ? {} : { id: { in: allowedTournamentIds } }
      });
    }

    if (!tournament) {
      if (isAdmin) {
        // Erstelle ein Standard-Turnier falls keines existiert
        tournament = await prisma.tournament.create({
          data: {
            name: 'Darts Masters 2025',
            description: 'Standard Turnier',
            startDate: new Date(),
            maxPlayers: 64,
          }
        });
      } else {
        return NextResponse.json({ error: 'No tournament found' }, { status: 404 });
      }
    }

    const board = await prisma.board.create({
      data: {
        name: location ? `${name} (${location})` : name,
        tournamentId: tournament.id,
        accessCode: generateSecureBoardCode(), // Sicherer 12-Zeichen Code
        isActive: true,
        priority: 1,
        legSettings: legSettings ? JSON.stringify(legSettings) : JSON.stringify({ legsPerGame: 2 }),
      },
      include: {
        tournament: true
      }
    });

    // Transform to match UI expectations
    const transformedBoard = {
      id: board.id,
      name: board.name.split(' (')[0] || board.name,
      location: board.name.includes(' (') ? board.name.split(' (')[1].replace(')', '') : board.tournament.name,
      status: 'active',
      legSettings: board.legSettings ? JSON.parse(board.legSettings as string) : { legsPerGame: 2 },
      currentGame: null,
      accessCode: board.accessCode,
    };

    return NextResponse.json(transformedBoard, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
