import { NextResponse } from 'next/server';
import { z } from 'zod';
import { renderHtml, sendMail } from '@/lib/mail';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000),
});

function getSupportInbox() {
  return process.env.CONTACT_RECEIVER || process.env.IMAP_USER || process.env.SMTP_USER || 'support@pudo-dartmasters.de';
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = contactSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Bitte pruefe deine Eingaben und versuche es erneut.',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const supportInbox = getSupportInbox();

    const plainText = [
      'Neue Kontaktanfrage von dartsturnier.de',
      '',
      `Name: ${name}`,
      `E-Mail: ${email}`,
      `Betreff: ${subject}`,
      '',
      'Nachricht:',
      message,
      '',
      `Zeit: ${new Date().toISOString()}`,
    ].join('\n');

    const html = await renderHtml(
      [
        '# Neue Kontaktanfrage',
        '',
        '## Kontaktdaten',
        `> Name: ${name}<br/>E-Mail: ${email}`,
        '',
        '## Betreff',
        subject,
        '',
        '## Nachricht',
        message,
      ].join('\n'),
      'Dart Masters',
      false
    );

    const sent = await sendMail({
      to: supportInbox,
      subject: `[Kontaktformular] ${subject}`,
      text: plainText,
      html,
    });

    if (!sent) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Die Nachricht konnte nicht versendet werden. Bitte spaeter erneut versuchen.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Danke! Deine Nachricht wurde erfolgreich versendet.',
    });
  } catch (error) {
    console.error('Error while submitting contact form:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Interner Fehler beim Versand. Bitte spaeter erneut versuchen.',
      },
      { status: 500 }
    );
  }
}
