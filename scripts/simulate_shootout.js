
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { players: true }
  });

  if (!tournament) {
    console.error('Kein Turnier gefunden.');
    return;
  }

  console.log(`Simuliere Shootout für "${tournament.name}" (${tournament.status})...`);

  // Update status to SHOOTOUT if not already
  if (tournament.status !== 'SHOOTOUT') {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: 'SHOOTOUT' }
      });
      console.log('Status auf SHOOTOUT gesetzt.');
  }

  // Get all players
  const players = tournament.players;
  console.log(`Gefundene Spieler: ${players.length}`);

  // Delete existing results just in case to avoid duplicates per player
  await prisma.shootoutResult.deleteMany({
    where: { tournamentId: tournament.id }
  });

  for (const player of players) {
     const darts = [];
     let totalScore = 0;
     
     // 3 Darts only
     for(let i=0; i<3; i++) {
        // Random 1-20
        let val = Math.floor(Math.random() * 20) + 1;
        // Multiplier probability
        const rand = Math.random();
        let mult = 1;
        
        // Make it slightly more realistic (people aiming for 20)
        if (Math.random() > 0.7) { 
           val = 20; 
        }

        if (rand > 0.95) mult = 0; // Miss
        else if (rand > 0.85) mult = 3; // Triple (harder)
        else if (rand > 0.70) mult = 2; // Double (harder)
        
        let score = val * mult;
        
        // Occasional Bullseye
        if (Math.random() > 0.98) {
            score = Math.random() > 0.5 ? 25 : 50;
        }

        darts.push(score);
        totalScore += score;
     }

     await prisma.shootoutResult.create({
        data: {
            tournamentId: tournament.id,
            playerId: player.id,
            score: totalScore,
            dart1: darts[0],
            dart2: darts[1],
            dart3: darts[2]
        }
     });
     
     console.log(`- ${player.playerName || player.id}: ${totalScore} (${darts.join(', ')})`);
  }

  console.log('Shootout Simulation abgeschlossen. Ergebnisse gespeichert.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
