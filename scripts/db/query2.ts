import prisma from './prisma.config';

async function main() {
  const mails = await prisma.supportEmail.findMany();
  console.log(JSON.stringify(mails.map(m => ({id: m.id, msgId: m.messageId, subject: m.subject})), null, 2));
}

main().finally(() => process.exit(0));