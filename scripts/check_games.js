
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
