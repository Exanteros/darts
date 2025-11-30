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
        const data: TournamentUpdate = JSON.parse(event.data);
        setLastUpdate(data);

        if (data.type === 'error') {
          setError(data.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
        setError('Failed to parse server data');
      }
    };

    eventSource.onerror = (event) => {
      setIsConnected(false);
      setError('Connection lost');
      console.error('SSE connection error:', event);
    };

    // Cleanup on unmount or tournamentId change
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [tournamentId]);

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
