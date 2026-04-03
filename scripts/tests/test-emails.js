const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const emails = await prisma.supportEmail.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(emails.map(e => ({ id: e.id, threadId: e.threadId, subject: e.subject, from: e.fromEmail, to: e.toEmail, isReply: e.isReply, isRead: e.isRead })));
}
main().finally(() => prisma.$disconnect());
