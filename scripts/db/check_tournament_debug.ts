
import { prisma } from './src/lib/prisma';

async function checkTournaments() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      players: true
    }
  });

  console.log('Found', tournaments.length, 'tournaments');

  for (const t of tournaments) {
    console.log(`\nTournament: ${t.name} (ID: ${t.id})`);
    console.log(`Status: ${t.status}`);
    console.log(`Max Players: ${t.maxPlayers}`);
    console.log(`Total Players in DB: ${t.players.length}`);
    
    const statusCounts: Record<string, number> = {};
    t.players.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    console.log('Player Statuses:', statusCounts);

    // activeCount logic from API
    const activeCount = t.players.filter(p => ['REGISTERED', 'CONFIRMED', 'ACTIVE'].includes(p.status)).length;
    console.log(`API Calculated activeCount: ${activeCount}`);
    
    const isFull = activeCount >= t.maxPlayers;
    console.log(`Is Full? ${isFull}`);
  }
}

checkTournaments()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
