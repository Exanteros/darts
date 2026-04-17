import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { WebAuthnCredential } from '@prisma/client';

const rpID = process.env.NODE_ENV === 'production' ? 'pudo-dartmasters.de' : 'localhost';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;

    let options;
    let userId = null;

    if (email) {

      const user = await prisma.user.findUnique({
      where: { email },
      include: { webAuthnCredentials: true }
    });

      if (!user || user.webAuthnCredentials.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Keine Touch ID-Anmeldedaten gefunden'
        }, { status: 404 });
      }
      userId = user.id;
      options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: user.webAuthnCredentials.map((cred: WebAuthnCredential) => ({
          id: cred.credentialId,
          type: 'public-key',
        })),
        userVerification: 'preferred',
      });
    } else {
      // Conditional UI without email
      options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'preferred',
      });
    }

    return NextResponse.json({ success: true, options, userId });
  } catch (error) {
    console.error('WebAuthn authentication options error:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Generieren der Anmeldeoptionen'
    }, { status: 500 });
  }
}
