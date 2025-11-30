import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { blurUserData } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        message: 'Alle Felder sind erforderlich.'
      }, { status: 400 });
    }

    // Überprüfe, ob Benutzer bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Ein Benutzer mit dieser E-Mail existiert bereits.'
      }, { status: 400 });
    }

    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(password, 12);

    // Erstelle neuen Benutzer
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Sende Willkommens-E-Mail
    await sendWelcomeEmail(email, name);

    return NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich!',
      user: blurUserData({ id: user.id, email: user.email, name: user.name })
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return NextResponse.json({
      success: false,
      message: 'Ein Fehler ist aufgetreten.'
    }, { status: 500 });
  }
}
