import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';
const origin = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht autorisiert'
      }, { status: 401 });
    }

    const { credential, challenge } = await request.json();

    console.log('Received challenge:', challenge);
    console.log('Credential:', JSON.stringify(credential, null, 2));

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      return NextResponse.json({
        success: false,
        message: 'Registrierung fehlgeschlagen'
      }, { status: 400 });
    }

    const { registrationInfo } = verification;

    if (!registrationInfo) {
      return NextResponse.json({
        success: false,
        message: 'Registrierung fehlgeschlagen'
      }, { status: 400 });
    }

    console.log('Registration info keys:', Object.keys(registrationInfo));
    console.log('Registration info credential keys:', Object.keys(registrationInfo.credential));
    console.log('Full registration info:', JSON.stringify(registrationInfo, null, 2));

    // Save the credential to the database
    await prisma.webAuthnCredential.create({
      data: {
        userId: session.user.id,
        credentialId: Buffer.from(registrationInfo.credential.id).toString('base64url'),
        publicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64url'),
        counter: registrationInfo.credential.counter || 0,
        transports: JSON.stringify(credential.response.transports || []),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Touch ID erfolgreich registriert'
    });
  } catch (error) {
    console.error('WebAuthn registration verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler bei der Registrierungsverifizierung'
    }, { status: 500 });
  }
}
