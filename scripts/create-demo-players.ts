import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting demo player generation...');

  // 1. Find or create a tournament
  let tournament = await prisma.tournament.findFirst({
    where: {
      status: {
        in: ['UPCOMING', 'REGISTRATION_OPEN', 'ACTIVE']
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  if (!tournament) {
    console.log('ℹ️ No active tournament found. Creating one...');
    tournament = await prisma.tournament.create({
      data: {
        name: 'Demo Tournament 2026',
        description: 'A test tournament with 32 players',
        startDate: new Date(),
        status: 'REGISTRATION_OPEN',
        maxPlayers: 64,
        entryFee: 10
      }
    });
  }

  console.log(`🏆 Using tournament: ${tournament.name} (${tournament.id})`);

  // 2. Create 32 Players
  const passwordHash = await bcrypt.hash('demo123', 10);
  const playersToCreate = 64;

  console.log(`👥 Creating ${playersToCreate} demo players...`);

  for (let i = 1; i <= playersToCreate; i++) {
    const email = `player${i}@demo.com`;
    const name = `Demo Player ${i}`;

    // Create or update User
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        password: passwordHash,
        role: 'USER'
      }
    });

    // Register for Tournament
    try {
      await prisma.tournamentPlayer.upsert({
        where: {
          tournamentId_userId: {
            tournamentId: tournament.id,
            userId: user.id
          }
        },
        update: {},
        create: {
          tournamentId: tournament.id,
          userId: user.id,
          playerName: user.name || `Player ${i}`,
          status: 'REGISTERED',
          paid: true, // Mark as paid for testing
          paymentStatus: 'PAID',
          paymentMethod: 'CASH'
        }
      });
      process.stdout.write('.');
    } catch (error) {
      console.error(`\n❌ Failed to register ${email}:`, error);
    }
  }

  console.log('\n\n✅ Successfully created 32 demo players and registered them for the tournament.');
  console.log('👉 Login with: player1@demo.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
