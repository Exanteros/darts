
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!tournament) {
    console.log('No tournament found');
    return;
  }

  console.log('Updating tournament:', tournament.id);
  const updated = await prisma.tournament.update({
    where: { id: tournament.id },
    data: { checkoutMode: 'SINGLE_OUT' }
  });

  console.log('Updated checkoutMode:', updated.checkoutMode);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
