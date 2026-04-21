import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Nicht authentifiziert' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Administrator-Berechtigung erforderlich' }, { status: 403 });
    }

    // Attempt to kill existing mail-listener processes
    try {
      await execAsync('pkill -f "mail-listener.ts" || pkill -f "mail:listen"');
    } catch (e) {
      console.log('No existing mail listener process found to kill or error killing it.');
    }

    // We start the mail listener in the background, detach it, so Next.js doesn't hang waiting for it
    // Wait, in production it uses tsx via npx? Let's just run npm run mail:listen & or npx tsx scripts/mail-listener.ts &
    try {
      if (process.env.NODE_ENV === 'production') {
         exec('npx tsx scripts/mail-listener.ts > mail-listener.log 2>&1 &');
      } else {
         exec('npm run mail:listen > mail-listener.log 2>&1 &');
      }
    } catch(e: any) {
        return NextResponse.json({ success: false, message: 'Fehler beim Starten des Webhooks: ' + e.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Der Webhook (Mail-Listener) wurde erfolgreich neu gestartet.'
    });
  } catch (error: any) {
    console.error('Error restarting webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Ein interner Fehler ist beim Neustart des Webhooks aufgetreten'
    }, { status: 500 });
  }
}
