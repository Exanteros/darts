import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Find board by access code
    const board = await prisma.board.findUnique({
      where: { accessCode: code.toUpperCase() },
      include: {
        games: {
          where: {
            status: 'ACTIVE',
            boardId: {
              not: null
            }
          },
          include: {
            player1: true,
            player2: true,
            winner: true,
            throws: {
              where: {
                leg: {
                  gte: 1
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        }
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Find the current active game for this board
    const currentGame = board.games.find(
      game => game.boardId === board.id
    );

    if (!currentGame) {
      return NextResponse.json({
        board: {
          id: board.id,
          name: board.name
        },
        currentGame: null,
        currentThrow: null
      });
    }

    // Get current throw from game data
    const currentThrowData = currentGame.currentThrow as any;

    // Calculate current scores from throws for current leg
    const currentLegThrows = currentGame.throws.filter(t => t.leg === currentGame.currentLeg);
    const player1Throws = currentLegThrows.filter(t => t.playerId === currentGame.player1Id);
    const player2Throws = currentLegThrows.filter(t => t.playerId === currentGame.player2Id);
    
    let player1TotalScore = player1Throws.reduce((sum, t) => sum + (t.dart1 + t.dart2 + t.dart3), 0);
    let player2TotalScore = player2Throws.reduce((sum, t) => sum + (t.dart1 + t.dart2 + t.dart3), 0);
    
    // Add current throw to the total if it exists
    if (currentThrowData && currentThrowData.darts) {
      const currentThrowScore = currentThrowData.score || currentThrowData.darts.reduce((sum: number, d: number) => sum + d, 0);
      if (currentThrowData.player === 1) {
        player1TotalScore += currentThrowScore;
      } else if (currentThrowData.player === 2) {
        player2TotalScore += currentThrowScore;
      }
    }
    
    const player1CurrentScore = 501 - player1TotalScore;
    const player2CurrentScore = 501 - player2TotalScore;

    // Determine current player based on throw count (or from currentThrow data)
    const totalThrows = currentLegThrows.length;
    const currentPlayer = currentThrowData?.player || (totalThrows % 2 === 0 ? 1 : 2);

    // Return game data
    return NextResponse.json({
      board: {
        id: board.id,
        name: board.name
      },
      currentGame: {
        id: currentGame.id,
        status: currentGame.status,
        round: currentGame.round,
        player1Name: currentGame.player1?.playerName || 'Spieler 1',
        player2Name: currentGame.player2?.playerName || 'Spieler 2',
        player1Score: player1CurrentScore,
        player2Score: player2CurrentScore,
        player1Legs: currentGame.player1Legs,
        player2Legs: currentGame.player2Legs,
        legsToWin: currentGame.legsToWin,
        currentLeg: currentGame.currentLeg,
        currentPlayer: currentPlayer,
        winner: currentGame.winner?.playerName
      },
      currentThrow: currentThrowData
    });
  } catch (error) {
    console.error('Error fetching board game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
