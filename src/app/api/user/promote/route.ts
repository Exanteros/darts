import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { secret } = await request.json();

    // WARNING: This is a simplified "superuser" secret.
    // In a real production app, use strict environment variables.
    const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'puschendorf-darts-master-2025';

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Falscher Admin-Code' },
        { status: 403 }
      );
    }

    // Update user to ADMIN
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: 'ADMIN' }
    });

    return NextResponse.json({ 
        success: true,
        message: 'Sie sind nun Administrator!' 
    });

  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json(
      { error: 'Fehler beim Update des Nutzers' },
      { status: 500 }
    );
  }
}
