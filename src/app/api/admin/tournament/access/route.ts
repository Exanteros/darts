import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Liste aller Benutzer mit Access für ein Turnier
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID erforderlich' },
        { status: 400 }
      );
    }

    const accessGrants = await prisma.tournamentAccess.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { grantedAt: 'desc' }
    });

    return NextResponse.json({ accessGrants });

  } catch (error) {
    console.error('Error fetching tournament access:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zugriffsberechtigungen' },
      { status: 500 }
    );
  }
}

// POST - Neuen Access Grant erstellen
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tournamentId, userEmail, role, expiresAt, permissions } = body;

    if (!tournamentId || !userEmail || !role) {
      return NextResponse.json(
        { error: 'Tournament ID, User Email und Role erforderlich' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if access already exists
    const existingAccess = await prisma.tournamentAccess.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id
        }
      }
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Benutzer hat bereits Zugriff auf dieses Turnier' },
        { status: 400 }
      );
    }

    // Create new access grant
    const accessGrant = await prisma.tournamentAccess.create({
      data: {
        tournamentId,
        userId: user.id,
        role,
        grantedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        permissions: permissions || "{}"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ accessGrant });

  } catch (error) {
    console.error('Error creating tournament access:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Zugriffsberechtigung' },
      { status: 500 }
    );
  }
}

// DELETE - Access Grant entfernen
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get('id');

    if (!accessId) {
      return NextResponse.json(
        { error: 'Access ID erforderlich' },
        { status: 400 }
      );
    }

    await prisma.tournamentAccess.delete({
      where: { id: accessId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting tournament access:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Zugriffsberechtigung' },
      { status: 500 }
    );
  }
}

// PATCH - Access Grant aktualisieren
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accessId, role, expiresAt, permissions } = body;

    if (!accessId) {
      return NextResponse.json(
        { error: 'Access ID erforderlich' },
        { status: 400 }
      );
    }

    const accessGrant = await prisma.tournamentAccess.update({
      where: { id: accessId },
      data: {
        role: role || undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        permissions: permissions || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ accessGrant });

  } catch (error) {
    console.error('Error updating tournament access:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Zugriffsberechtigung' },
      { status: 500 }
    );
  }
}
