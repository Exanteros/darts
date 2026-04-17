const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.webAuthnCredential.deleteMany({});
  console.log("Deleted all old WebAuthn credentials");
}
main().finally(() => prisma.$disconnect());
