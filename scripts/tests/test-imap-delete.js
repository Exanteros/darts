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
    console.log('Searching all...');
    const msgs = await client.search({ all: true });
    console.log("Total msgs in inbox:", msgs.length);
    if (msgs.length > 0) {
      console.log('Deleting msgs:', msgs);
      await client.messageDelete(msgs);
    }
    const msgsAfter = await client.search({ all: true });
    console.log("Total msgs in inbox AFTER deletion:", msgsAfter.length);
  } finally {
    lock.release();
    await client.logout();
  }
}
test().catch(console.error);
