import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Session-Prüfung
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    const boards = await prisma.board.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        // accessCode nur für Admins sichtbar
        ...(isAdmin && { accessCode: true }),
      },
      orderBy: { priority: 'asc' }
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
