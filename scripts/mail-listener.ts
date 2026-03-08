import { syncEmails } from '../src/lib/imap';
import { ImapFlow } from 'imapflow';

// polling fallback interval (in case IDLE disconnects)
const INTERVAL_MS = 15000; // 15s

async function startListener() {
  console.log(`[Mail Listener] Starting IMAP sync listener`);

  // open a short‑lived connection just to test env and do an initial sync
  await syncEmails().catch(e => console.error('[Mail Listener] initial sync failed', e));

  // try to use IMAP IDLE if supported
  const imapConfig = {
    host: process.env.IMAP_HOST || process.env.SMTP_HOST || 'mail.pudo-dartmasters.de',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: process.env.IMAP_USER || process.env.SMTP_USER || '',
      pass: process.env.IMAP_PASS || process.env.SMTP_PASS || ''
    },
    tls: { rejectUnauthorized: false },
    logger: false as const
  };

  const client = new ImapFlow(imapConfig as any);
  try {
    await client.connect();
    // ImapFlow uses mailboxOpen rather than selectMailbox
    await client.mailboxOpen('INBOX');

    client.on('exists', async () => {
      console.log('[Mail Listener] new message detected via IMAP IDLE, syncing');
      try {
        await syncEmails();
      } catch (e) {
        console.error('[Mail Listener] error during sync after exists event', e);
      }
    });

    // IDLE loop: will throw on error / disconnect, so catch and retry
    while (true) {
      try {
        await client.idle();
      } catch (err) {
        console.error('[Mail Listener] idle error', err);
        // wait a bit before reconnecting
        await new Promise((r) => setTimeout(r, 5000));
        try {
          await client.connect();
          await client.mailboxOpen('INBOX');
        } catch (e) {
          console.error('[Mail Listener] reconnect failed', e);
        }
      }
    }
  } catch (err) {
    console.error('[Mail Listener] failed to start IDLE listener, falling back to interval polling:', err);
    // fallback polling loop
    while (true) {
      try {
        await syncEmails();
      } catch (e) {
        console.error('[Mail Listener] Error syncing emails:', e);
      }
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
  }
}

// Automatically start if executed directly
if (require.main === module) {
  startListener();
}
