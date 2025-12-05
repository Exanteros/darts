import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyBoardAccess } from '@/lib/board-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, winnerId, player1Legs, player2Legs, newLeg } = body;

    if (!gameId || !winnerId) {
      return NextResponse.json(
        { error: 'Game ID and winner ID are required' },
        { status: 400 }
      );
    }

    // Auth Check
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const boardCode = request.headers.get('x-board-code');
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode);

    if (!isAdmin && !isBoardAuthorized) {
      return NextResponse.json({
        error: 'Nicht autorisiert'
      }, { status: 403 });
    }

    // Update game with new leg information
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        currentLeg: newLeg,
        player1Legs: player1Legs,
        player2Legs: player2Legs
      }
    });

    return NextResponse.json({ 
      success: true,
      game: updatedGame
    });
  } catch (error) {
    console.error('Error updating leg:', error);
    return NextResponse.json(
      { error: 'Failed to update leg' },
      { status: 500 }
    );
  }
}
