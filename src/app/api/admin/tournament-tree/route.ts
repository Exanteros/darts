import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.tournamentTreeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      // Erstelle Standardeinstellungen falls nicht vorhanden
      const defaultSettings = await prisma.tournamentTreeSettings.create({
        data: {},
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching tournament tree settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const settings = await prisma.tournamentTreeSettings.upsert({
      where: { id: 'default' },
      update: {
        seedingAlgorithm: data.seedingAlgorithm,
        minBreakTime: data.minBreakTime,
        mainBoardPriority: data.mainBoardPriority,
        autoAssignment: data.autoAssignment,
        updatedAt: new Date(),
      },
      create: {
        id: 'default',
        seedingAlgorithm: data.seedingAlgorithm,
        minBreakTime: data.minBreakTime,
        mainBoardPriority: data.mainBoardPriority,
        autoAssignment: data.autoAssignment,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating tournament tree settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
