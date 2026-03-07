require('dotenv').config({ path: '.env' });
const { ImapFlow } = require('imapflow');

async function test() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT),
    secure: process.env.IMAP_SECURE === 'true',
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS
    },
    tls: { rejectUnauthorized: false },
    logger: false
  });
  
  await client.connect();
  let lock = await client.getMailboxLock('INBOX');
  
  try {
    const msgs = await client.search({ all: true });
    console.log("Total msgs in inbox:", msgs.length);
    if (msgs.length > 0) {
      const msg = await client.fetchOne(msgs[msgs.length - 1], { envelope: true });
      const msgId = msg.envelope.messageId;
      console.log("Latest msgId from envelope:", msgId);
      
      const searchRaw = await client.search({ header: { 'Message-ID': msgId } });
      console.log("Search by raw msgId:", searchRaw);
      
      const searchNoBrackets = await client.search({ header: { 'Message-ID': msgId.replace(/[<>]/g, '') } });
      console.log("Search without brackets:", searchNoBrackets);
    }
  } finally {
    lock.release();
    await client.logout();
  }
}
test().catch(console.error);
