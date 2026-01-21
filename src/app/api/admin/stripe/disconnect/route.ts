import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getSession();
   if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      await prisma.systemSettings.update({
          where: { id: 'default' },
          data: {
              stripeAccountId: null,
              stripeConnected: false,
              stripeEnabled: false
          }
      });
      
      return NextResponse.json({ success: true });
  } catch(e) {
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
