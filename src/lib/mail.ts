import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// If SMTP is configured, verify the transporter on startup and log status
// Only attempt verification in non-production and when a real host is provided.
// Avoid verifying against placeholder hosts (e.g. smtp.example.com) during build/prerender.
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
  process.env.NODE_ENV !== 'production' &&
  !String(process.env.SMTP_HOST).includes('example.com')
) {
  transporter.verify().then(() => {
    console.log('✅ SMTP transporter verified');
  }).catch((err) => {
    console.warn('❌ SMTP transporter verification failed:', err);
  });
} else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  // Log a concise message in production or when using placeholder host without attempting network calls
  console.log('ℹ️ SMTP configured but verification skipped (production or placeholder host)');
}

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  console.log(`📧 Attempting to send email to: ${to}`);

  // If SMTP is not configured, fallback to simulation
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`\n--- [MAIL SIMULATION (No SMTP Config)] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${text}`);
    if (html) {
      console.log(`HTML Body: \n${html}`);
    }
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

export async function renderHtml(content: string, tournamentName?: string, isHtml: boolean = false) {
  const logo = process.env.SMTP_LOGO_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vercel.svg`;
  
  // Hole Tournament-Name dynamisch aus DB falls nicht übergeben
  let brandName = tournamentName;
  if (!brandName) {
    try {
      const activeTournament = await prisma.tournament.findFirst({
        where: { status: { in: ['ACTIVE', 'REGISTRATION_OPEN'] } },
        orderBy: { startDate: 'desc' }
      });
      brandName = activeTournament?.name || process.env.BRAND_NAME || 'Darts Masters Puschendorf';
    } catch {
      brandName = process.env.BRAND_NAME || 'Darts Masters Puschendorf';
    }
  }
  
  const brandColor = '#1a365d'; // Primary Blue from globals.css
  const accentColor = '#3b82f6'; // Lighter Blue for accents
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  let htmlContent = content;

  if (!isHtml) {
    // Konvertiere Markdown-ähnliche Formatierung in HTML nur wenn es kein HTML ist
    htmlContent = content
      .replace(/\n\n/g, '</p><p style="margin: 0 0 16px 0;">')
      .replace(/\n/g, '<br/>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #111827; font-weight: 600;">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em style="color: #4b5563;">$1</em>')
      .replace(/^# (.+)$/gm, '<h1 style="color: #111827; margin: 0 0 24px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="color: #1f2937; margin: 32px 0 16px 0; font-size: 20px; font-weight: 600; letter-spacing: -0.025em;">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="color: #374151; margin: 24px 0 12px 0; font-size: 18px; font-weight: 600;">$3</h3>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <a href="$2" style="background-color: ${brandColor}; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 600; line-height: 1.5; padding: 12px 32px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">$1</a>
            </td>
          </tr>
        </table>
      `);
  }
  
  return `<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>${brandName}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <!-- Main Container -->
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 32px 40px; background-color: #ffffff; text-align: center; border-bottom: 1px solid #f3f4f6;">
                  <img src="${logo}" alt="${brandName}" style="height: 48px; width: auto; margin-bottom: 0;" />
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 40px; color: #374151; font-size: 16px; line-height: 1.6;">
                  ${htmlContent}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #f3f4f6;">
                  <p style="margin: 0 0 16px 0; color: #111827; font-weight: 600; font-size: 16px;">
                    ${brandName}
                  </p>
                  <div style="margin-bottom: 24px;">
                    <a href="${siteUrl}" style="color: ${brandColor}; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Website</a>
                    <a href="${siteUrl}/login" style="color: ${brandColor}; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Login</a>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                    Diese E-Mail wurde automatisch generiert. Bitte antworte nicht direkt auf diese Nachricht.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} ${brandName}. Alle Rechte vorbehalten.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Bottom Branding -->
            <table role="presentation" style="width: 100%; max-width: 600px; margin-top: 24px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    Powered by <strong style="color: #6b7280;">Darts Turnier Manager</strong>
                  </p>
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
    // Versuche Template aus DB zu laden
    const template = await prisma.emailTemplate.findUnique({
      where: { id: 'registration' }
    });

    let subject = template?.subject || "Willkommen beim Darts Turnier! 🎯";
    let content = template?.content || `# Willkommen ${name}!\n\nVielen Dank für deine **Registrierung** beim Darts Turnier.\n\nWir freuen uns sehr, dich dabei zu haben!\n\nBis bald am Board! 🎯\n\n**Dein Turnier-Team**`;

    // Ersetze Platzhalter
    content = content.replace(/{name}/g, name);
    subject = subject.replace(/{name}/g, name);

    const html = await renderHtml(content);
    const text = content.replace(/\*\*/g, '').replace(/[#*]/g, ''); // Strip Markdown for plain text
    
    return sendMail({ to: email, subject, text, html });
  } catch (error) {
    console.error('Error loading email template, using fallback:', error);
    // Fallback
    const subject = "Willkommen beim Darts Turnier! 🎯";
    const text = `Hallo ${name},\n\nvielen Dank für deine Registrierung beim Darts Turnier.\n\nWir freuen uns, dich dabei zu haben!\n\nDein Turnier-Team`;
    const html = await renderHtml(text);
    return sendMail({ to: email, subject, text, html });
  }
}

export async function sendTournamentRegistrationEmail(email: string, name: string, tournamentName: string) {
  const subject = `Anmeldung bestätigt: ${tournamentName}`;
  const text = `Hallo ${name},

deine Anmeldung für das Turnier "${tournamentName}" wurde erfolgreich bestätigt.

Gut Darts!
Dein Turnier-Team`;

  const html = await renderHtml(text, tournamentName);
  return sendMail({ to: email, subject, text, html });
}
