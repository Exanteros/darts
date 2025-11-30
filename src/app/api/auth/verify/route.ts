import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rate Limiting für Token-Verifikation
const verifyAttempts = new Map<string, { count: number; resetAt: number }>();

function checkVerifyRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = verifyAttempts.get(ip);

  if (limit && now < limit.resetAt) {
    if (limit.count >= 10) { // Max 10 Versuche pro Stunde
      return { allowed: false, retryAfter: Math.ceil((limit.resetAt - now) / 1000) };
    }
    limit.count++;
    return { allowed: true };
  }

  verifyAttempts.set(ip, {
    count: 1,
    resetAt: now + 60 * 60 * 1000
  });

  return { allowed: true };
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate Limiting
    const rateLimit = checkVerifyRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.redirect(
        new URL('/login?error=too_many_attempts', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 Verify Token Request:', {
      hasToken: !!token,
      tokenLength: token?.length,
      ip
    });

    // Token Validierung
    if (!token || typeof token !== 'string') {
      console.warn(`Invalid token format from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Token Format Check (sollte 128 hex chars sein)
    if (!/^[a-f0-9]{128}$/i.test(token)) {
      console.warn(`Invalid token structure from IP ${ip}, length: ${token.length}`);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Atomare Token-Prüfung und Update (Race Condition Prevention)
    const magicLink = await prisma.$transaction(async (tx) => {
      const link = await tx.magicLinkToken.findUnique({
        where: { token }
      });

      if (!link) {
        return null;
      }

      // Prüfe ob Token abgelaufen
      if (new Date() > link.expiresAt) {
        // Lösche abgelaufene Tokens
        await tx.magicLinkToken.delete({
          where: { token }
        });
        return 'expired';
      }

      // Prüfe ob Token bereits verwendet
      if (link.used) {
        return 'used';
      }

      // Markiere Token sofort als verwendet (Race Condition Protection)
      await tx.magicLinkToken.update({
        where: { token },
        data: { used: true }
      });

      return link;
    });

    if (!magicLink) {
      console.warn(`Token not found from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    if (magicLink === 'expired') {
      console.warn(`Expired token attempt from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url));
    }

    if (magicLink === 'used') {
      console.warn(`Token reuse attempt from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=token_already_used', request.url));
    }

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: magicLink.email }
    });

    if (!user) {
      console.error(`User not found for token from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    // Lösche alle anderen Tokens dieser E-Mail (One-Time-Use für alle parallelen Anfragen)
    await prisma.magicLinkToken.deleteMany({
      where: {
        email: magicLink.email,
        id: { not: magicLink.id }
      }
    });

    // Audit Log
    console.log(`Successful magic link verification for user ${user.id} (${user.email}) from IP ${ip}`);

    // Erstelle Session-Daten für NextAuth Callback
    const sessionData = {
      email: user.email,
      name: user.name,
      timestamp: Date.now()
    };

    // Encode session data
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Redirect zur Success-Seite mit Session-Daten
    const successUrl = new URL('/auth/magic-link/success', request.url);
    successUrl.searchParams.set('session', encodedSession);

    console.log('✅ Magic link verified, redirecting to success page:', {
      userId: user.id,
      role: user.role,
      redirectTo: successUrl.pathname
    });

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Magic Link Verify Error:', error);
    
    // Security: Keine detaillierten Fehler an Client
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
