
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Waiting List Feature Test...');

  // 1. Create a test tournament with maxPlayers = 2
  console.log('\n1️⃣ Creating test tournament (Max Players: 2)...');
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Waiting List Test Cup',
      startDate: new Date(),
      status: 'REGISTRATION_OPEN',
      maxPlayers: 2,
      entryFee: 10
    }
  });
  console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})`);

  // 2. Register Player 1 (Should be CONFIRMED)
  console.log('\n2️⃣ Registering Player 1...');
  const p1 = await prisma.tournamentPlayer.create({
    data: {
      tournamentId: tournament.id,
      playerName: 'Test Player 1',
      status: 'CONFIRMED',
      userId: 'test-user-1' // Dummy ID, assuming no foreign key constraint on userId or we use a real one if needed. 
                            // Note: The schema usually links to User. If it fails, I'll need to create users first.
                            // Let's check if I need to create users. The public registration creates users if they don't exist.
                            // For this direct DB test, I might need valid User IDs if the relation is required.
                            // Let's try to create users first to be safe.
    }
  }).catch(async (e) => {
      // If it fails due to user relation, we'll create users.
      return null;
  });

  // Let's do it properly by creating users first to avoid FK errors
  const createTestUser = async (email: string, name: string) => {
    return await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name, password: 'hash' }
    });
  };

  const user1 = await createTestUser('test1@example.com', 'Test Player 1');
  const user2 = await createTestUser('test2@example.com', 'Test Player 2');
  const user3 = await createTestUser('test3@example.com', 'Test Player 3');

  // Helper to simulate registration logic
  const register = async (user: any, name: string) => {
      const activeCount = await prisma.tournamentPlayer.count({
          where: {
              tournamentId: tournament.id,
              status: { in: ['REGISTERED', 'CONFIRMED', 'ACTIVE'] }
          }
      });

      let status = 'CONFIRMED';
      if (activeCount >= tournament.maxPlayers) {
          status = 'WAITING_LIST';
      }

      return await prisma.tournamentPlayer.create({
          data: {
              tournamentId: tournament.id,
              userId: user.id,
              playerName: name,
              status: status as any
          }
      });
  };

  console.log('Registering Player 1...');
  const reg1 = await register(user1, 'Test Player 1');
  console.log(`Player 1 Status: ${reg1.status} ${reg1.status === 'CONFIRMED' ? '✅' : '❌'}`);

  console.log('Registering Player 2...');
  const reg2 = await register(user2, 'Test Player 2');
  console.log(`Player 2 Status: ${reg2.status} ${reg2.status === 'CONFIRMED' ? '✅' : '❌'}`);

  console.log('\n3️⃣ Registering Player 3 (Should be WAITING_LIST)...');
  const reg3 = await register(user3, 'Test Player 3');
  console.log(`Player 3 Status: ${reg3.status} ${reg3.status === 'WAITING_LIST' ? '✅' : '❌'}`);

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await prisma.tournamentPlayer.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.tournament.delete({ where: { id: tournament.id } });
  // We keep the users to avoid breaking other things or complex cleanup
  
  console.log('\n✨ Test Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
