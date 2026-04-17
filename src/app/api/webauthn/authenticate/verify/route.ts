import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { signLoginToken } from '@/lib/jwt';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpID = process.env.NODE_ENV === 'production' ? 'pudo-dartmasters.de' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? 'https://pudo-dartmasters.de' : 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, challenge } = body;
    let userId = body.userId;

    if (!credential) {
      return NextResponse.json({
        success: false,
        message: 'Anmeldedaten unvollständig'
      }, { status: 400 });
    }

    // Get the user's credential from database
    const whereClause = userId ? { userId: userId, credentialId: credential.id } : { credentialId: credential.id };
    const userCredential = await prisma.webAuthnCredential.findFirst({
      where: whereClause
    });
    if (userCredential && !userId) {
      userId = userCredential.userId;
    }

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

    const token = await signLoginToken({ email: user.email, userId: user.id });
    
    return NextResponse.json({
      success: true,
      message: 'Touch ID-Anmeldung erfolgreich',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
