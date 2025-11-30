import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const { id: tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID ist erforderlich'
      }, { status: 400 });
    }

    // Hole alle Scheiben für dieses Turnier
    const boards = await prisma.board.findMany({
      where: { tournamentId },
      orderBy: {
        priority: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      boards
    });

  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Scheiben'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const { name, priority = 1 } = await request.json();

    if (!tournamentId || !name) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID und Scheibenname sind erforderlich'
      }, { status: 400 });
    }

    // Überprüfe, ob das Turnier existiert
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    // Erstelle neue Scheibe mit eindeutigem Access Code
    const accessCode = `BOARD-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const board = await prisma.board.create({
      data: {
        name,
        tournamentId,
        priority,
        accessCode,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Scheibe erfolgreich erstellt',
      board
    });

  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Erstellen der Scheibe'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const { boardId, name, isActive, priority } = await request.json();

    if (!tournamentId || !boardId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID und Scheiben-ID sind erforderlich'
      }, { status: 400 });
    }

    // Aktualisiere Scheibe
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Scheibe erfolgreich aktualisiert',
      board: updatedBoard
    });

  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Aktualisieren der Scheibe'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const { boardId } = await request.json();

    if (!tournamentId || !boardId) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID und Scheiben-ID sind erforderlich'
      }, { status: 400 });
    }

    // Lösche Scheibe
    await prisma.board.delete({
      where: { id: boardId }
    });

    return NextResponse.json({
      success: true,
      message: 'Scheibe erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Löschen der Scheibe'
    }, { status: 500 });
  }
}
