import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
      }
    }

    // Hole die Bracket-Konfiguration aus der Datenbank
    const config = await prisma.bracketConfig.findFirst();
    
    if (!config) {
      // Standardwerte zurückgeben
      return NextResponse.json({
        bracketFormat: 'single',
        seedingAlgorithm: 'standard',
        autoAssignBoards: true,
        mainBoardPriority: true,
        distributeEvenly: true,
        mainBoardPriorityLevel: 'finals',
        legsPerRound: {
          round1: 1,
          round2: 1,
          round3: 3,
          round4: 3,
          round5: 5,
          round6: 7
        }
      });
    }

    // Parse legsPerRound JSON
    const legsPerRound = typeof config.legsPerRound === 'string' 
      ? JSON.parse(config.legsPerRound) 
      : config.legsPerRound;

    return NextResponse.json({
      ...config,
      legsPerRound
    });
  } catch (error) {
    console.error('Error fetching bracket config:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
      }
    }

    const data = await request.json();

    // Speichere oder aktualisiere die Bracket-Konfiguration
    const legsPerRoundJson = JSON.stringify(data.legsPerRound);
    
    const config = await prisma.bracketConfig.upsert({
      where: { id: 1 }, // Wir verwenden nur eine Config mit ID 1
      update: {
        bracketFormat: data.bracketFormat,
        seedingAlgorithm: data.seedingAlgorithm,
        autoAssignBoards: data.autoAssignBoards,
        mainBoardPriority: data.mainBoardPriority,
        distributeEvenly: data.distributeEvenly,
        mainBoardPriorityLevel: data.mainBoardPriorityLevel,
        legsPerRound: legsPerRoundJson
      },
      create: {
        id: 1,
        bracketFormat: data.bracketFormat,
        seedingAlgorithm: data.seedingAlgorithm,
        autoAssignBoards: data.autoAssignBoards,
        mainBoardPriority: data.mainBoardPriority,
        distributeEvenly: data.distributeEvenly,
        mainBoardPriorityLevel: data.mainBoardPriorityLevel,
        legsPerRound: legsPerRoundJson
      }
    });

    return NextResponse.json({
      ...config,
      legsPerRound: data.legsPerRound
    });
  } catch (error) {
    console.error('Error saving bracket config:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
