import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Hole nächsten Spieler für Shootout
export async function GET() {
  try {
    // Finde das neueste Turnier
    const tournament = await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        players: {
          orderBy: { seed: 'asc' }
        }
      }
    });

    if (!tournament || tournament.status !== 'SHOOTOUT') {
      return NextResponse.json({
        nextPlayer: null
      });
    }

    // Finde Spieler, die noch kein Shootout gemacht haben (seed ist null oder 0)
    const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE');
    const playersWithoutShootout = activePlayers.filter(p => p.seed === null || p.seed === 0);

    if (playersWithoutShootout.length > 0) {
      const nextPlayer = playersWithoutShootout[0];
      return NextResponse.json({
        nextPlayer: {
          id: nextPlayer.id,
          playerName: nextPlayer.playerName
        }
      });
    }

    return NextResponse.json({
      nextPlayer: null
    });

  } catch (error) {
    console.error('Error fetching next shootout player:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des nächsten Spielers' },
      { status: 500 }
    );
  }
}
