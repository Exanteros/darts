import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                               */
/* -------------------------------------------------------------------------- */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// SMTP Logging & Verification Logic
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  console.log('📧 SMTP Configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM
  });
}

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  !String(process.env.SMTP_HOST).includes('example.com')
) {
  transporter.verify().then(() => {
    console.log('✅ SMTP transporter verified');
  }).catch((err) => {
    console.warn('❌ SMTP transporter verification failed:', err);
  });
} else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  // Log skipped verification (Original Logic restored)
  console.log('ℹ️ SMTP configured but verification skipped. Conditions met for skip.');
}

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                 */
/* -------------------------------------------------------------------------- */

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  console.log(`📧 Attempting to send email to: ${to}`);

  // If SMTP is not configured, fallback to simulation
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`\n--- [MAIL SIMULATION (No SMTP Config)] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${text}`);
    if (html) console.log(`HTML Body included.`);
    console.log(`------------------------------------------\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Darts Turnier" <noreply@example.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}

/**
 * Renders High-End SaaS "Bento" Style HTML
 */
export async function renderHtml(content: string, tournamentName?: string, isHtml: boolean = false) {
  const logo = process.env.SMTP_LOGO_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vercel.svg`;
  
  // Hole Tournament-Name dynamisch aus DB falls nicht übergeben (Original Logic)
  let brandName = tournamentName;
  if (!brandName) {
    try {
      const activeTournament = await prisma.tournament.findFirst({
        where: { status: { in: ['ACTIVE', 'REGISTRATION_OPEN'] } },
        orderBy: { startDate: 'desc' }
      });
      brandName = activeTournament?.name || process.env.BRAND_NAME || 'Darts Masters';
    } catch {
      brandName = process.env.BRAND_NAME || 'Darts Masters';
    }
  }
  
  // Design Tokens - Greyscale / Bento Theme
  const colors = {
    bg: '#fafafa',        
    card: '#ffffff',      
    textMain: '#111111',  
    textBody: '#555555',  
    textMuted: '#999999', 
    border: '#eaeaea',    
    panel: '#f4f4f5',     
    brand: '#1a365d',     // Dein Blau
  };

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  let htmlContent = content;

  if (!isHtml) {
    // Markdown Parser angepasst auf Bento Style
    htmlContent = content
      .replace(/\n\n/g, '</p><p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #555555;">')
      .replace(/\n/g, '<br/>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #000000; font-weight: 600;">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em style="font-family: Georgia, serif; color: #666; font-style: italic;">$1</em>')
      
      // H1: Massive & Tight
      .replace(/^# (.+)$/gm, `<h1 style="color: #000000; margin: 0 0 24px 0; font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: -0.03em;">$1</h1>`)
      // H2: Eyebrow Style (Small, Uppercase)
      .replace(/^## (.+)$/gm, `<h2 style="color: #888888; margin: 32px 0 12px 0; font-size: 11px; line-height: 1.4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em;">$1</h2>`)
      // H3: Standard Subhead
      .replace(/^### (.+)$/gm, `<h3 style="color: #111111; margin: 24px 0 12px 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em;">$1</h3>`)
      
      // Blockquote -> Bento Tile
      .replace(/^> (.+)$/gm, `
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td style="background-color: ${colors.panel}; border-radius: 8px; padding: 20px; border: 1px solid ${colors.border};">
              <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500; line-height: 1.6;">$1</p>
            </td>
          </tr>
        </table>
      `)
      
      // Button
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
          <tr>
            <td align="center">
              <a href="$2" target="_blank" style="display: block; width: 100%; background-color: ${colors.brand}; color: #ffffff; font-size: 14px; font-weight: 600; line-height: 1.5; padding: 14px 24px; text-decoration: none; border-radius: 8px; text-align: center; box-sizing: border-box;">$1</a>
            </td>
          </tr>
        </table>
      `);
      
    if (!htmlContent.startsWith('<')) {
      htmlContent = `<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #555555;">${htmlContent}</p>`;
    }
  }
  
  return `<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brandName}</title>
      <style>
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.bg}; color: ${colors.textMain};">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: ${colors.bg};">
        <tr>
          <td align="center" style="padding: 40px 12px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 520px; background-color: ${colors.card}; border: 1px solid ${colors.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <tr>
                <td style="padding: 40px 40px 0 40px;">
                   <img src="${logo}" alt="Logo" width="32" height="32" style="display: block; border-radius: 6px; width: 32px; height: 32px; background-color: #eee;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 40px 40px 40px;">
                  ${htmlContent}
                </td>
              </tr>
              <tr>
                <td style="background-color: ${colors.panel}; padding: 24px 40px; border-top: 1px solid ${colors.border};">
                  <table role="presentation" width="100%">
                    <tr>
                      <td align="center">
                        <p style="margin: 0; font-size: 12px; color: ${colors.textMuted}; line-height: 1.5;">
                          <strong>${brandName}</strong>
                        </p>
                        <div style="margin-top: 16px;">
                          <a href="${siteUrl}" style="color: ${colors.textMain}; text-decoration: none; font-size: 12px; font-weight: 500; margin: 0 8px;">Dashboard</a>
                          <span style="color: ${colors.border};">|</span>
                          <a href="${siteUrl}/impressum" style="color: ${colors.textMain}; text-decoration: none; font-size: 12px; font-weight: 500; margin: 0 8px;">Impressum</a>
                          <span style="color: ${colors.border};">|</span>
                          <a href="${siteUrl}/datenschutz" style="color: ${colors.textMain}; text-decoration: none; font-size: 12px; font-weight: 500; margin: 0 8px;">Datenschutz</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <p style="font-size: 11px; color: #cccccc; text-transform: uppercase; letter-spacing: 0.5px;">Powered by Darts Manager</p>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: 'registration' }
    });

    let subject = template?.subject || "Willkommen beim Darts Turnier! 🎯";
    
    // Bento-Style Default Content
    let content = template?.content || 
`# Willkommen ${name}!

## Status
> Erfolgreich registriert

Vielen Dank für deine Registrierung beim Darts Turnier.
Wir freuen uns sehr, dich dabei zu haben!

[Zum Dashboard](${process.env.NEXTAUTH_URL || 'http://localhost:3000'})`;

    // Ersetze Platzhalter
    content = content.replace(/{name}/g, name);
    subject = subject.replace(/{name}/g, name);

    const html = await renderHtml(content);
    // Plain Text Strip
    const text = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2').replace(/[#*>]/g, ''); 
    
    return sendMail({ to: email, subject, text, html });
  } catch (error) {
    console.error('Error loading email template, using fallback:', error);
    const subject = "Willkommen beim Darts Turnier! 🎯";
    const text = `Hallo ${name},\nvielen Dank für deine Registrierung.`;
    const html = await renderHtml(`# Hallo ${name}\n\nWillkommen!`, undefined);
    return sendMail({ to: email, subject, text, html });
  }
}

export async function sendTournamentRegistrationEmail(email: string, name: string, tournamentName: string) {
  const subject = `Anmeldung bestätigt: ${tournamentName}`;
  const textRaw = 
`# Anmeldung Bestätigt

## Turnier
> ${tournamentName}

Hallo ${name},
deine Anmeldung wurde erfolgreich bestätigt.

Gut Darts!`;

  const html = await renderHtml(textRaw, tournamentName);
  const text = textRaw.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2').replace(/[#*>]/g, '');
  return sendMail({ to: email, subject, text, html });
}