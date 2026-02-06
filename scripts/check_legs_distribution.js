
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGames() {
  const games = await prisma.game.findMany({
    orderBy: [
      { round: 'asc' },
      { id: 'asc' }
    ]
  });
  
  console.log(`Found ${games.length} games.`);
  
  // Group by round
  const byRound = {};
  games.forEach(g => {
    if (!byRound[g.round]) byRound[g.round] = [];
    byRound[g.round].push(g);
  });

  Object.keys(byRound).forEach(r => {
    const roundGames = byRound[r];
    const firstLegs = roundGames[0].legsToWin;
    const same = roundGames.every(g => g.legsToWin === firstLegs);
    console.log(`Round ${r}: ${roundGames.length} games. First legsToWin: ${firstLegs}. All same? ${same}`);
    if (!same) {
       console.log("  WARNING: Mixed legsToWin in this round!");
       roundGames.forEach(g => console.log(`   Game ${g.id}: ${g.legsToWin}`));
    }
  });
}

checkGames()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
