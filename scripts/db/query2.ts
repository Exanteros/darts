import { prisma } from '../../src/lib/prisma';

async function main() {
  const mails = await prisma.supportEmail.findMany();
  console.log(JSON.stringify(mails.map((m: any) => ({id: m.id, msgId: m.messageId, subject: m.subject})), null, 2));
}

main().finally(() => process.exit(0));