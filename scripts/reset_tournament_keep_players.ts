
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
        players: true
    }
  });

  if (!tournament) {
    console.error('Kein Turnier gefunden.');
    return;
  }

  console.log(`Setze Turnier "${tournament.name}" (${tournament.id}) zurück...`);

  // 1. Lösche Shootout-Ergebnisse
  const deletedShootout = await prisma.shootoutResult.deleteMany({
    where: { tournamentId: tournament.id }
  });
  console.log(`- ${deletedShootout.count} Shootout-Ergebnisse gelöscht.`);

  // 2. Setze Spieler zurück
  const updatedPlayers = await prisma.tournamentPlayer.updateMany({
    where: { tournamentId: tournament.id },
    data: { 
      status: 'ACTIVE',
      seed: null
    }
  });
  console.log(`- ${updatedPlayers.count} Spieler-Status zurückgesetzt.`);

  // 3. Lösche alle Spiele
  // Zuerst Throws löschen (Cascade might handle this, but safer to be explicit if Cascade not set)
  // Checking schema... typically Game deletes cascade to Throws.
  // But let's delete throws via game relation just in case, or just trust deleteMany on Game.
  // In `reset-games` route it deleted throws manually.
  
  const games = await prisma.game.findMany({ where: { tournamentId: tournament.id }});
  const gameIds = games.map(g => g.id);
  
  if (gameIds.length > 0) {
      await prisma.throw.deleteMany({
          where: { gameId: { in: gameIds } }
      });
      console.log(`- Throws für ${gameIds.length} Spiele gelöscht.`);
  }

  const deletedGames = await prisma.game.deleteMany({
    where: { tournamentId: tournament.id }
  });
  console.log(`- ${deletedGames.count} Spiele gelöscht.`);

  // 4. Turnier-Status zurücksetzen
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { 
      status: 'REGISTRATION_CLOSED', // Oder 'REGISTRATION_OPEN' ?
      // Der User hat nicht explizit gesagt wohin, aber 'REGISTRATION_CLOSED' ist der Punkt VOR dem Shootout/Start.
      // Falls sie weiter anmelden wollen, können sie es im UI öffnen.
      shootoutBoardId: null
    }
  });
  console.log('- Turnier-Status auf REGISTRATION_CLOSED gesetzt.');
  console.log('Fertig!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
