import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendMail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const to = body?.to || process.env.SMTP_TEST_TO;
    const subject = body?.subject || 'Test Email von Darts Turnier';
    const text = body?.text || body?.message || 'Dies ist eine Test-Nachricht, um SMTP-Konfiguration zu prüfen.';

    if (!to) {
      return NextResponse.json({ error: 'Empfängeradresse fehlt' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Ungültiges E-Mail-Format" },
        { status: 400 }
      );
    }

    const ok = await sendMail({ 
      to, 
      subject, 
      text,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>SMTP Test E-Mail</h2>
        <p>${text}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          Diese E-Mail wurde vom Darts Tournament System gesendet.<br>
          SMTP-Test durchgeführt am: ${new Date().toLocaleString('de-DE')}
        </p>
      </div>`
    });
    
    if (!ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fehler beim Senden der Test-Mail. Bitte überprüfen Sie die SMTP-Einstellungen.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test-Mail erfolgreich an ${to} gesendet` 
    });
  } catch (error) {
    console.error('Error in test mail endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
