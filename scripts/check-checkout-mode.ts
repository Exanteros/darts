
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  console.log('Latest Tournament:', tournament);
  console.log('Checkout Mode:', tournament?.checkoutMode);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
