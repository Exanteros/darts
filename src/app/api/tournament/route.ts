import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, maxPlayers, startDate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : 64,
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'UPCOMING',
      },
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
