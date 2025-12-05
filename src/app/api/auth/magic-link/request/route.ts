import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';

// Rate Limiting - Redis-backed for production scalability
// Limits: 5 requests per hour per IP, 3 per hour per email

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Input Validierung
    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'E-Mail ist erforderlich.'
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({
        success: false,
        message: 'Ungültige E-Mail-Adresse.'
      }, { status: 400 });
    }

    // Rate Limiting - basierend auf IP und Email
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipLimit = await checkRateLimit(`ip:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
    const emailLimit = await checkRateLimit(`email:${normalizedEmail}`, 3, 60 * 60 * 1000); // 3 per hour

    if (!ipLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: `Zu viele Anfragen. Bitte versuche es in ${ipLimit.retryAfter} Sekunden erneut.`
      }, { 
        status: 429,
        headers: {
          'Retry-After': ipLimit.retryAfter?.toString() || '3600'
        }
      });
    }

    if (!emailLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: `Zu viele Anfragen für diese E-Mail. Bitte versuche es in ${emailLimit.retryAfter} Sekunden erneut.`
      }, { 
        status: 429,
        headers: {
          'Retry-After': emailLimit.retryAfter?.toString() || '3600'
        }
      });
    }

    // Prüfe ob User existiert
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    console.log(`🔍 Login attempt for ${normalizedEmail}. User found: ${!!user}`);

    if (!user) {
      // Timing-Attack Prevention: Gleiche Antwortzeit wie bei existierendem User
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      
      return NextResponse.json({
        success: true,
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde ein Login-Link versendet.'
      });
    }

    // Lösche alte, abgelaufene Tokens für diese E-Mail
    await prisma.magicLinkToken.deleteMany({
      where: {
        email: normalizedEmail,
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    });

    // Prüfe ob bereits ein aktiver Token existiert (innerhalb der letzten 5 Minuten)
    const recentToken = await prisma.magicLinkToken.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    if (recentToken) {
      return NextResponse.json({
        success: true,
        message: 'Ein Login-Link wurde kürzlich versendet. Bitte prüfe dein Postfach oder warte 5 Minuten.'
      });
    }

    // Generiere kryptographisch sicheren Token (64 Bytes = 128 hex chars)
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten statt 24h

    // Speichere Token in DB
    await prisma.magicLinkToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
        used: false
      }
    });

    // HTTPS-only URL
    const baseUrl = process.env.NEXTAUTH_URL || '';
    if (!baseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_URL muss HTTPS verwenden in Production');
    }

    const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;

    // Sende Email mit Magic Link
    const { sendMail, renderHtml } = await import('@/lib/mail');
    
    const template = await prisma.emailTemplate.findUnique({
      where: { id: 'login' }
    });

    let content = template?.content || `Hallo {name}!

Du hast einen Login-Link für das Darts Masters Puschendorf angefordert.

[Jetzt anmelden]({link})

Dieser Link ist 15 Minuten gültig und kann nur einmal verwendet werden.

Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.

**Sicherheitshinweise:**
* Teile diesen Link mit niemandem
* Der Link funktioniert nur einmal
* Nach 15 Minuten wird der Link ungültig

Viel Erfolg beim Turnier!
Darts Masters Puschendorf`;

    let subject = template?.subject || 'Dein sicherer Login-Link';

    // Ersetze Platzhalter
    content = content.replace(/{name}/g, user.name || 'Spieler');
    content = content.replace(/{link}/g, magicLinkUrl);

    const html = await renderHtml(content);
    
    try {
      const success = await sendMail({
        to: normalizedEmail,
        subject,
        text: content,
        html
      });

      if (!success) {
        throw new Error('sendMail returned false');
      }
    } catch (emailError) {
      console.error('Email Send Error:', emailError);
      // Token löschen wenn Email fehlschlägt
      await prisma.magicLinkToken.delete({
        where: { token }
      });
      
      return NextResponse.json({
        success: false,
        message: 'Fehler beim Versenden der E-Mail. Bitte prüfe die Server-Logs.'
      }, { status: 500 });
    }

    // Audit Log (optional)
  // Minimal audit log. Do not log link or full email in production logs.
  console.log('Magic Link requested for user', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Ein Login-Link wurde an deine E-Mail-Adresse gesendet. Der Link ist 15 Minuten gültig.',
      // In dev: zeige den Link
      // Do not return the magic link in API responses to prevent token leakage.
    });
  } catch (error) {
    console.error('Magic Link Request Error:', error);
    
    // Keine sensiblen Informationen im Fehler
    return NextResponse.json({
      success: false,
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.'
    }, { status: 500 });
  }
}
