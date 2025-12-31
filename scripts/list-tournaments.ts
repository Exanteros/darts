
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log('Tournaments:', tournaments.map(t => ({ id: t.id, name: t.name, checkoutMode: t.checkoutMode })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
