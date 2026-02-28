
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkConfig() {
  const config = await prisma.bracketConfig.findFirst();
  console.log('Bracket Configuration:');
  console.log(JSON.stringify(config, null, 2));
}

checkConfig()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
