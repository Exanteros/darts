
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true }
  });

  console.log('Tournaments found:', tournaments.length);
  tournaments.forEach(t => {
      console.log(`- ${t.name} (${t.id}) - Status: ${t.status} - Created: ${t.createdAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
