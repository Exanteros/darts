import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET /api/admin/boards - Alle Boards abrufen
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, location, legSettings } = body;

    // Finde das erste aktive Turnier oder erstelle ein Standard-Turnier
    let tournament = await prisma.tournament.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!tournament) {
      tournament = await prisma.tournament.findFirst();
    }

    if (!tournament) {
      // Erstelle ein Standard-Turnier falls keines existiert
      tournament = await prisma.tournament.create({
        data: {
          name: 'Darts Masters 2025',
          description: 'Standard Turnier',
          startDate: new Date(),
          maxPlayers: 64,
        }
      });
    }

    const board = await prisma.board.create({
      data: {
        name: location ? `${name} (${location})` : name,
        tournamentId: tournament.id,
        accessCode: Math.random().toString(36).substring(2, 7).toUpperCase(),
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
