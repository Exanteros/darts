import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function verifyBoardAccess(gameId: string, boardCode: string | null, requestIp?: string) {
  if (!boardCode) return false;

  // Rate-Limiting: Max 5 Versuche pro Minute pro IP
  if (requestIp) {
    const rateLimitKey = `board-access:${requestIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 60000); // 5 Versuche pro Minute
    
    if (!rateLimit.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for board access from IP: ${requestIp}`);
      return false;
    }
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { board: true }
  });

  if (!game || !game.board) return false;

  const isValid = game.board.accessCode === boardCode.toUpperCase();

  // Audit-Log bei fehlgeschlagenen Versuchen
  if (!isValid && requestIp) {
    console.warn(`[SECURITY] Fehlgeschlagener Board-Code Versuch - IP: ${requestIp}, Code: ${boardCode}, Game: ${gameId}`);
  }

  return isValid;
}
