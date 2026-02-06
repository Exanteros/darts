
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      players: true,
      games: true
    }
  });

  if (!tournament) {
    console.log('No tournament found');
    return;
  }

  console.log(`Tournament: ${tournament.name}`);
  console.log(`Status: ${tournament.status}`);
  console.log(`Players: ${tournament.players.length}`);
  console.log(`Games: ${tournament.games.length}`);

  if (tournament.status === 'ACTIVE' && tournament.games.length === 0) {
      console.log('Status is ACTIVE but 0 games. Reverting to SHOOTOUT to allow retry.');
      await prisma.tournament.update({
          where: { id: tournament.id },
          data: { status: 'SHOOTOUT' }
      });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
