import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    // Hole Turnier-Informationen und Spieler-Daten
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          where: {
            userId: session.user.id
          },
          include: {
            gamesAsPlayer1: {
              include: {
                player2: true,
                winner: true
              },
              orderBy: {
                finishedAt: 'desc'
              }
            },
            gamesAsPlayer2: {
              include: {
                player1: true,
                winner: true
              },
              orderBy: {
                finishedAt: 'desc'
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    if (tournament.players.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nicht für dieses Turnier angemeldet'
      }, { status: 403 });
    }

    const playerData = tournament.players[0];

    // Kombiniere alle Spiele
    const allGames = [
      ...playerData.gamesAsPlayer1,
      ...playerData.gamesAsPlayer2
    ].sort((a, b) => {
      const timeA = a.finishedAt?.getTime() || 0;
      const timeB = b.finishedAt?.getTime() || 0;
      return timeB - timeA;
    });

    // Zähle Teilnehmer
    const totalPlayers = await prisma.tournamentPlayer.count({
      where: { tournamentId }
    });

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate?.toISOString(),
        entryFee: tournament.entryFee,
        maxPlayers: tournament.maxPlayers,
        currentPlayers: totalPlayers
      },
      player: {
        id: playerData.id,
        playerName: playerData.playerName,
        status: playerData.status,
        paid: playerData.paid,
        paymentStatus: playerData.paymentStatus,
        seed: playerData.seed,
        currentRank: playerData.currentRank,
        prizeMoney: playerData.prizeMoney,
        // Statistiken
        average: playerData.average,
        firstNineAvg: playerData.firstNineAvg,
        highFinish: playerData.highFinish,
        oneEighties: playerData.oneEighties,
        checkoutRate: playerData.checkoutRate,
        doubleRate: playerData.doubleRate,
        bestLeg: playerData.bestLeg,
        totalPoints: playerData.totalPoints,
        legsPlayed: playerData.legsPlayed,
        legsWon: playerData.legsWon,
        matchesPlayed: playerData.matchesPlayed,
        matchesWon: playerData.matchesWon
      },
      games: allGames.map(game => {
        const isPlayer1 = game.player1Id === playerData.id;
        const opponent = 'player2' in game ? game.player2 : game.player1;
        
        return {
          id: game.id,
          status: game.status,
          round: game.round,
          scheduledAt: game.scheduledAt?.toISOString(),
          startedAt: game.startedAt?.toISOString(),
          finishedAt: game.finishedAt?.toISOString(),
          opponent: opponent ? { id: opponent.id, name: opponent.playerName } : null,
          isWinner: game.winnerId === playerData.id,
          result: {
            playerLegs: isPlayer1 ? game.player1Legs : game.player2Legs,
            opponentLegs: isPlayer1 ? game.player2Legs : game.player1Legs
          }
        };
      })
    });

  } catch (error) {
    console.error('Error fetching tournament player data:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der Turnier-Daten'
    }, { status: 500 });
  }
}
