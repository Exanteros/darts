import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WebSocket from 'ws';

export async function POST(request: Request) {
  try {
    const { boardId, player1Name, player2Name } = await request.json();

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    // 1. Finde ein aktives Turnier (oder das neueste)
    const tournament = await prisma.tournament.findFirst({
      where: { status: { in: ['ACTIVE', 'SHOOTOUT', 'UPCOMING'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Kein aktives Turnier gefunden' }, { status: 404 });
    }

    // 2. Finde oder erstelle Dummy User & TournamentPlayers
    // Wir nutzen spezielle Test-User-IDs, damit wir sie wiederfinden/bereinigen können
    const TEST_USER_1_EMAIL = 'testplayer1@example.com';
    const TEST_USER_2_EMAIL = 'testplayer2@example.com';

    let user1 = await prisma.user.findUnique({ where: { email: TEST_USER_1_EMAIL } });
    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          email: TEST_USER_1_EMAIL,
          name: player1Name || 'Test Player 1',
          password: 'dummy-password-hash', // Sollte nicht einloggen können
          role: 'USER',
        }
      });
    }

    let user2 = await prisma.user.findUnique({ where: { email: TEST_USER_2_EMAIL } });
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email: TEST_USER_2_EMAIL,
          name: player2Name || 'Test Player 2',
          password: 'dummy-password-hash',
          role: 'USER',
        }
      });
    }

    // Tournament Players sicherstellen
    let tp1 = await prisma.tournamentPlayer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: user1.id } }
    });
    if (!tp1) {
      tp1 = await prisma.tournamentPlayer.create({
        data: {
          tournamentId: tournament.id,
          userId: user1.id,
          playerName: player1Name || 'Test Player 1',
          status: 'REGISTERED',
        }
      });
    }

    let tp2 = await prisma.tournamentPlayer.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: user2.id } }
    });
    if (!tp2) {
      tp2 = await prisma.tournamentPlayer.create({
        data: {
          tournamentId: tournament.id,
          userId: user2.id,
          playerName: player2Name || 'Test Player 2',
          status: 'REGISTERED',
        }
      });
    }

    // 3. Altes Spiel auf dem Board beenden (falls vorhanden)
    await prisma.game.updateMany({
      where: { boardId: boardId, status: 'ACTIVE' },
      data: { status: 'FINISHED', finishedAt: new Date() }
    });

    // 4. Neues Testspiel erstellen
    const game = await prisma.game.create({
      data: {
        tournamentId: tournament.id,
        boardId: boardId,
        round: 999, // Kennzeichnung als Testspiel
        player1Id: tp1.id,
        player2Id: tp2.id,
        status: 'ACTIVE',
        legsToWin: 2,
        currentLeg: 1,
        startedAt: new Date(),
      }
    });
    
    // Board updaten (nur damit DB konsistent ist, falls UI das polled)
    // Hinweis: currentGame existiert nicht im Board-Schema, es wird dynamisch ermittelt.
    // Daher kein Update am Board nötig.

    // 5. WebSocket benachrichtigen
    try {
      const ws = new WebSocket('ws://localhost:3001');
      ws.on('open', () => {
        const payload = {
          type: 'game-update',
          boardId: boardId,
          game: {
            id: game.id,
            player1: tp1.playerName,
            player1Id: tp1.id,
            player2: tp2.playerName,
            player2Id: tp2.id,
            legsToWin: 2,
            score1: 0,
            score2: 0,
            legs1: 0,
            legs2: 0,
            currentLeg: 1,
            round: 999,
            isTest: true
          }
        };
        ws.send(JSON.stringify(payload));
        ws.close();
      });
      // Fehler ignorieren, falls WS nicht erreichbar (nicht kritisch für DB-Operation)
      ws.on('error', (e) => console.error('WS Error:', e));
    } catch (e) {
      console.error('Failed to notify WS server', e);
    }

    return NextResponse.json({ success: true, gameId: game.id });

  } catch (error) {
    console.error('Error creating test game:', error);
    return NextResponse.json({ error: 'Internal Server Error' + error }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { boardId } = await request.json();

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    // Spiel beenden
    await prisma.game.updateMany({
      where: { boardId: boardId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', finishedAt: new Date() }
    });
    
    // Board bereinigen (implizit durch Game Status Change)
    
    // WebSocket Reset
    try {
      const ws = new WebSocket('ws://localhost:3001');
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'game-reset',
          boardId: boardId
        }));
        ws.close();
      });
      ws.on('error', (e) => console.error('WS Error:', e));
    } catch (e) {
      console.error('Failed to notify WS server', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping test game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
