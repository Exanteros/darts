
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      players: true
    }
  });

  console.log('Tournaments found:', tournaments.length);

  for (const t of tournaments) {
    console.log(`Tournament: ${t.name} (${t.id}) - Status: ${t.status}`);
    console.log(`Players: ${t.players.length}`);
    t.players.forEach(p => {
      console.log(` - ${p.playerName} (${p.id}): ${p.status}`);
    });
    
    const activePlayers = t.players.filter(p => p.status === 'ACTIVE');
    console.log(`Active Players (calculated): ${activePlayers.length}`);
    console.log('---');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
