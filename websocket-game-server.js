const WebSocket = require('ws');
const http = require('http');

// Erstelle HTTP Server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Speichere alle verbundenen Clients mit ihren Board-Subscriptions
const clients = new Map(); // ws -> { boardIds: Set<string> }

wss.on('connection', (ws, req) => {
  console.log('✅ Client connected:', req.socket.remoteAddress);
  clients.set(ws, { boardIds: new Set() });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type, data.boardId ? `(Board: ${data.boardId})` : '');

      // Handle subscription
      if (data.type === 'subscribe' && data.boardId) {
        const clientData = clients.get(ws);
        if (clientData) {
          clientData.boardIds.add(data.boardId);
          console.log(`📍 Client subscribed to board: ${data.boardId}`);
        }
      }

      // Broadcast game updates to subscribed clients only
      if (data.type === 'game-update' || data.type === 'throw-update' || data.type === 'game-reset') {
        broadcast(data, ws);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clients.delete(ws);
  });

  // Sende Bestätigung
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket verbunden' }));
});

// Broadcast-Funktion - sendet nur an Clients, die das Board abonniert haben
function broadcast(data, sender) {
  const message = JSON.stringify(data);
  const targetBoardId = data.boardId;
  let sentCount = 0;

  clients.forEach((clientData, client) => {
    // Skip sender
    if (client === sender) return;
    
    // Check if client is ready
    if (client.readyState === WebSocket.OPEN) {
      // If message has boardId, only send to subscribed clients
      if (targetBoardId) {
        if (clientData.boardIds.has(targetBoardId)) {
          client.send(message);
          sentCount++;
        }
      } else {
        // No boardId, send to all (fallback)
        client.send(message);
        sentCount++;
      }
    }
  });
  
  console.log(`📢 Broadcasted ${data.type} to ${sentCount} client(s)${targetBoardId ? ` (Board: ${targetBoardId})` : ''}`);
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
});
