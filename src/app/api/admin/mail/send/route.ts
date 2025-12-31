import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendMail, renderHtml } from '@/lib/mail';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { getSession } from '@/lib/session';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    const body = await request.json();
  const { recipientType, subject, message, html } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Restrict recipient types for non-admins
    if (!isAdmin && (recipientType === 'all' || recipientType === 'admins')) {
      return NextResponse.json({ error: 'Unauthorized recipient type' }, { status: 403 });
    }

  let recipients: { email: string; name: string | null }[] = [];
  let activeTournament: { id: string; name?: string } | null = null;

    if (recipientType === 'all') {
      const users = await prisma.user.findMany({
        select: { email: true, name: true }
      });
      recipients = users;
    } else if (recipientType === 'admins') {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
      });
      recipients = admins;
    } else if (recipientType === 'active') {
      // Find active tournament
      // Use activeTournamentId from cookie if available
      const cookieStore = await cookies();
      const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

      if (activeTournamentId) {
        activeTournament = await prisma.tournament.findUnique({
          where: { id: activeTournamentId }
        });
      }

      if (!activeTournament) {
        activeTournament = await prisma.tournament.findFirst({
          where: { status: 'ACTIVE' }
        });
      }

      if (activeTournament) {
        // Check access
        if (!isAdmin && !allowedTournamentIds.includes(activeTournament.id)) {
             return NextResponse.json({ error: 'Unauthorized for this tournament' }, { status: 403 });
        }

        const players = await prisma.tournamentPlayer.findMany({
          where: { tournamentId: activeTournament.id },
          include: { user: true }
        });
        recipients = players.map(p => ({ email: p.user.email, name: p.user.name }));
      }
    }

    // Remove duplicates (if any)
    const uniqueRecipients = Array.from(new Map(recipients.map(item => [item.email, item])).values());

    console.log(`Preparing to send email to ${uniqueRecipients.length} recipients`);
    console.log(`Subject: ${subject}`);
    console.log(`Message preview: ${message.substring(0, 50)}...`);

    // Prepare per-recipient personalization and batching
    const markdownBase = html || message || '';

    function personalize(template: string, vars: Record<string, string | undefined>) {
      let out = template;
      for (const k of Object.keys(vars)) {
        const re = new RegExp(`\\{\\s*${k}\\s*\\}`, 'g');
        out = out.replace(re, vars[k] ?? '');
      }
      return out;
    }
    if (uniqueRecipients.length === 0) {
      return NextResponse.json({ error: 'Keine Empfänger gefunden' }, { status: 400 });
    }

    // Batch sending with retries
    const batchSize = Number(body.batchSize) || 50;
    const retryCount = Number(body.retries) || 2;
    const batchDelayMs = Number(body.batchDelayMs) || 500; // delay between batches

    function chunkArray<T>(arr: T[], size: number) {
      const res: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
      }
      return res;
    }

    async function sendWithRetries(payload: { email: string; subject: string; text: string; html?: string }, retriesLeft = retryCount) {
      let attempt = 0;
      while (attempt <= retriesLeft) {
        try {
          const html = payload.html || await renderHtml(payload.text);
          const ok = await sendMail({ to: payload.email, subject: payload.subject, text: payload.text, html });
          if (ok) return true;
        } catch (e) {
          console.error('Error sending to', payload.email, e);
        }
        attempt++;
        // backoff
        await new Promise(res => setTimeout(res, 250 * attempt));
      }
      return false;
    }

    const batches = chunkArray(uniqueRecipients, batchSize);
    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
      const results = await Promise.allSettled(batch.map(async (r) => {
        // personalize message and subject per recipient
        const vars = { name: r.name || r.email, email: r.email, tournamentName: activeTournament?.name } as Record<string, string | undefined>;
        const subjectPersonal = personalize(subject, vars);
        const md = personalize(markdownBase, vars);
  const parsed = String(marked.parse(md || ''));
  const cleaned = sanitizeHtml(parsed, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']), allowedAttributes: { a: ['href', 'name', 'target'], img: ['src', 'alt'] } });
        const htmlPersonal = await renderHtml(cleaned, activeTournament?.name, true);
        // send with retries
  return sendWithRetries({ email: r.email, subject: subjectPersonal, text: md, html: htmlPersonal });
      }));
      successCount += results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value === true).length;
      failCount += results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value === false).length;
      failCount += results.filter(r => r.status === 'rejected').length;
      // wait between batches
      if (batchDelayMs > 0) await new Promise(res => setTimeout(res, batchDelayMs));
    }

    console.log(`Sent: ${successCount}, Failed: ${failCount}`);

    return NextResponse.json({ 
      success: true, 
      count: uniqueRecipients.length,
      sent: successCount,
      failed: failCount,
      message: `Email send completed (simulation fallback if no SMTP configured).` 
    });

  } catch (error) {
    console.error('Error sending mail:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
