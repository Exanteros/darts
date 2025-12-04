import WebSocket from 'ws';

// Globale WebSocket-Client-Instanz für Server-Side Broadcasting
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return; // Bereits verbunden
  }

  try {
    ws = new WebSocket('ws://localhost:3001');

    ws.on('open', () => {
      console.log('✅ Server WebSocket connected to broadcast server');
    });

    ws.on('close', () => {
      console.log('❌ Server WebSocket disconnected');
      ws = null;
      
      // Auto-reconnect
      reconnectTimeout = setTimeout(() => {
        console.log('🔄 Reconnecting Server WebSocket...');
        connectWebSocket();
      }, 3000);
    });

    ws.on('error', (error) => {
      console.error('❌ Server WebSocket error:', error);
    });
  } catch (error) {
    console.error('❌ Error creating Server WebSocket:', error);
  }
}

// Initial connection removed to prevent connection during build
// connectWebSocket();

export function broadcastGameUpdate(gameData: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'game-update',
      data: gameData,
      timestamp: new Date().toISOString()
    }));
    console.log('📤 Broadcasted game-update from server');
  } else {
    // Versuche zu reconnecten
    connectWebSocket();
  }
}

export function broadcastThrowUpdate(throwData: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'throw-update',
      data: throwData,
      timestamp: new Date().toISOString()
    }));
    console.log('📤 Broadcasted throw-update from server');
  } else {
    connectWebSocket();
  }
}

export function broadcastGameReset(gameId?: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'game-reset',
      gameId: gameId,
      timestamp: new Date().toISOString()
    }));
    console.log(`📤 Broadcasted game-reset from server ${gameId ? `for game ${gameId}` : ''}`);
  } else {
    connectWebSocket();
  }
}
