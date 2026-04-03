
import { prisma } from './src/lib/prisma';

async function fixTournament() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { startDate: 'desc' }
  });

  if (!tournament) return;

  console.log(`Updating tournament ${tournament.name}...`);
  
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      status: 'REGISTRATION_OPEN',
      maxPlayers: 128 // Increase limit so user can register
    }
  });

  console.log('Done! Max players set to 128 and status OPEN.');
}

fixTournament()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
