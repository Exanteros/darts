const WebSocket = require('ws');
const http = require('http');

// Erstelle HTTP Server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Speichere alle verbundenen Clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log('✅ Client connected:', req.socket.remoteAddress);
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type);

      // Broadcast an alle anderen Clients
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

// Broadcast-Funktion
function broadcast(data, sender) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log(`📢 Broadcasted ${data.type} to ${clients.size - 1} clients`);
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
});
