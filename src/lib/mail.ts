import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// SMTP Logging
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  if (!String(process.env.SMTP_HOST).includes('example.com')) {
    transporter.verify().then(() => {
      console.log('✅ SMTP transporter verified');
    }).catch((err) => {
      console.warn('❌ SMTP transporter verification failed:', err);
    });
  }
}

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                                                 */
/* -------------------------------------------------------------------------- */

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`\n--- [MAIL SIMULATION] ---\nTo: ${to}\nSubject: ${subject}\nBody: ${text}\n-------------------------\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Darts Masters" <noreply@example.com>',
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
 * Renders High-End Email Style passend zum Website-Design
 */
export async function renderHtml(content: string, tournamentName?: string, isHtml: boolean = false) {
  // 1. Versuche Logo aus den globalen Einstellungen zu laden
  let logo = process.env.SMTP_LOGO_URL;
  
  if (!logo) {
    try {
      const settings = await prisma.tournamentSettings.findUnique({
        where: { id: 'default' }
      });
      if (settings?.mainLogo) {
        logo = settings.mainLogo;
      }
    } catch (e) {
      console.error('Error fetching tournament settings for email logo:', e);
    }
  }

  // Fallback
  if (!logo) {
    logo = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vercel.svg`;
  }

  // Ensure absolute URL for email clients
  if (logo && logo.startsWith('/')) {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://dartsturnier-puschendorf.de';
    logo = `${baseUrl}${logo}`;
  }
  
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
  
  // Design Tokens abgestimmt auf deine Website (Slate/Blue/Black)
  const colors = {
    bg: '#fcfcfc',        
    cardBg: '#ffffff',
    textMain: '#0f172a',  // slate-900
    textBody: '#475569',  // slate-600
    textMuted: '#94a3b8', // slate-400
    border: '#f1f5f9',    // slate-100
    accent: '#3b82f6',    // blue-500
    dark: '#020617',      // slate-950 (Website Header/Button Stil)
  };

  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  let htmlContent = content;

  if (!isHtml) {
    htmlContent = content
      .replace(/\n\n/g, '</p><p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #475569;">')
      .replace(/\n/g, '<br/>')
      .replace(/\*\*([^*]+)\*\*/g, `<strong style="color: ${colors.textMain}; font-weight: 600;">$1</strong>`)
      
      // H1: Groß und fett wie auf der Hero-Page
      .replace(/^# (.+)$/gm, `<h1 style="color: ${colors.textMain}; margin: 0 0 16px 0; font-size: 28px; line-height: 1.2; font-weight: 800; letter-spacing: -0.02em;">$1</h1>`)
      // H2: Kleiner Badge-Stil
      .replace(/^## (.+)$/gm, `<h2 style="color: ${colors.accent}; margin: 24px 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">$1</h2>`)
      
      // Blockquote -> Bento-Tile Look
      .replace(/^> (.+)$/gm, `
        <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border: 1px solid ${colors.border}; border-radius: 12px;">
          <p style="margin: 0; color: ${colors.textMain}; font-size: 14px; font-weight: 500;">$1</p>
        </div>
      `)
      
      // Button -> Black Shimmer Style
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `
        <div style="margin: 32px 0; text-align: center;">
          <a href="$2" target="_blank" style="display: inline-block; background-color: ${colors.dark}; color: #ffffff; font-size: 15px; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">$1</a>
        </div>
      `);
      
    if (!htmlContent.startsWith('<')) {
      htmlContent = `<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: ${colors.textBody};">${htmlContent}</p>`;
    }
  }
  
  return `<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brandName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: ${colors.cardBg}; border: 1px solid ${colors.border}; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <tr>
                <td style="padding: 32px 40px 0 40px;">
                   <table width="100%">
                    <tr>
                      <td>
                        <div style="background-color: ${colors.dark}; width: 32px; height: 32px; border-radius: 8px; display: inline-block; text-align: center; vertical-align: middle;">
                          <img src="${logo}" alt="🎯" width="20" height="20" style="margin-top: 6px;" />
                        </div>
                        <span style="margin-left: 8px; font-weight: 700; color: ${colors.textMain}; font-size: 18px; vertical-align: middle;">Darts Masters</span>
                      </td>
                    </tr>
                   </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  ${htmlContent}
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <hr style="border: 0; border-top: 1px solid ${colors.border}; margin: 0 0 24px 0;" />
                  <table width="100%">
                    <tr>
                      <td align="center" style="font-size: 12px; color: ${colors.textMuted}; line-height: 1.5;">
                        <p style="margin: 0 0 12px 0; font-weight: 600; color: ${colors.textMain};">${brandName}</p>
                        <a href="${siteUrl}" style="color: ${colors.accent}; text-decoration: none; font-weight: 500;">Dashboard</a>
                        <span style="margin: 0 8px; color: #e2e8f0;">•</span>
                        <a href="${siteUrl}/impressum" style="color: ${colors.textMuted}; text-decoration: none;">Impressum</a>
                        <span style="margin: 0 8px; color: #e2e8f0;">•</span>
                        <a href="${siteUrl}/datenschutz" style="color: ${colors.textMuted}; text-decoration: none;">Datenschutz</a>
                        <p style="margin: 16px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #cbd5e1;">Puschendorf 2026</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { id: 'registration' } });
    let subject = template?.subject || "Willkommen beim Darts Masters! 🎯";
    
    let content = template?.content || 
`# Willkommen ${name}!

## Status
> Erfolgreich registriert

Vielen Dank für deine Registrierung beim Darts Masters. Wir freuen uns sehr, dich dabei zu haben!

[Zum Dashboard](${process.env.NEXTAUTH_URL || 'http://localhost:3000'})`;

    content = content.replace(/{name}/g, name);
    subject = subject.replace(/{name}/g, name);

    const html = await renderHtml(content);
    const text = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2').replace(/[#*>]/g, ''); 
    
    return sendMail({ to: email, subject, text, html });
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

export async function sendTournamentRegistrationEmail(email: string, name: string, tournamentName: string, status: string = 'CONFIRMED') {
  const isWaitingList = status === 'WAITING_LIST';
  const subject = isWaitingList ? `Warteliste: ${tournamentName}` : `Anmeldung bestätigt: ${tournamentName}`;
    
  const content = isWaitingList
    ? `# Warteliste\n\n## Turnier\n> ${tournamentName}\n\nHallo ${name},\ndas Turnier ist leider bereits voll. Du wurdest auf die **Warteliste** gesetzt.`
    : `# Anmeldung Bestätigt\n\n## Turnier\n> ${tournamentName}\n\nHallo ${name},\ndeine Anmeldung wurde erfolgreich bestätigt.\n\nGut Darts!`;

  const html = await renderHtml(content, tournamentName);
  const text = content.replace(/[#*>]/g, '');
  return sendMail({ to: email, subject, text, html });
}