
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
