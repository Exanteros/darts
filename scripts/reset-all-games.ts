
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllGames() {
  console.log('🔄 Resetting all games...');

  try {
    // 1. Delete all throws first (foreign key constraint)
    const deletedThrows = await prisma.throw.deleteMany({});
    console.log(`✅ Deleted ${deletedThrows.count} throws.`);

    // 2. Reset all games
    const updatedGames = await prisma.game.updateMany({
      data: {
        status: 'WAITING',
        winnerId: null,
        player1Legs: 0,
        player2Legs: 0,
        currentLeg: 1,
        currentThrow: Prisma.DbNull,
        startedAt: null,
        finishedAt: null,
        // Keep boardId, player1Id, player2Id, round, tournamentId as is
        // unless we want to unassign players too? 
        // Usually "reset game" means reset the score/progress, not the schedule.
      },
    });
    console.log(`✅ Reset ${updatedGames.count} games to WAITING status.`);

    // Optional: If we want to clear board assignments for games that were active?
    // Maybe not, if the schedule is fixed.
    // But if a game was "ACTIVE" on a board, the board might still think it's busy?
    // The Board model doesn't seem to have a "currentGameId" field, it's likely derived or the Game has boardId.
    // If we reset the game to WAITING, it might still be assigned to the board.
    // If the user wants to "restart" the tournament, maybe we should clear board assignments too?
    // "also ob es schon gestartet wurde etc" implies resetting the *progress*.
    
    // Let's check if we need to do anything else.
    // If the game was "ACTIVE", it had a board assigned. 
    // If we reset it to "WAITING", it is still assigned to that board.
    // That seems fine, it just hasn't started yet.

  } catch (error) {
    console.error('❌ Error resetting games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllGames();
