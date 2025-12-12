
process.env.DATABASE_URL = "postgresql://dartsturnier:changeme123@localhost:5432/dartsturnier";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
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
        const maskedName = p.playerName ? p.playerName.charAt(0) + '***' + p.playerName.slice(-1) : 'Unknown';
        console.log(` - ${maskedName} (${p.id}): ${p.status}`);
      });
      
      const activePlayers = t.players.filter(p => p.status === 'ACTIVE');
      console.log(`Active Players (calculated): ${activePlayers.length}`);
      console.log('---');
    }
  } catch (e) {
    console.error("Error connecting to DB:", e.message);
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
