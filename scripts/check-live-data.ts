
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Checking live data...');

  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    console.log('No tournament found.');
    return;
  }

  console.log(`Tournament: ${tournament.name} (${tournament.id})`);

  const boards = await prisma.board.findMany({
    where: { isActive: true },
    include: { 
        games: { 
            where: { status: { in: ['ACTIVE', 'WAITING'] } }, 
            include: { player1: true, player2: true } 
        } 
    },
    orderBy: { priority: 'asc' }
  });

  console.log(`Found ${boards.length} active boards.`);
  
  for (const board of boards) {
      console.log(`- Board: ${board.name} (${board.id})`);
      console.log(`  Games: ${board.games.length}`);
      for (const game of board.games) {
          console.log(`    - Game ${game.id}: ${game.player1?.playerName} vs ${game.player2?.playerName} (${game.status})`);
      }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
