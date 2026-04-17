const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.webAuthnCredential.deleteMany({});
  console.log("Deleted all old WebAuthn credentials");
}
main().catch(console.error).finally(() => prisma.$disconnect());
