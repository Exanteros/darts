import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Hole Profildaten
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Benutzer nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        memberSince: user.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden des Profils'
    }, { status: 500 });
  }
}

// PUT - Update Profildaten
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    // Validierung
    if (!name || name.trim().length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Name muss mindestens 2 Zeichen lang sein'
      }, { status: 400 });
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({
        success: false,
        message: 'Ungültige E-Mail-Adresse'
      }, { status: 400 });
    }

    // Prüfe ob Email bereits verwendet wird (außer vom aktuellen User)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          NOT: {
            id: session.user.id
          }
        }
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Diese E-Mail-Adresse wird bereits verwendet'
        }, { status: 400 });
      }
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        ...(email && { email: email.trim() })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil erfolgreich aktualisiert',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        memberSince: updatedUser.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Aktualisieren des Profils'
    }, { status: 500 });
  }
}
