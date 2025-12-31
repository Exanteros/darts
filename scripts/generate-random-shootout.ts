import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Generating random shootout results...');

  // 1. Find the active tournament
  const tournament = await prisma.tournament.findFirst({
    where: {
      status: {
        in: ['UPCOMING', 'REGISTRATION_OPEN', 'SHOOTOUT']
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  if (!tournament) {
    console.log('❌ No active tournament found.');
    return;
  }

  console.log(`🏆 Tournament: ${tournament.name} (${tournament.id})`);

  // 2. Get all registered players
  const players = await prisma.tournamentPlayer.findMany({
    where: { tournamentId: tournament.id }
  });

  if (players.length === 0) {
    console.log('❌ No players found in this tournament.');
    return;
  }

  console.log(`👥 Found ${players.length} players. Generating scores...`);

  // 3. Generate random scores
  const results = [];

  for (const player of players) {
    // Generate 3 random throws (somewhat realistic)
    // Simple approach: random 0-60 for each dart
    const dart1 = Math.floor(Math.random() * 61); 
    const dart2 = Math.floor(Math.random() * 61);
    const dart3 = Math.floor(Math.random() * 61);
    const totalScore = dart1 + dart2 + dart3;

    results.push({
      playerId: player.id,
      dart1,
      dart2,
      dart3,
      score: totalScore
    });
  }

  // 4. Sort by score descending to determine rank
  results.sort((a, b) => b.score - a.score);

  // 5. Save results and update seeds
  console.log('💾 Saving results and updating seeds...');

  // Clear existing results first to avoid duplicates if run multiple times
  await prisma.shootoutResult.deleteMany({
    where: { tournamentId: tournament.id }
  });

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const rank = i + 1;

    // Create Shootout Result
    await prisma.shootoutResult.create({
      data: {
        tournamentId: tournament.id,
        playerId: result.playerId,
        dart1: result.dart1,
        dart2: result.dart2,
        dart3: result.dart3,
        score: result.score,
        rank: rank
      }
    });

    // Update Player Seed
    await prisma.tournamentPlayer.update({
      where: { id: result.playerId },
      data: {
        seed: rank
      }
    });
    
    process.stdout.write('.');
  }

  // 6. Update Tournament Status
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: 'SHOOTOUT' }
  });

  console.log('\n\n✅ Random shootout completed.');
  console.log(`🥇 Top Seed: Score ${results[0].score}`);
  console.log(`🥈 Last Seed: Score ${results[results.length - 1].score}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
