import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { signLoginToken } from '@/lib/jwt';

// Rate Limiting für Token-Verifikation - Redis-backed

async function checkVerifyRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Use Redis-backed rate limiting: 10 attempts per hour per IP
  const result = await checkRateLimit(`verify:${ip}`, 10, 60 * 60 * 1000);
  return { allowed: result.allowed, retryAfter: result.retryAfter };
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const baseUrl = process.env.NEXTAUTH_URL || request.url;
  
  try {
    // Rate Limiting
    const rateLimit = await checkVerifyRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.redirect(
        new URL('/login?error=too_many_attempts', baseUrl)
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Minimal audit log: avoid logging sensitive token details
    console.log('🔍 Verify Token Request', { hasToken: !!token, ip });

    // Token Validierung
    if (!token || typeof token !== 'string') {
      console.warn(`Invalid token format from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
    }

    // Token Format Check (sollte 128 hex chars sein)
    if (!/^[a-f0-9]{128}$/i.test(token)) {
      console.warn(`Invalid token structure from IP ${ip}, length: ${token.length}`);
      return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
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
      return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
    }

    if (magicLink === 'expired') {
      console.warn(`Expired token attempt from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=expired_token', baseUrl));
    }

    if (magicLink === 'used') {
      console.warn(`Token reuse attempt from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=token_already_used', baseUrl));
    }

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: magicLink.email }
    });

    if (!user) {
      console.error(`User not found for token from IP ${ip}`);
      return NextResponse.redirect(new URL('/login?error=user_not_found', baseUrl));
    }

    // Lösche alle anderen Tokens dieser E-Mail (One-Time-Use für alle parallelen Anfragen)
    await prisma.magicLinkToken.deleteMany({
      where: {
        email: magicLink.email,
        id: { not: magicLink.id }
      }
    });

    // Audit Log: minimal - do not log email or full IP
    console.log('Successful magic link verification for user', { userId: user.id });

    // Erstelle signiertes Login-Token für NextAuth Callback
    const loginToken = await signLoginToken({ 
      email: user.email, 
      userId: user.id 
    });

    // Redirect zur Success-Seite mit Token
    const successUrl = new URL('/auth/magic-link/success', baseUrl);
    successUrl.searchParams.set('token', loginToken);

    // Brief success log - do not include tokens or full links
    console.log('✅ Magic link verified for user', { 
      userId: user.id, 
      role: user.role,
      redirectTo: successUrl.toString()
    });

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Magic Link Verify Error:', error);
    
    // Security: Keine detaillierten Fehler an Client
    return NextResponse.redirect(new URL('/login?error=server_error', baseUrl));
  }
}
