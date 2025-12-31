import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

  const { id: boardId } = await context.params;

    // 1. Get the board to find its tournament
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, tournamentId: true }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // 2. Transaction to reset others and set this one
    await prisma.$transaction([
      // Reset all boards in this tournament to isMain: false
      prisma.board.updateMany({
        where: { 
          tournamentId: board.tournamentId 
        },
        data: { isMain: false }
      }),
      // Set the selected board to isMain: true
      prisma.board.update({
        where: { id: boardId },
        data: { isMain: true }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Board set as main board successfully' 
    });

  } catch (error) {
    console.error('Error setting main board:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
