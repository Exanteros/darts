
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetShootout() {
  try {
    console.log('🔄 Starting Shootout Reset...');

    // 1. Find the active or latest tournament
    const tournament = await prisma.tournament.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!tournament) {
      console.error('❌ No tournament found.');
      return;
    }

    console.log(`📍 Tournament found: ${tournament.name} (${tournament.id})`);

    // 2. Perform Reset Transaction
    await prisma.$transaction(async (tx) => {
      // A. Delete all Shootout Results
      const deletedResults = await tx.shootoutResult.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`   - Deleted ${deletedResults.count} shootout results.`);

      // B. Delete Shootout State (Current active player, status)
      const deletedState = await tx.shootoutState.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`   - Deleted ${deletedState.count} shootout state records.`);

      // C. Reset Player Seeds (Seeds are determined by shootout)
      const updatedPlayers = await tx.tournamentPlayer.updateMany({
        where: { tournamentId: tournament.id },
        data: { seed: null },
      });
      console.log(`   - Reset seeds for ${updatedPlayers.count} players.`);
      
      // D. Update Tournament Status (ensure it is in SHOOTOUT mode)
      // We keep the boardId if it exists, so they don't have to select it again, 
      // unless they want to. But "reset shootout" usually means "reset scores".
      await tx.tournament.update({
        where: { id: tournament.id },
        data: { 
            status: 'SHOOTOUT',
            // Optional: shootoutBoardId: null // Uncomment to force board re-selection
        },
      });
      console.log(`   - Tournament status ensured as 'SHOOTOUT'.`);
    });

    console.log('✅ Shootout successfully reset!');
    console.log('   You can now reload the bracket page and start over.');

  } catch (error) {
    console.error('❌ Error resetting shootout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetShootout();
