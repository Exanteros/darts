// Globaler WebSocket-Manager für Browser
class GameWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = 'ws://localhost:3001';
  private reconnectInterval: number = 3000;

  connect() {
    if (typeof window === 'undefined') return; // Nur im Browser

    // Dynamische URL basierend auf Hostname (wichtig für Zugriff von anderen Geräten)
    // Nutze WSS wenn HTTPS, sonst WS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.hostname}/websocket`;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ Game WebSocket connected');
      };

      this.ws.onclose = () => {
        console.log('❌ Game WebSocket disconnected');
        this.ws = null;
        
        // Auto-reconnect
        this.reconnectTimeout = setTimeout(() => {
          console.log('🔄 Reconnecting Game WebSocket...');
          this.connect();
        }, this.reconnectInterval);
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ Game WebSocket error:', error);
      };
    } catch (error) {
      console.error('❌ Error creating Game WebSocket:', error);
    }
  }

  sendGameUpdate(gameData: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'game-update',
        data: gameData,
        timestamp: new Date().toISOString()
      }));
      console.log('📤 Sent game-update');
    }
  }

  sendThrowUpdate(throwData: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'throw-update',
        data: throwData,
        timestamp: new Date().toISOString()
      }));
      console.log('📤 Sent throw-update');
    }
  }

  sendGameReset() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'game-reset',
        timestamp: new Date().toISOString()
      }));
      console.log('📤 Sent game-reset');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton-Instanz
export const gameWebSocket = new GameWebSocketManager();

// Auto-connect im Browser
if (typeof window !== 'undefined') {
  gameWebSocket.connect();
}
