const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { webAuthnCredentials: true }
  });
  console.log(users.map(u => ({ email: u.email, creds: u.webAuthnCredentials.length })));
  
  const creds = await prisma.webAuthnCredential.findMany();
  console.log(creds.map(c => ({ id: c.id, credId: c.credentialId, pk: c.publicKey })));
}
main().finally(() => prisma.$disconnect());
