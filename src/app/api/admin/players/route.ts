import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlayerStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isGlobalAdmin = session.user.role === 'ADMIN';

    // Prüfe Turnier-Zugriff falls kein globaler Admin
    let tournamentAccess: any[] = [];
    if (!isGlobalAdmin) {
      tournamentAccess = await prisma.tournamentAccess.findMany({
        where: { userId },
        include: {
          tournament: { select: { id: true, name: true } }
        }
      });

      // Prüfe ob der Benutzer irgendeine Turnier-Berechtigung für players.view hat
      const hasPlayerViewAccess = tournamentAccess.some(access => {
        const permissions = JSON.parse(access.permissions || '{}');
        return permissions.players?.view === true;
      });

      if (!hasPlayerViewAccess) {
        return NextResponse.json(
          { error: 'Keine Berechtigung für Spieler-Verwaltung' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Basis-Query für TournamentPlayer
    let whereClause: any = {};

    // Wenn kein globaler Admin, filtere nach Turnieren, auf die der Benutzer Zugriff hat
    if (!isGlobalAdmin && tournamentAccess.length > 0) {
      whereClause.tournamentId = {
        in: tournamentAccess.map(access => access.tournamentId)
      };
    } else if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    if (status) {
      whereClause.status = status as PlayerStatus;
    }

    if (search) {
      whereClause.OR = [
        { playerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Spieler mit Paginierung laden
    const [players, totalCount] = await Promise.all([
      prisma.tournamentPlayer.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true
            }
          },
          _count: {
            select: {
              gamesAsPlayer1: true,
              gamesAsPlayer2: true,
              throws: true
            }
          }
        },
        orderBy: [
          { registeredAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tournamentPlayer.count({ where: whereClause })
    ]);

    // Statistiken berechnen
    const stats = await prisma.tournamentPlayer.groupBy({
      by: ['status'],
      where: tournamentId ? { tournamentId } : {},
      _count: {
        id: true
      }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Wenn nach einem spezifischen Turnier gefiltert wird, maxPlayers holen
    let tournamentDetails = null;
    if (tournamentId) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { maxPlayers: true, name: true }
      });
      if (tournament) {
        tournamentDetails = tournament;
      }
    }

    return NextResponse.json({
      success: true,
      players,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        ...statusStats
      },
      tournament: tournamentDetails
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isGlobalAdmin = session.user.role === 'ADMIN';

    // Prüfe Turnier-Zugriff falls kein globaler Admin
    let tournamentAccess: any[] = [];
    if (!isGlobalAdmin) {
      tournamentAccess = await prisma.tournamentAccess.findMany({
        where: { userId },
        include: {
          tournament: { select: { id: true, name: true } }
        }
      });

      // Prüfe ob der Benutzer irgendeine Turnier-Berechtigung für players.edit hat
      const hasPlayerEditAccess = tournamentAccess.some(access => {
        const permissions = JSON.parse(access.permissions || '{}');
        return permissions.players?.edit === true;
      });

      if (!hasPlayerEditAccess) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Bearbeiten von Spielern' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { playerId, updates } = body;

    if (!playerId || !updates) {
      return NextResponse.json(
        { error: 'PlayerId und Updates erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe ob der Spieler zu einem Turnier gehört, auf das der Benutzer Zugriff hat
    if (!isGlobalAdmin) {
      const player = await prisma.tournamentPlayer.findUnique({
        where: { id: playerId },
        select: { tournamentId: true }
      });

      if (!player || !tournamentAccess.some(access => access.tournamentId === player.tournamentId)) {
        return NextResponse.json(
          { error: 'Keine Berechtigung für dieses Turnier' },
          { status: 403 }
        );
      }
    }

    // Spieler aktualisieren
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, tournamentId } = body;

    const isGlobalAdmin = session.user.role === 'ADMIN';

    // Permission Check
    if (!isGlobalAdmin) {
       // Check if user has create permission for this tournament
       const access = await prisma.tournamentAccess.findUnique({
          where: {
             tournamentId_userId: {
                tournamentId: tournamentId,
                userId: session.user.id
             }
          }
       });
       
       const permissions = JSON.parse(access?.permissions || '{}');
       if (!permissions.players?.create) {
          return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
       }
    }

    // 1. User finden oder erstellen
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
       // Create dummy user
       const randomPassword = Math.random().toString(36).slice(-10);
       const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(randomPassword, 10)); // Dynamic import to avoid top-level overhead if not needed
       
       user = await prisma.user.create({
          data: {
             name,
             email,
             password: hashedPassword,
             role: 'USER'
          }
       });
    }

    // 2. Check if already in tournament
    const existingPlayer = await prisma.tournamentPlayer.findFirst({
       where: {
          tournamentId,
          userId: user.id
       }
    });

    if (existingPlayer) {
       return NextResponse.json({ error: 'Spieler ist bereits in diesem Turnier registriert' }, { status: 400 });
    }

    // 3. Add to tournament
    // Determine status: If tournament full -> WAITING_LIST, else CONFIRMED
    const tournament = await prisma.tournament.findUnique({
       where: { id: tournamentId },
       include: { 
          _count: { select: { players: { where: { status: { in: ['REGISTERED', 'CONFIRMED', 'ACTIVE'] } } } } }
       }
    });

    if (!tournament) return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });

    const activeCount = tournament._count.players;
    let status = 'CONFIRMED';
    
    // If we manually add, we probably want to force CONFIRMED usually, unless explicitly full?
    // But logically, if full, it goes to waiting list unless we override.
    // Let's default to CONFIRMED for manual additions regardless of limit?
    // User says "Neuen Spieler anlegen" in context of "Filling gaps" or manual mgmt.
    // I'll stick to 'CONFIRMED' as default for manual admin add, but let's be safe.
    // Actually, usually admin updates status manually if needed.
    
    const newPlayer = await prisma.tournamentPlayer.create({
       data: {
          tournamentId,
          userId: user.id,
          playerName: name, // Default to user name provided
          status: 'CONFIRMED',
          registeredAt: new Date(),
          paid: false
       }
    });

    return NextResponse.json({ success: true, player: newPlayer });

  } catch (error) {
     console.error('Error creating player:', error);
     return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const promotePlayerId = searchParams.get('promotePlayerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'PlayerId erforderlich' },
        { status: 400 }
      );
    }

    // Transaktion starten: Spieler löschen und ggf. Nachrücker befördern
    await prisma.$transaction(async (tx) => {
      // 1. Spieler löschen
      await tx.tournamentPlayer.delete({
        where: { id: playerId }
      });

      // 2. Nachrücker befördern (falls angegeben)
      if (promotePlayerId) {
        await tx.tournamentPlayer.update({
          where: { id: promotePlayerId },
          data: { 
            status: 'CONFIRMED',
            // Optional: Man könnte hier auch eine Benachrichtigung auslösen
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: promotePlayerId 
        ? 'Spieler entfernt und Nachrücker befördert' 
        : 'Spieler erfolgreich entfernt'
    });

  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
