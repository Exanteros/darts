
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    console.log('Kein Turnier gefunden.');
    return;
  }

  console.log(`Tournament: ${tournament.name} (${tournament.status})`);

  const games = await prisma.game.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [
        { round: 'asc' },
        { id: 'asc' } // or another field like 'matchNumber' if it existed, ID is roughly creation order
    ],
    include: {
        player1: true,
        player2: true,
        winner: true
    }
  });

  if (games.length === 0) {
      console.log('Keine Spiele gefunden.');
      return;
  }

  // Group by round
  const rounds = {};
  games.forEach(g => {
      if (!rounds[g.round]) rounds[g.round] = [];
      rounds[g.round].push(g);
  });

  Object.keys(rounds).sort((a,b) => Number(a)-Number(b)).forEach(roundNum => {
      console.log(`\n--- Runde ${roundNum} ---`);
      rounds[roundNum].forEach((g, index) => {
          const p1 = g.player1 ? `${g.player1.playerName} (Seed ${g.player1.seed})` : 'TBD';
          const p2 = g.player2 ? `${g.player2.playerName} (Seed ${g.player2.seed})` : 'TBD';
          const winner = g.winner ? `WINNER: ${g.winner.playerName}` : '';
          const status = g.status;
          
          console.log(`Game ${index+1} [${status}]: ${p1} vs ${p2} ${winner}`);
      });
  });

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
