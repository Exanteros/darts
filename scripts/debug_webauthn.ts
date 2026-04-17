import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { webAuthnCredentials: true }
  });
  console.log(JSON.stringify(users.map(u => ({ email: u.email, creds: u.webAuthnCredentials })), null, 2));
}

main().finally(() => prisma.$disconnect());
