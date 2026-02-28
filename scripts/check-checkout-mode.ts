
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

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
