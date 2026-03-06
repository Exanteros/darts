import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderHtml } from '@/lib/mail';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function POST(req: Request) {
  try {
    const { to, subject, text, html, inReplyTo, references, isSupportReply } = await req.json();

    if (!to || !subject || (!text && !html)) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    let finalHtml = html || text?.replace(/\n/g, '<br/>');

    if (isSupportReply) {
      const brandName = process.env.BRAND_NAME || 'Darts Masters Support';
      const rawContent = html || text || '';
      
      // Wrap content nicely for the user and pass true so the inner HTML tags are kept intact.
      // Append signature to inner content before wrapping it.
      const supportEmail = process.env.IMAP_USER || process.env.SMTP_USER || 'support@pudo-dartmasters.de';
      
      let signatureContext = html ? rawContent : rawContent.replace(/\n/g, '<br/>');
      signatureContext += `
        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">
          <strong>Dein ${brandName} Support-Team</strong><br/>
          <a href="mailto:${supportEmail}" style="color:#3b82f6; text-decoration:none;">${supportEmail}</a><br/>
          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>
        </div>
      `;
      finalHtml = await renderHtml(signatureContext, brandName, true);
    }

    const mailOptions = {
      from: isSupportReply ? `Support <${process.env.IMAP_USER || process.env.SMTP_USER}>` : (process.env.SMTP_FROM || `Support <${process.env.SMTP_USER}>`),
      replyTo: isSupportReply ? (process.env.IMAP_USER || process.env.SMTP_USER) : undefined,
      to,
      subject,
      text,
      html: finalHtml,
      inReplyTo,
      references
    };

    const sent = await transporter.sendMail(mailOptions);

    // Ticket ID extrahieren (falls aus Support Panel)
    const ticketMatch = subject.match(/\[(DT-[A-Z0-9]{6})\]/i);
    const threadId = ticketMatch ? ticketMatch[1].toUpperCase() : (inReplyTo || null);

    // Save our reply in the DB
    await prisma.supportEmail.create({
      data: {
        messageId: sent.messageId || `reply-${Date.now()}`,
        threadId: threadId,
        subject: subject,
        fromEmail: isSupportReply ? (process.env.IMAP_USER || process.env.SMTP_USER || 'system') : (process.env.SMTP_USER || 'system'),
        toEmail: to,
        bodyText: text,
        bodyHtml: html || text,
        isRead: true, // We wrote it
        isReply: true,
      }
    });

    return NextResponse.json({ success: true, messageId: sent.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
