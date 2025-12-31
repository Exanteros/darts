import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const settings = await prisma.broadcastingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      // Erstelle Standardeinstellungen falls nicht vorhanden
      const defaultSettings = await prisma.broadcastingSettings.create({
        data: {},
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching broadcasting settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const data = await request.json();

    const settings = await prisma.broadcastingSettings.upsert({
      where: { id: 'default' },
      update: {
        obsUrl: data.obsUrl,
        obsPassword: data.obsPassword,
        displayRefresh: data.displayRefresh,
        transitionDuration: data.transitionDuration,
        overlayWidth: data.overlayWidth,
        overlayHeight: data.overlayHeight,
        fontSize: data.fontSize,
        updatedAt: new Date(),
      },
      create: {
        id: 'default',
        obsUrl: data.obsUrl,
        obsPassword: data.obsPassword,
        displayRefresh: data.displayRefresh,
        transitionDuration: data.transitionDuration,
        overlayWidth: data.overlayWidth,
        overlayHeight: data.overlayHeight,
        fontSize: data.fontSize,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating broadcasting settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
