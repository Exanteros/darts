import { ImapFlow } from 'imapflow';

export async function deleteEmailFromImap(messageId: string) {
  const imapConfig: import('imapflow').ImapFlowOptions = {
    host: process.env.IMAP_HOST || process.env.SMTP_HOST || 'mail.pudo-dartmasters.de',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: process.env.IMAP_USER || process.env.SMTP_USER || '',
      pass: process.env.IMAP_PASS || process.env.SMTP_PASS || ''
    },
    tls: {
      rejectUnauthorized: false
    },
    logger: false as const
  };

  const client = new ImapFlow(imapConfig);

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Suchen nach der Message-ID
      let searchResult = await client.search({ header: { 'Message-ID': messageId } });
      let messages = Array.isArray(searchResult) ? searchResult : [];
      
      // Falls die MessageID in Prisma generiert wurde ("uuid-..."), wird IMAP sie nicht finden.
      // Echte Message-IDs können mit oder ohne <> auftauchen.
      if (messages.length === 0 && !messageId.startsWith('uuid-')) {
         // Versuche es generischer
         const stripped = messageId.replace(/[<>]/g, '');
         searchResult = await client.search({ header: { 'Message-ID': stripped } });
         messages = Array.isArray(searchResult) ? searchResult : [];
      }
      
      if (messages.length > 0) {
        // MessageDelete bewegt sie endgültig in den Papierkorb oder expunged sie
        await client.messageDelete(messages);
      } else {
        console.warn(`[IMAP Delete] Could not find message with ID: ${messageId} on server. If this was a test mail, it might not have an ID.`);
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error('Error deleting IMAP email:', error);
  } finally {
    try { await client.logout(); } catch (e) {}
  }
}
