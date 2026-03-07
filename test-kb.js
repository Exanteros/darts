require('dotenv').config();
const { prisma } = require('./src/lib/prisma');
(async ()=>{
  let knowledgeBase = process.env.LLM_KNOWLEDGE_BASE || '';
  const supportAddr = process.env.IMAP_USER || process.env.SMTP_USER || '';
  const brandNameKb = process.env.BRAND_NAME || 'Darts Masters Support';
  knowledgeBase += `\nSupport E-Mail: ${supportAddr}`;
  knowledgeBase += `\nBrand-Name: ${brandNameKb}`;
  try {
    const upcoming = await prisma.tournament.findFirst({
      where: { status: { in: ['UPCOMING','ACTIVE'] } },
      orderBy: { startDate: 'asc' }
    });
    if (upcoming) {
      knowledgeBase +=
        `\nAktuelles Turnier:\n` +
        `- Name: ${upcoming.name}\n` +
        `- Ort: ${upcoming.location || 'unbekannt'}\n` +
        `- Start: ${upcoming.startDate.toISOString()}\n` +
        `- Eintritt: ${upcoming.entryFee} Euro\n` +
        (upcoming.description ? `- Beschreibung: ${upcoming.description}\n` : '');
    }
  } catch(e){console.error(e)}
  console.log('--- KB ---');
  console.log(knowledgeBase);
  process.exit(0);
})();
