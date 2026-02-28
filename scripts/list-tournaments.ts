
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' }
  });

  console.log('Tournaments:', tournaments.map(t => ({ id: t.id, name: t.name, checkoutMode: t.checkoutMode })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
