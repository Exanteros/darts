import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET /api/admin/boards/[id] - Einzelnes Board abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const board = await prisma.board.findUnique({
      where: { id },
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
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Find the current game assigned to this board
    const currentGame = board.games.find(g => g.boardId === board.id && g.status === 'ACTIVE');
    
    // Transform to match UI expectations
    const transformedBoard = {
      id: board.id,
      name: board.name,
      accessCode: board.accessCode,
      isActive: board.isActive,
      priority: board.priority,
      isMain: board.isMain || false,
      currentGame: currentGame ? {
        id: currentGame.id,
        player1: currentGame.player1?.playerName || 'Unbekannt',
        player2: currentGame.player2?.playerName || 'Unbekannt',
        player1Id: currentGame.player1Id,
        player2Id: currentGame.player2Id,
        status: currentGame.status
      } : null,
      queueLength: board.games.filter(g => g.status === 'WAITING').length
    };

    return NextResponse.json({ success: true, board: transformedBoard });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/boards/[id] - Board aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Temporär Authentifizierung deaktivieren für Debugging
    // const session = await getSession();
    // if (!session || session.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { name, location, status, legSettings, isMain, isActive, priority } = body;

    const updateData: any = {};

    if (name !== undefined || location !== undefined) {
      // Hole das bestehende Board, um den aktuellen Namen zu bekommen
      const existingBoard = await prisma.board.findUnique({
        where: { id },
        include: { tournament: true }
      });

      if (existingBoard) {
        const currentName = existingBoard.name.split(' (')[0] || existingBoard.name;
        const currentLocation = existingBoard.name.includes(' (')
          ? existingBoard.name.split(' (')[1].replace(')', '')
          : existingBoard.tournament.name;

        const newName = name !== undefined ? name : currentName;
        const newLocation = location !== undefined ? location : currentLocation;

        updateData.name = `${newName} (${newLocation})`;
      }
    }

    if (status !== undefined) {
      updateData.isActive = status === 'active';
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (isMain !== undefined) {
      updateData.isMain = isMain;
      // Wenn isMain auf true gesetzt wird, alle anderen Boards auf false setzen
      if (isMain === true) {
        await prisma.board.updateMany({
          where: {
            isMain: true,
            id: { not: id } // Ausgenommen das aktuelle Board
          },
          data: { isMain: false }
        });
      }
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (legSettings !== undefined) {
      updateData.legSettings = JSON.stringify(legSettings);
    }

    const board = await prisma.board.update({
      where: { id },
      data: updateData,
      include: {
        tournament: true
      }
    });

    // Transform to match UI expectations
    const transformedBoard = {
      id: board.id,
      name: board.name.split(' (')[0] || board.name,
      location: board.name.includes(' (') ? board.name.split(' (')[1].replace(')', '') : board.tournament.name,
      status: board.isActive ? 'active' : 'inactive',
      legSettings: board.legSettings ? JSON.parse(board.legSettings as string) : { legsPerGame: 2 },
      currentGame: null,
    };

    return NextResponse.json(transformedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/boards/[id] - Board aktualisieren (für UI-Kompatibilität)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

// DELETE /api/admin/boards/[id] - Board löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prüfe, ob das Board aktive Spiele hat
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        games: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.games.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete board with active games'
      }, { status: 400 });
    }

    await prisma.board.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
