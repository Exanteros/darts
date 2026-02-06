
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
  const config = await prisma.bracketConfig.findFirst();
  console.log('Bracket Configuration:');
  console.log(JSON.stringify(config, null, 2));
}

checkConfig()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
