import { syncEmails } from '../src/lib/imap';

const INTERVAL_MS = 15000; // Check every 15 seconds

async function startListener() {
  console.log(`[Mail Listener] Starting IMAP sync loop (Interval: ${INTERVAL_MS/1000}s)`);
  
  while (true) {
    try {
      await syncEmails();
    } catch (e) {
      console.error('[Mail Listener] Error syncing emails:', e);
    }
    // Wait for the next interval
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

// Automatically start if executed directly
if (require.main === module) {
  startListener();
}
