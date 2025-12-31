import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { blurUserData } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    let hasTournamentAccess = false;

    if (!isAdmin) {
      const access = await (prisma as any).tournamentAccess.findFirst({
        where: { userId: session.user.id }
      });
      hasTournamentAccess = !!access;
    }

    if (!isAdmin && !hasTournamentAccess) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      hasTournamentAccess: hasTournamentAccess,
      user: blurUserData({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      })
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({
      success: false,
      isAdmin: false,
      message: 'Fehler bei der Admin-Prüfung'
    }, { status: 500 });
  }
}
