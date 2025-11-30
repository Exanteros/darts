import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
const DEFAULT_TEMPLATES = [
  {
    id: 'registration',
    name: 'Registrierungs-Bestätigung',
    subject: 'Willkommen beim Darts Turnier!',
    content: 'Hallo {name},\n\nvielen Dank für deine Registrierung beim Darts Turnier.\n\nWir freuen uns, dich dabei zu haben!\n\nDein Turnier-Team',
    lastModified: new Date().toISOString(),
    description: 'Wird automatisch nach der Registrierung versendet.'
  },
  {
    id: 'login',
    name: 'Login Link / Magic Link',
    subject: 'Dein Login Link für das Darts Turnier',
    content: 'Hallo {name},\n\nhier ist dein persönlicher Login-Link:\n\n{link}\n\nDieser Link ist 24 Stunden gültig.\n\nViele Grüße,\nDein Turnier-Team',
    lastModified: new Date().toISOString(),
    description: 'Enthält den Magic Link für den Login.'
  },
  {
    id: 'tournament-start',
    name: 'Turnier-Start Benachrichtigung',
    subject: 'Das Turnier beginnt bald!',
    content: 'Hallo Darts-Freunde,\n\ndas Turnier beginnt in Kürze! Bitte findet euch am Board ein.\n\nGut Darts!\nDie Turnierleitung',
    lastModified: new Date().toISOString(),
    description: 'Erinnerung kurz vor Turnierbeginn.'
  }
];
import sanitizeHtml from 'sanitize-html';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let templates;
    try {
      templates = await prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } });
    } catch (e) {
      console.warn('DB templates not available, using defaults', e);
      templates = DEFAULT_TEMPLATES;
    }
    // Attach lastModified and sanitized content for safety
    const sanitized = templates.map(t => {
      const tm: any = t;
      return {
        id: t.id,
        name: t.name,
        subject: t.subject,
        content: t.content,
        lastModified: tm.updatedAt ? new Date(tm.updatedAt).toISOString() : (tm.lastModified || new Date().toISOString()),
        description: t.description
      };
    });
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, subject, content, description } = await request.json();
    if (!name || !subject || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const sanitized = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { a: ['href', 'name', 'target'], img: ['src', 'alt'] }
    });

    const created = await prisma.emailTemplate.create({ data: { id, name, subject, content: sanitized, description } });
    return NextResponse.json({ success: true, template: created });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
