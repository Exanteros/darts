import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  try{
    const settings = await prisma.tournamentSettings.findUnique({ where: { id: 'default' } });
    console.log('tournamentSettings:', JSON.stringify(settings, null, 2));
  }catch(e){
    console.error('Error querying DB:', e);
    process.exitCode = 2;
  }finally{
    await prisma.$disconnect();
  }
}

main();
