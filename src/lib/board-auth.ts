import { prisma } from '@/lib/prisma';

export async function verifyBoardAccess(gameId: string, boardCode: string | null) {
  if (!boardCode) return false;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { board: true }
  });

  if (!game || !game.board) return false;

  return game.board.accessCode === boardCode.toUpperCase();
}
