import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Prüfe globale Admin-Rolle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'ADMIN') {
      return NextResponse.json({
        hasAccess: true,
        isGlobalAdmin: true,
        tournamentAccess: []
      });
    }

    // Prüfe Turnier-Zugriff
    const tournamentAccess = await prisma.tournamentAccess.findMany({
      where: { userId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    const hasTournamentAccess = tournamentAccess.length > 0;

    return NextResponse.json({
      hasAccess: hasTournamentAccess,
      isGlobalAdmin: false,
      tournamentAccess: tournamentAccess.map(access => ({
        tournamentId: access.tournamentId,
        tournamentName: access.tournament.name,
        role: access.role,
        permissions: access.permissions
      }))
    });

  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Fehler beim Prüfen der Berechtigungen' },
      { status: 500 }
    );
  }
}