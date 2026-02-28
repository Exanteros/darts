import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Resetting tournament data...');

  // 1. Find the active tournament
  const tournament = await prisma.tournament.findFirst({
    where: {
      status: {
        in: ['UPCOMING', 'REGISTRATION_OPEN', 'ACTIVE', 'SHOOTOUT', 'FINISHED']
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  if (!tournament) {
    console.log('❌ No tournament found to reset.');
    return;
  }

  console.log(`🎯 Target tournament: ${tournament.name} (${tournament.id})`);

  // 2. Delete all related data
  // Deleting Games first to avoid foreign key constraints with TournamentPlayer
  console.log('🗑️ Deleting games...');
  await prisma.game.deleteMany({
    where: { tournamentId: tournament.id }
  });

  console.log('🗑️ Deleting shootout results...');
  await prisma.shootoutResult.deleteMany({
    where: { tournamentId: tournament.id }
  });

  console.log('🗑️ Deleting shootout state...');
  await prisma.shootoutState.deleteMany({
    where: { tournamentId: tournament.id }
  });

  console.log('🗑️ Deleting tournament players...');
  await prisma.tournamentPlayer.deleteMany({
    where: { tournamentId: tournament.id }
  });

  // 3. Delete Demo Users
  console.log('🗑️ Deleting demo users (player*@demo.com)...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@demo.com'
      }
    }
  });
  console.log(`   - Deleted ${deletedUsers.count} demo users.`);

  // 4. Reset Tournament Status
  console.log('✨ Resetting tournament status to REGISTRATION_OPEN...');
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      status: 'REGISTRATION_OPEN',
      shootoutBoardId: null
    }
  });

  console.log('✅ Tournament reset complete. Ready for new registration.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
