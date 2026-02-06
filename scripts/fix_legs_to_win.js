
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLegs() {
  console.log('Fixing legsToWin for existing games based on Bracket Config...');
  
  // Hardcoded based on what we saw in check_bracket_config.js
  // R1-R4: 3 legs -> 2 to win
  // R5-R6: 5 legs -> 3 to win
  
  const rules = {
      1: 2,
      2: 2,
      3: 2,
      4: 2,
      5: 3,
      6: 3
  };

  for (const [round, targetLegs] of Object.entries(rules)) {
      const r = Number(round);
      const res = await prisma.game.updateMany({
          where: {
              round: r,
              legsToWin: { not: targetLegs }
          },
          data: {
              legsToWin: targetLegs
          }
      });
      console.log(`Round ${r}: Updated ${res.count} games to legsToWin=${targetLegs}.`);
  }
}

fixLegs()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
