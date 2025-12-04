import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail, renderHtml } from '@/lib/mail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    let isNewUser = false;

    if (!user) {
      // Benutzer existiert nicht -> Erstellen mit Dummy-Passwort (wird nicht verwendet wegen Magic Link)
      isNewUser = true;
      const dummyPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

      user = await prisma.user.create({
        data: {
          email: userEmail,
          password: dummyPassword, // Wird nicht verwendet - nur für DB-Anforderung
          role: 'USER', // Standardrolle, Access Grant regelt Turnier-Rechte
          name: userEmail.split('@')[0], // Fallback Name
        }
      });
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

    // Magic Link senden, wenn neuer Benutzer
    if (isNewUser) {
        const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
        const tournamentName = tournament?.name || 'Darts Turnier';
        
        // Generiere Magic Link Token
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden für neue Benutzer
        
        await prisma.magicLinkToken.create({
          data: {
            token,
            email: userEmail,
            expiresAt,
            used: false
          }
        });
        
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${token}`;
        
        const emailSubject = `Einladung zu ${tournamentName}`;
        const emailText = `Hallo,\n\nDu wurdest zum Turnier "${tournamentName}" eingeladen.\n\nKlicke auf den folgenden Link, um dich anzumelden:\n${magicLinkUrl}\n\nDeine Rolle: ${role}\n\nDieser Link ist 24 Stunden gültig und kann nur einmal verwendet werden.\n\nViele Grüße,\nDas Darts Team`;
        
        const htmlContent = await renderHtml(`
# Einladung zum Turnier

Hallo,

Du wurdest zum Turnier **${tournamentName}** eingeladen.

## Deine Zugangsdaten
* **Email:** ${userEmail}
* **Rolle:** ${role}

Klicke auf den folgenden Link, um dich anzumelden:

[Jetzt anmelden](${magicLinkUrl})

**Wichtig:**
* Dieser Link ist 24 Stunden gültig
* Der Link kann nur einmal verwendet werden
* Du benötigst kein Passwort - die Anmeldung erfolgt automatisch über diesen Link

Viel Erfolg beim Turnier!
        `, tournamentName);

        await sendMail({
            to: userEmail,
            subject: emailSubject,
            text: emailText,
            html: htmlContent
        });
    }

    return NextResponse.json({ accessGrant, isNewUser });

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
