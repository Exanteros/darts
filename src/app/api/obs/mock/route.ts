import { NextResponse } from 'next/server';

export async function GET() {
  // Toggle current player every second so the frontend arrow can be observed moving
  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentPlayer = (nowSeconds % 2) === 0 ? 1 : 2;

  const sample = {
    game: {
      id: 'mock-game-1',
      tournamentId: 'mock-tourn-1',
      tournamentName: 'Dev Test Turnier',
      round: 1,
      boardId: 'mock-board-1',
      boardName: 'Scheibe A',
      player1Id: 'p1',
      player2Id: 'p2',
      player1: {
        name: 'Max Mustermann',
        currentScore: 301,
        lastThrows: ['T20', '20', '1'],
        average: 45.3
      },
      player2: {
        name: 'Erika Beispiel',
        currentScore: 441,
        lastThrows: ['20', '20', '5'],
        average: 39.2
      },
      player1Score: 301,
      player2Score: 441,
      player1Legs: 2,
      player2Legs: 3,
      currentPlayer,
      status: 'ACTIVE',
      legsToWin: 7,
      currentLeg: 1
    }
  };

  return NextResponse.json(sample);
}
