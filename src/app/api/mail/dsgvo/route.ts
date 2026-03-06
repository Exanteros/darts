import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const { email, threadId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Keine E-Mail-Adresse angegeben' }, { status: 400 });
    }

    const emails = await prisma.supportEmail.findMany({
      where: {
        OR: [
          { fromEmail: email },
          { toEmail: email }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Keine Daten zu dieser E-Mail gefunden' }, { status: 404 });
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      userEmail: email,
      dsgvoRequest: true,
      recordsCount: emails.length,
      data: emails.map((m: any) => ({
        messageId: m.messageId,
        threadId: m.threadId,
        subject: m.subject,
        fromType: m.isReply ? "Support" : "User",
        fromName: m.fromName,
        fromEmail: m.fromEmail,
        toEmail: m.toEmail,
        date: m.createdAt,
        content: m.bodyText,
        htmlContent: m.bodyHtml
      }))
    };

    const jsonBuffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');

    // Send email with attachment
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Support" <noreply@pudo-dartmasters.de>',
      to: email,
      subject: `Ihre DSGVO-Auskunft [${threadId ? threadId : 'Auskunft'}]`,
      text: `Hallo,\n\nanbei erhalten Sie wie gewünscht im Anhang den Auszug all Ihrer gespeicherten, diese E-Mail-Adresse betreffenden, Support-Daten gemäß DSGVO.\n\nViele Grüße\nIhr Support-Team`,
      attachments: [
        {
          filename: `dsgvo-export-${email.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`,
          content: jsonBuffer,
          contentType: 'application/json'
        }
      ]
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error generating and sending DSGVO export:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Exports' }, { status: 500 });
  }
}
