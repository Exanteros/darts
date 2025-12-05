import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastGameReset } from '@/lib/websocketBroadcast';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyBoardAccess } from '@/lib/board-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({
        success: false,
        message: 'Game ID is required'
      }, { status: 400 });
    }

    // Auth Check
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';
    const boardCode = request.headers.get('x-board-code');
    const isBoardAuthorized = await verifyBoardAccess(gameId, boardCode);

    if (!isAdmin && !isBoardAuthorized) {
      return NextResponse.json({
        success: false,
        message: 'Nicht autorisiert'
      }, { status: 403 });
    }

    // 1. Delete all throws for this game
    await prisma.throw.deleteMany({
      where: { gameId: gameId }
    });

    // 2. Reset game state
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        player1Legs: 0,
        player2Legs: 0,
        currentLeg: 1,
        status: 'ACTIVE',
        startedAt: new Date(),
        finishedAt: null,
        winnerId: null,
        currentThrow: Prisma.DbNull
      },
      include: {
        player1: true,
        player2: true
      }
    });

    // 3. Broadcast reset
    broadcastGameReset(gameId);

    return NextResponse.json({
      success: true,
      message: 'Game reset successfully',
      game: updatedGame
    });

  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to reset game'
    }, { status: 500 });
  }
}
