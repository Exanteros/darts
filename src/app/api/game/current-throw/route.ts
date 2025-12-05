import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { broadcastThrowUpdate } from '@/lib/websocketBroadcast';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyBoardAccess } from '@/lib/board-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, darts, player, score } = body;

    if (!gameId || !Array.isArray(darts) || !player) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Update the game's currentThrow field in database
    await prisma.game.update({
      where: { id: gameId },
      data: {
        currentThrow: JSON.parse(JSON.stringify({
          darts,
          player,
          score: score || darts.reduce((sum: number, d: number) => sum + d, 0)
        }))
      }
    });

    // Broadcast throw update via WebSocket
    broadcastThrowUpdate({ gameId, darts, player, score });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving current throw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { currentThrow: true }
    });

    if (!game || !game.currentThrow) {
      return NextResponse.json({ currentThrow: null });
    }

    return NextResponse.json({ currentThrow: game.currentThrow });
  } catch (error) {
    console.error('Error fetching current throw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear current throw (called when throw is confirmed)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
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

    await prisma.game.update({
      where: { id: gameId },
      data: { currentThrow: Prisma.JsonNull }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting current throw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
