import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

const DEFAULT_TEMPLATES = [
  { id: 'registration', name: 'Registrierungs-Bestätigung', subject: 'Willkommen beim Darts Turnier! 🎯', content: '# Willkommen {name}!\n\nVielen Dank für deine **Registrierung** beim Darts Turnier.\n\nWir freuen uns sehr, dich dabei zu haben!\n\n## Nächste Schritte:\n- Prüfe deine E-Mail-Adresse\n- Halte dich über Updates auf dem Laufenden\n- Bereite dich auf spannende Matches vor\n\nBis bald am Board! 🎯\n\n**Dein Turnier-Team**', description: 'Wird automatisch nach der Registrierung versendet.' },
  { id: 'login', name: 'Login Link / Magic Link', subject: 'Dein Login Link für das Darts Turnier 🔐', content: '# Hallo {name}!\n\nHier ist dein persönlicher **Login-Link**:\n\n[Jetzt einloggen]({link})\n\n⏰ Dieser Link ist **24 Stunden** gültig.\n\nWenn du diesen Link nicht angefordert hast, ignoriere diese E-Mail einfach.\n\nViele Grüße,\n**Dein Turnier-Team**', description: 'Enthält den Magic Link für den Login.' },
  { id: 'tournament-start', name: 'Turnier-Start Benachrichtigung', subject: 'Das Turnier beginnt JETZT! 🚀', content: '# 🎯 Hallo Darts-Freunde!\n\n## Das Turnier **{tournamentName}** startet in Kürze!\n\nBitte findet euch **rechtzeitig am Board** ein.\n\n### Wichtige Infos:\n- **Start:** {startTime}\n- **Dein Board:** {boardName}\n- **Gegner:** {opponentName}\n\n**Gut Darts!** 🎯\n\n*Die Turnierleitung*', description: 'Erinnerung kurz vor Turnierbeginn.' },
];

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id } = await context.params;
    let template;
    try {
      template = await prisma.emailTemplate.findUnique({ where: { id } });
    } catch (e) {
      // fallback to defaults
      const t = DEFAULT_TEMPLATES.find(t => t.id === id);
      if (t) template = t;
    }
    if (!template) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id } = await context.params;
    const { name, subject, content, description } = await request.json();
    if (!name || !subject || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const sanitized = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { a: ['href', 'name', 'target'], img: ['src', 'alt'] }
    });

    const updated = await prisma.emailTemplate.update({ where: { id }, data: { name, subject, content: sanitized, description } });
    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id } = await context.params;
    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
