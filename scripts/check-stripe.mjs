import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set in env');
  process.exit(2);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try{
  const settings = await prisma.tournamentSettings.findUnique({ where: { id: 'default' } });
  console.log('tournamentSettings:', JSON.stringify(settings, null, 2));
} catch(e){
  console.error('Query error', e);
  process.exitCode = 2;
} finally{
  await prisma.$disconnect();
  await pool.end();
}
