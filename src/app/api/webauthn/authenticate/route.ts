import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { WebAuthnCredential } from '@prisma/client';

const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'E-Mail ist erforderlich'
      }, { status: 400 });
    }

    // Find user by email
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

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.webAuthnCredentials.map((cred: WebAuthnCredential) => ({
        id: cred.credentialId,
        type: 'public-key',
      })),
      userVerification: 'preferred',
    });

    return NextResponse.json({
      success: true,
      options,
      userId: user.id
    });
  } catch (error) {
    console.error('WebAuthn authentication options error:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Generieren der Anmeldeoptionen'
    }, { status: 500 });
  }
}
