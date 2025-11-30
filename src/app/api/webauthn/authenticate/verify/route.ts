import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { credential, userId, challenge } = await request.json();

    if (!credential || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Anmeldedaten unvollständig'
      }, { status: 400 });
    }

    // Get the user's credential from database
    const userCredential = await prisma.webAuthnCredential.findFirst({
      where: {
        userId: userId,
        credentialId: credential.id
      }
    });

    if (!userCredential) {
      return NextResponse.json({
        success: false,
        message: 'Anmeldedaten nicht gefunden'
      }, { status: 404 });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: userCredential.credentialId,
        publicKey: Buffer.from(userCredential.publicKey, 'base64url'),
        counter: userCredential.counter,
        transports: userCredential.transports ? JSON.parse(userCredential.transports) : [],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({
        success: false,
        message: 'Touch ID-Anmeldung fehlgeschlagen'
      }, { status: 400 });
    }

    // Update the credential counter
    await prisma.webAuthnCredential.update({
      where: { id: userCredential.id },
      data: { counter: verification.authenticationInfo.newCounter }
    });

    // Get user info for session
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Touch ID-Anmeldung erfolgreich',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error('WebAuthn authentication verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler bei der Anmeldungsverifizierung'
    }, { status: 500 });
  }
}
