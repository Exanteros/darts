const { ImapFlow } = require('imapflow');

async function run() {
  const client = new ImapFlow({
    host: 'mail.pudo-dartmasters.de',
    port: 993,
    secure: true,
    auth: {
      user: 'support@pudo-dartmasters.de',
      pass: 'WCke?cs*8PNflD!3'
    },
    tls: { rejectUnauthorized: false },
    logger: false
  });

  await client.connect();
  let lock = await client.getMailboxLock('INBOX');
  
  try {
    console.log("Searching for messages...");
    for await (let msg of client.fetch('1:*', { envelope: true, uid: true })) {
      console.log(`UID: ${msg.uid}, Subject: ${msg.envelope.subject}, From: ${msg.envelope.from[0].name}`);
      if (msg.envelope.subject === 'Test' || msg.envelope.subject.includes('Testmail')) {
         console.log('-> FOUND THE MAIL, attempting to delete via UID');
         await client.messageFlagsAdd(msg.uid.toString(), ['\\Deleted'], { uid: true });
      }
    }
    console.log("Expunging...");
    await client.mailboxClose(); // default closes and expunges
  } finally {
    lock.release();
    try { await client.logout(); } catch (e) {}
  }
}

run().catch(console.error);
