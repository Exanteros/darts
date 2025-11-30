import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Server-Sent Events endpoint for real-time tournament updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  if (!tournamentId) {
    return new Response('Tournament ID required', { status: 400 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('data: {"type": "connected"}\n\n'));

      // Set up polling for tournament updates
      let lastStatus = '';
      let lastPlayerCount = 0;
      let lastCompletedCount = 0;
      let lastShootoutState = '';

      const checkForUpdates = async () => {
        try {
          // Get current tournament status
          const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
              players: true,
              shootoutResults: true,
              shootoutState: true
            }
          });

          if (!tournament) {
            controller.enqueue(encoder.encode('data: {"type": "error", "message": "Tournament not found"}\n\n'));
            return;
          }

          // Check for status changes
          const currentStatus = tournament.status;
          const activePlayers = tournament.players.filter(p => p.status === 'ACTIVE');
          const completedPlayers = tournament.shootoutResults.length;
          const currentShootoutState = tournament.shootoutState?.status || '';

          if (currentStatus !== lastStatus ||
              activePlayers.length !== lastPlayerCount ||
              completedPlayers !== lastCompletedCount ||
              currentShootoutState !== lastShootoutState) {

            const updateData = {
              type: 'tournament_update',
              tournament: {
                id: tournament.id,
                name: tournament.name,
                status: tournament.status,
                shootoutBoardId: tournament.shootoutBoardId
              },
              players: tournament.players.map(p => ({
                id: p.id,
                userId: p.userId,
                playerName: p.playerName,
                status: p.status,
                seed: p.seed
              })),
              shootoutResults: tournament.shootoutResults.map(r => ({
                playerId: r.playerId,
                score: r.score,
                throws: [r.dart1, r.dart2, r.dart3].filter(d => d > 0)
              })),
              stats: {
                totalPlayers: activePlayers.length,
                completedShootouts: completedPlayers,
                pendingShootouts: activePlayers.length - completedPlayers
              }
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(updateData)}\n\n`));

            lastStatus = currentStatus;
            lastPlayerCount = activePlayers.length;
            lastCompletedCount = completedPlayers;
            lastShootoutState = currentShootoutState;
          }

        } catch (error) {
          console.error('SSE Error:', error);
          controller.enqueue(encoder.encode('data: {"type": "error", "message": "Internal server error"}\n\n'));
        }
      };

      // Check for updates every 2 seconds
      const interval = setInterval(checkForUpdates, 2000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });

    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
