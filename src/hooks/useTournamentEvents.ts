import { useEffect, useState, useRef } from 'react';

interface TournamentUpdate {
  type: 'tournament_update' | 'connected' | 'error';
  tournament?: {
    id: string;
    name: string;
    status: string;
    shootoutBoardId: string | null;
  };
  players?: Array<{
    id: string;
    userId: string;
    playerName: string;
    status: string;
    seed: number | null;
  }>;
  shootoutResults?: Array<{
    playerId: string;
    score: number;
    throws: number[];
  }>;
  stats?: {
    totalPlayers: number;
    completedShootouts: number;
    pendingShootouts: number;
  };
  message?: string;
}

export function useTournamentEvents(tournamentId: string | null) {
  const [lastUpdate, setLastUpdate] = useState<TournamentUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!tournamentId) {
      setIsConnected(false);
      setError(null);
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/dashboard/tournament/events?tournamentId=${tournamentId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        // Ignore heartbeat messages
        if (event.data === ': heartbeat') {
          return;
        }

        const data: TournamentUpdate = JSON.parse(event.data);
        setLastUpdate(data);

        if (data.type === 'error') {
          setError(data.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
        // Don't set error for parse failures on heartbeats or empty lines
      }
    };

    eventSource.onerror = (event) => {
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
      console.error('SSE connection error:', event);
      eventSource.close();
      
      // Retry after 3 seconds
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000);
    };

    // Cleanup on unmount or tournamentId change
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [tournamentId, retryCount]);

  return {
    lastUpdate,
    isConnected,
    error,
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        // The useEffect will automatically reconnect due to the dependency change
        setIsConnected(false);
      }
    }
  };
}
