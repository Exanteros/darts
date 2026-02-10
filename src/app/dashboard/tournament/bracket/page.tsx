// @ts-nocheck
"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { useTournamentEvents } from '@/hooks/useTournamentEvents';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Trophy,
  Target,
  Activity,
  Users,
  Settings,
  RefreshCw,
  Clock,
  Play,
  CheckCircle,
  User,
  Search,
  Filter,
  RotateCcw,
  Maximize,
  ShieldAlert
} from 'lucide-react';

import { useEffect, useState, useMemo } from 'react';
import { CustomBracket } from '@/components/CustomBracket';

interface TournamentPlayer {
  id: string;
  playerName: string;
  seed?: number;
}

interface Game {
  id: string;
  round: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: TournamentPlayer;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  boardId?: string;
  boardName?: string;
}

interface BracketPlayer {
  id: string;
  name: string;
  isWinner?: boolean;
  score?: string;
}

interface BracketMatch {
  id: string;
  roundName: string;
  round: number;
  player1?: BracketPlayer;
  player2?: BracketPlayer;
  winner?: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  boardName?: string;
}

interface Board {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  currentGame?: BracketMatch;
  queueLength: number;
}

interface Tournament {
  id: string;
  name: string;
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  players?: Array<{
    id: string;
    userId: string;
    playerName: string;
    status: string;
    seed?: number;
  }>;
  shootoutStats?: {
    totalPlayers: number;
    completedShootouts: number;
    pendingShootouts: number;
    progressPercentage: number;
  };
}

interface ShootoutResult {
  playerId: string;
  playerName: string;
  score: number;
  throws: number[];
  rank?: number;
}

// Simple Bracket Configuration
interface BracketConfig {
  theme: 'dark';
  showScores: boolean;
  showStatus: boolean;
}

interface SimpleBracketMatch {
  id: string;
  roundName: string;
  round: number;
  player1?: {
    id: string;
    name: string;
    isWinner?: boolean;
    score?: string;
  };
  player2?: {
    id: string;
    name: string;
    isWinner?: boolean;
    score?: string;
  };
  winner?: string; // Winner ID
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  boardName?: string;
}

export default function TournamentBracket() {
  const { isAdmin, hasTournamentAccess, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
  const [games, setGames] = useState<Game[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const tournamentId = tournament?.id || null;
  const { lastUpdate, isConnected, error } = useTournamentEvents(tournamentId);
  
  // WebSocket for game updates
  const { sendMessage } = useWebSocket({
    url: typeof window !== 'undefined' 
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'ws://localhost:3001'
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`)
      : 'ws://localhost:3001',
  });

  const [shootoutResults, setShootoutResults] = useState<ShootoutResult[]>([]);
  const [bracketConfig, setBracketConfig] = useState<BracketConfig>({
    theme: 'dark',
    showScores: true,
    showStatus: true
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [shootoutLoading, setShootoutLoading] = useState(false);
  const [selectedShootoutBoard, setSelectedShootoutBoard] = useState<string>('');
  const [shootoutSearchQuery, setShootoutSearchQuery] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Prüfe Berechtigung für Bracket
  const canViewBracket = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.bracket?.view === true;
  });

  const canEditBracket = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.bracket?.edit === true;
  });

  const canManageShootout = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.shootout?.manage === true;
  });

  const showDebugInfo = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket');
      if (response.ok) {
        const data = await response.json();
        const games = data.games || [];
        const boards = data.boards || [];

        let debugText = `📊 TURNIER DEBUG INFO:\n\n`;
        debugText += `🎮 SPIELE GESAMT: ${games.length}\n\n`;

        // Spiele nach Runden gruppieren
        const gamesByRound: Record<number, Game[]> = {};
        games.forEach((game: Game) => {
          if (!gamesByRound[game.round]) gamesByRound[game.round] = [];
          gamesByRound[game.round].push(game);
        });

        Object.keys(gamesByRound).sort((a, b) => parseInt(a) - parseInt(b)).forEach(roundStr => {
          const round = parseInt(roundStr);
          const roundGames = gamesByRound[round];
          debugText += `🏆 RUNDE ${round}: ${roundGames.length} Spiele\n`;

          roundGames.forEach(game => {
            const status = game.status || 'UNKNOWN';
            const boardName = game.boardName || 'Keine Scheibe';
            const player1 = game.player1?.playerName || 'TBD';
            const player2 = game.player2?.playerName || 'TBD';
            debugText += `  • ${player1} vs ${player2} (${status}) - ${boardName}\n`;
          });
          debugText += '\n';
        });

        debugText += `🎯 SCHEIBEN: ${boards.length}\n`;
        boards.forEach((board: Board) => {
          const activeGames = board.currentGame ? 1 : 0;
          const queueLength = board.queueLength || 0;
          const status = board.isActive ? 'AKTIV' : 'INAKTIV';
          debugText += `  • ${board.name}: ${activeGames} aktiv, ${queueLength} in Warteschlange (${status})\n`;
        });

        setDebugInfo(debugText);
      }
    } catch (error) {
      setDebugInfo(`❌ Fehler beim Laden der Debug-Info: ${error}`);
    }
  };
  const [currentShootoutPlayer, setCurrentShootoutPlayer] = useState<string | null>(null);
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set());
  const [shootoutStatus, setShootoutStatus] = useState<'waiting' | 'active' | 'throwing' | 'waiting_for_admin' | 'waiting_for_admin_selection' | 'ready_for_selection' | 'finished' | 'player_selected' | 'waiting_for_selection' | null>(null);
  const [showShootoutSpinner, setShowShootoutSpinner] = useState(false);
  const [lockedInBoard, setLockedInBoard] = useState<string | null>(null);
  const [activeThrowingPlayer, setActiveThrowingPlayer] = useState<string | null>(null);
  const [showNextPlayerModal, setShowNextPlayerModal] = useState(false);

  // Monitor shootout status continuously - NEW SEQUENTIAL WORKFLOW
  const checkShootoutStatus = async () => {
    try {
      const response = await fetch(`/api/dashboard/tournament/shootout/status?activePlayer=${currentShootoutPlayer || ''}`);
      if (response.ok) {
        const data = await response.json();

        // Update status based on new API
        setShootoutStatus(data.status);

        if (data.status === 'player_selected' && data.currentPlayer) {
          // Admin has selected player - show "Shootout Player X is running"
          setCurrentShootoutPlayer(data.currentPlayer.id);
          setShowShootoutSpinner(true); // Admin panel shows spinner
          setShootoutStatus('player_selected');

        } else if (data.status === 'throwing' && data.currentPlayer) {
          // Player is currently throwing on the board
          setCurrentShootoutPlayer(data.currentPlayer.id);
          setShowShootoutSpinner(true);
          setShootoutStatus('throwing');

        } else if (data.status === 'waiting_for_admin' && data.currentPlayer) {
          // Player has thrown, waiting for admin confirmation for next player
          setCurrentShootoutPlayer(data.currentPlayer.id);
          setShowShootoutSpinner(false); // Admin panel spinner off
          setShootoutStatus('waiting_for_admin');
          setShowNextPlayerModal(true); // Show "Next Player" modal

        } else if (data.status === 'waiting_for_selection') {
          // Ready for new player selection
          setCurrentShootoutPlayer(null);
          setShowShootoutSpinner(false);
          setShootoutStatus('waiting_for_selection');
          setShowNextPlayerModal(false);

        } else if (data.status === 'completed') {
          // ALL players finished - shootout completed
          setCurrentShootoutPlayer(null);
          setShowShootoutSpinner(false);
          setShootoutStatus('finished');
          setShowNextPlayerModal(false);

          // UNLOCK BOARD: Release board again
          setLockedInBoard(null);

          if (!shownPopups.has('shootout-completed')) {
            setShownPopups(prev => new Set([...prev, 'shootout-completed']));
          }
        }
      }
    } catch (error) {
      console.error('Error checking shootout status:', error);
      setShowShootoutSpinner(false);
    }
  };

  // Load tournament data
  const fetchTournamentData = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
        setBoards(data.boards || []);
        setTournament({
          ...data.tournament,
          shootoutStats: data.shootoutStats
        });
        setShootoutResults(data.shootoutResults || []);

        // Check shootout status on each data update
        if (data.tournament?.status === 'SHOOTOUT') {
          checkShootoutStatus();
        }
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time tournament updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'tournament_update') {
      // Simply refresh the tournament data when we get an update
      // This is cleaner than manually updating state and avoids type issues
      fetchTournamentData();
    }
  }, [lastUpdate]);

  // Legacy polling - keep as fallback but reduce frequency
  useEffect(() => {
    if (tournament?.status === 'SHOOTOUT' && canManageShootout) {
      // Poll more frequently when shootout is active
      const pollInterval = currentShootoutPlayer ? 2000 : 5000; // 2s when player active, 5s otherwise

      const interval = setInterval(() => {
        checkShootoutStatus();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [tournament?.status, currentShootoutPlayer, canManageShootout]);

  // Show popup ONLY ONCE for the FIRST player in the shootout
  useEffect(() => {
    if (currentShootoutPlayer && tournament?.status === 'SHOOTOUT' && shootoutStatus === 'waiting') {
      const player = tournament.players?.find(p => p.id === currentShootoutPlayer);
      if (player && !shownPopups.has('first-shootout-player')) {
        // Find all players without shootout results
        const activePlayers = tournament.players?.filter(p => p.status === 'ACTIVE') || [];
        const playersWithoutResults = activePlayers.filter(p => !shootoutResults.some(r => r.playerId === p.id));

        // Show popup only for the first player (the one with the lowest index)
        const firstPlayer = playersWithoutResults[0];
        if (firstPlayer && firstPlayer.id === currentShootoutPlayer) {
          // No browser popup anymore - only console.log for debugging
          console.log(`New shootout player: ${player.playerName} is ready for the shootout!`);

          // Mark that the first popup has already been shown
          setShownPopups(prev => new Set([...prev, 'first-shootout-player']));
        }
      }
    }
  }, [currentShootoutPlayer, tournament?.status, tournament?.players, shownPopups, shootoutStatus, shootoutResults]);

  // Start shootout for single player - NEW SEQUENTIAL WORKFLOW
  const startShootout = async (arg?: string | any) => {
    const overrideUserId = typeof arg === 'string' ? arg : undefined;
    
    const boardToUse = lockedInBoard || selectedShootoutBoard;

    if (!boardToUse) {
      alert('Bitte wählen Sie eine Scheibe aus');
      return;
    }

    // Determine which user to start
    const userIdToStart = overrideUserId || selectedPlayers[0];
    const isSingleSelection = !!overrideUserId || selectedPlayers.length === 1;

    if (!isSingleSelection) {
      alert('Bitte wählen Sie genau einen Spieler aus');
      return;
    }
    
    if (!userIdToStart) {
        alert('Kein Spieler ausgewählt');
        return;
    }

    try {
      setShootoutLoading(true);
      setShowShootoutSpinner(true); // Show spinner immediately

      // Step 1: Set tournament to SHOOTOUT status (if not already done)
      const setupResponse = await fetch('/api/dashboard/tournament/shootout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_single',
          selectedPlayers: [userIdToStart],
          boardId: boardToUse
        })
      });

      if (!setupResponse.ok) {
        throw new Error('Fehler beim Shootout-Setup');
      }

      // Step 2: Select player and set status to "player_selected"
      const player = tournament?.players?.find(p => p.userId === userIdToStart);

      if (!player) {
        throw new Error('Spieler nicht gefunden');
      }

      const selectResponse = await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_player',
          playerId: player.id
        })
      });

      if (!selectResponse.ok) {
        throw new Error('Fehler beim Spieler auswählen');
      }

      // Success - Admin panel shows "Shootout Player X is running"
      // Only clear selection if we used the selection
      if (!overrideUserId) {
          setSelectedPlayers([]);
      }
      
      setCurrentShootoutPlayer(player.id);
      setShootoutStatus('player_selected');

      // BOARD LOCK-IN: Lock board for entire shootout
      if (!lockedInBoard) {
        setLockedInBoard(boardToUse);
        console.log('🔒 Board locked-in:', boardToUse);
      }

      fetchTournamentData();

      console.log(`✅ Player ${player.playerName} was selected for shootout`);

    } catch (error) {
      console.error('Error starting shootout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`Fehler beim Starten des Shootouts: ${errorMessage}`);
      setShowShootoutSpinner(false);
    } finally {
      setShootoutLoading(false);
    }
  };

  // Helper to retry shootout for a specific player from the list
  const startSingleShootout = async (tournamentPlayerId: string) => {
      const player = tournament?.players?.find(p => p.id === tournamentPlayerId);
      if (player) {
          // If a board is already locked, this works fine.
          // If not detailed, startShootout checks for board.
          await startShootout(player.userId);
      } else {
          // If player not found in active list, try to find in full list or handle error
           console.error('Player not found for ID:', tournamentPlayerId);
           alert('Spielerdaten konnten nicht gefunden werden via ID: ' + tournamentPlayerId);
      }
  };

  // Start shootout for selected games
  const startGameShootout = async () => {
    const boardToUse = lockedInBoard || selectedShootoutBoard;

    if (selectedGames.length === 0) return;
    if (!boardToUse) {
      // No alert anymore - only spinner
      return;
    }

    try {
      setShootoutLoading(true);

      // Collect all players from selected games
      const gamePlayers = new Set<string>();
      selectedGames.forEach(gameId => {
        const game = games.find(g => g.id === gameId);
        if (game?.player1?.id) gamePlayers.add(game.player1.id);
        if (game?.player2?.id) gamePlayers.add(game.player2.id);
      });

      // Start shootout only for players from selected games
      const response = await fetch('/api/dashboard/tournament/shootout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          selectedPlayers: Array.from(gamePlayers),
          boardId: boardToUse
        })
      });

      if (response.ok) {
        fetchTournamentData();
        setShowGameSelection(false);
        setSelectedGames([]);
      }
    } catch (error) {
      console.error('Error starting game shootout:', error);
    } finally {
      setShootoutLoading(false);
    }
  };

  // Get current shootout status
  const fetchShootoutStatus = async () => {
    try {
      const response = await fetch(`/api/dashboard/tournament/shootout/status?activePlayer=${currentShootoutPlayer || ''}`);
      const statusData = await response.json();

      if (statusData.status === 'active' && statusData.currentPlayer) {
        setCurrentShootoutPlayer(statusData.currentPlayer.id);
        setShootoutStatus('active');
      } else if (statusData.status === 'completed') {
        setCurrentShootoutPlayer(null);
        setShootoutStatus('finished');
      } else {
        setCurrentShootoutPlayer(null);
        setShootoutStatus(null);
      }
    } catch (error) {
      console.error('Error fetching shootout status:', error);
    }
  };

  const finalizeShootout = async () => {
    try {
      setShootoutLoading(true);
      const response = await fetch('/api/dashboard/tournament/shootout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' })
      });
      if (response.ok) {
        fetchTournamentData();
      }
    } catch (error) {
      console.error('Error finalizing shootout:', error);
    } finally {
      setShootoutLoading(false);
    }
  };

  // Confirm that player is finished and prepare next selection
  const finishCurrentPlayer = async () => {
    try {
      setShootoutLoading(true);

      const response = await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finish_player'
        })
      });

      if (response.ok) {
        // Reset status for next selection
        setCurrentShootoutPlayer(null);
        setShootoutStatus('waiting_for_selection');
        setShowShootoutSpinner(false);
        setShowNextPlayerModal(false);

        // Update tournament data
        fetchTournamentData();

        console.log('✅ Player completed - ready for next selection');
      } else {
        throw new Error('Fehler beim Abschließen des Spielers');
      }
    } catch (error) {
      console.error('Error finishing current player:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`Fehler: ${errorMessage}`);
    } finally {
      setShootoutLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && canViewBracket) {
      fetchTournamentData();
      const interval = setInterval(fetchTournamentData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, canViewBracket]);

  // Drag & Drop Handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle player swaps between matches
    if (draggableId.startsWith('player-') && destination.droppableId.includes('-player')) {
      const playerId = draggableId.replace('player-', '');
      const [sourceMatchId, sourcePlayer] = parseDroppableId(source.droppableId);
      const [targetMatchId, targetPlayer] = parseDroppableId(destination.droppableId);

      if (sourceMatchId && targetMatchId && sourcePlayer && targetPlayer) {
        swapPlayers(sourceMatchId, targetMatchId, sourcePlayer, targetPlayer);
      }
      return;
    }
  };

  const parseDroppableId = (droppableId: string): [string | null, 'player1' | 'player2' | null] => {
    const match = droppableId.match(/^match-(.+)-player(1|2)$/);
    if (match) {
      return [match[1], match[2] === '1' ? 'player1' : 'player2'];
    }
    return [null, null];
  };

  const swapPlayers = async (sourceMatchId: string, targetMatchId: string, sourcePlayer: 'player1' | 'player2', targetPlayer: 'player1' | 'player2') => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap_players',
          sourceMatchId,
          targetMatchId,
          sourcePlayer,
          targetPlayer
        })
      });

      if (response.ok) {
        fetchTournamentData(); // Reload data
      } else {
        console.error('Failed to swap players:', await response.text());
      }
    } catch (error) {
      console.error('Error swapping players:', error);
    }
  };

  const autoSchedule = async () => {
    console.log('🚀 Auto-Schedule gestartet...');
    console.log('📊 Aktuelle Spiele im State:', games.length);
    games.forEach(game => {
      console.log(`  - Spiel ${game.id}: ${game.player1?.playerName || 'TBD'} vs ${game.player2?.playerName || 'TBD'} (Runde ${game.round}, Status: ${game.status}, Scheibe: ${game.boardName || 'Keine'})`);
    });

    try {
      const response = await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_schedule' })
      });

      console.log('📡 API Response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auto-Schedule erfolgreich:', data);

        // Verwende die zurückgegebenen Daten direkt
        if (data.games) {
          console.log('🔄 Aktualisiere Spiele-State mit', data.games.length, 'Spielen');
          setGames(data.games);
        }
        if (data.boards) setBoards(data.boards);
        if (data.tournament) {
          setTournament({
            ...data.tournament,
            shootoutStats: data.shootoutStats
          });
        }
        if (data.shootoutResults) setShootoutResults(data.shootoutResults);

        console.log('📊 Neue Spiele im State:', data.games?.length || 0);
        (data.games as any[])?.forEach((game: any) => {
          console.log(`  - Spiel ${game.id}: ${game.player1?.playerName || 'TBD'} vs ${game.player2?.playerName || 'TBD'} (Runde ${game.round}, Status: ${game.status}, Scheibe: ${game.boardName || 'Keine'})`);
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Auto-Schedule Fehler:', errorData);
      }
    } catch (error) {
      console.error('💥 Error auto-scheduling:', error);
    }
  };

  const resetAssignments = async () => {
    console.log('🔄 Setze alle Zuweisungen zurück...');
    try {
      const response = await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_assignments' })
      });

      console.log('📡 Reset Response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reset erfolgreich:', data);

        // Verwende die zurückgegebenen Daten direkt
        if (data.games) {
          console.log('🔄 Aktualisiere Spiele-State mit', data.games.length, 'Spielen');
          setGames(data.games);
        }
        if (data.boards) setBoards(data.boards);
        if (data.tournament) {
          setTournament({
            ...data.tournament,
            shootoutStats: data.shootoutStats
          });
        }
        if (data.shootoutResults) setShootoutResults(data.shootoutResults);
      } else {
        const errorData = await response.json();
        console.error('❌ Reset Fehler:', errorData);
      }
    } catch (error) {
      console.error('💥 Error resetting:', error);
    }
  };

  const resetAndReschedule = async () => {
    console.log('🔄 Setze zurück und weise neu zu...');
    try {
      // Zuerst zurücksetzen
      await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_assignments' })
      });

      // Dann neu zuweisen
      await autoSchedule();

      // Debug-Info aktualisieren
      setTimeout(() => showDebugInfo(), 500);
    } catch (error) {
      console.error('💥 Error reset and reschedule:', error);
    }
  };

  // Function to reset all rounds
  const resetRounds = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket/reset-rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Fehler beim Zurücksetzen der Runden: ${data.error}`);
        return;
      }

      alert(`Runden wurden erfolgreich zurückgesetzt! ${data.gamesReset} Spiel(e) wurden zurückgesetzt.`);

      // Refresh the data
      const refreshResponse = await fetch('/api/dashboard/tournament/bracket');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setGames(refreshData.games || []);
        setBoards(refreshData.boards || []);
        setTournament(refreshData.tournament);
      }
    } catch (error) {
      console.error('Error resetting rounds:', error);
      alert('Fehler beim Zurücksetzen der Runden. Bitte versuchen Sie es erneut.');
    }
  };

  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Game | null>(null);
  const [newBoardId, setNewBoardId] = useState<string>('');

  const handleAssignBoard = async () => {
    if (!selectedMatch || !newBoardId) return;

    try {
      const response = await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_game',
          gameId: selectedMatch.id,
          boardId: newBoardId
        })
      });

      if (response.ok) {
        // Update local state
        setGames(prev => prev.map(g => 
          g.id === selectedMatch.id 
            ? { ...g, boardId: newBoardId, boardName: boards.find(b => b.id === newBoardId)?.name } 
            : g
        ));
        
        // Update selected match
        setSelectedMatch(prev => prev ? { 
            ...prev, 
            boardId: newBoardId,
            boardName: boards.find(b => b.id === newBoardId)?.name
        } : null);

        // Also refresh from server to be sure
        fetchTournamentData();
        setMatchDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Fehler beim Zuweisen: ${error.error || 'Unbekannt'}`);
      }
    } catch (error) {
      console.error('Error assigning board:', error);
      alert('Fehler beim Zuweisen der Scheibe');
    }
  };

  const handleStartGame = async (matchId: string) => {
    // Find the game by match ID
    const game = games.find(g => g.id === matchId) || selectedMatch; // Fallback to selectedMatch if ID matches
    
    if (!game) {
      alert('Spiel nicht gefunden');
      return;
    }

    // Only start games that are WAITING and have both players
    if (game.status !== 'WAITING') {
      if (game.status === 'ACTIVE') {
        alert('Dieses Spiel läuft bereits!');
      } else if (game.status === 'FINISHED') {
        alert('Dieses Spiel ist bereits beendet.');
      }
      return;
    }

    if (!game.player1 || !game.player2) {
      alert('Beide Spieler müssen verfügbar sein, um das Spiel zu starten.');
      return;
    }

    if (!game.boardId) {
      alert('Dieses Spiel muss zuerst einer Scheibe zugewiesen werden.');
      return;
    }

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: game.id })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Fehler beim Starten des Spiels: ${data.message}`);
        return;
      }

      setMatchDialogOpen(false); // Close dialog if open
      alert(`Spiel gestartet!\n\n${data.game.player1} vs ${data.game.player2}\nScheibe: ${data.game.boardName}\n\nBesuchen Sie /note/scheibe/${data.game.boardAccessCode} um das Spiel zu verfolgen.`);

      // Send WebSocket update to notify boards
      if (game.boardId) {
        sendMessage({
          type: 'game-assigned',
          boardId: game.boardId,
          gameId: game.id
        });
        console.log('📤 Sent game-assigned event for board:', game.boardId);
      }

      // Refresh the data
      fetchTournamentData();
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Fehler beim Starten des Spiels. Bitte versuchen Sie es erneut.');
    }
  };

  // Function to handle match click (opens dialog)
  const handleMatchClick = (matchId: string) => {
    const game = games.find(g => g.id === matchId);
    if (game) {
        setSelectedMatch(game);
        setNewBoardId(game.boardId || '');
        setMatchDialogOpen(true);
    }
  };

  // Organize games by rounds
  const bracket = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {} as Record<number, Game[]>);

  // Convert Games to SimpleBracketMatches for CustomBracket component
  const convertGamesToBracket = (games: Game[]): SimpleBracketMatch[] => {
    if (!games || games.length === 0) {
      return [];
    }

    const sortedGames = [...games].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      // Use ID for consistent sorting of bracket structure
      // This maintains the logical order as created in database
      return a.id.localeCompare(b.id);
    });

    // Group games by rounds
    const gamesByRound = sortedGames.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = [];
      acc[game.round].push(game);
      return acc;
    }, {} as Record<number, Game[]>);

    const matches: SimpleBracketMatch[] = [];

    // Process each round
    Object.keys(gamesByRound).forEach(roundStr => {
      const round = parseInt(roundStr);
      const roundGames = gamesByRound[round];

      // Round names mapping
      const getRoundName = (round: number) => {
        const totalRounds = Object.keys(gamesByRound).length;
        if (round === totalRounds) return 'Finale';
        if (round === totalRounds - 1) return 'Halbfinale';
        if (round === totalRounds - 2) return 'Viertelfinale';
        if (round === totalRounds - 3) return 'Achtelfinale';
        return `Runde ${round}`;
      };

      roundGames.forEach((game) => {
        // Skip games without both players (higher rounds not yet filled)
        // if (!game.player1 || !game.player2) {
        //   return;
        // }

        // Determine status
        let status: 'FINISHED' | 'ACTIVE' | 'WAITING' = 'WAITING';
        if (game.status === 'FINISHED') status = 'FINISHED';
        else if (game.status === 'ACTIVE') status = 'ACTIVE';

        matches.push({
          id: game.id,
          roundName: getRoundName(game.round),
          round: game.round,
          player1: game.player1 ? {
            id: game.player1.id,
            name: game.player1.playerName,
            isWinner: game.winner?.id === game.player1.id,
            score: game.status === 'FINISHED' && game.player1Legs != null ? game.player1Legs.toString() : undefined
          } : undefined,
          player2: game.player2 ? {
            id: game.player2.id,
            name: game.player2.playerName,
            isWinner: game.winner?.id === game.player2.id,
            score: game.status === 'FINISHED' && game.player2Legs != null ? game.player2Legs.toString() : undefined
          } : undefined,
          winner: game.winner?.id,
          status,
          boardName: game.boardName || undefined
        });
      });
    });

    return matches;
  };

  // Demo data generator for testing - 8 player bracket
  const generateDemoMatches = (): SimpleBracketMatch[] => {
    // Verwende echte Boards aus der Datenbank, falls verfügbar
    const availableBoards = boards.filter(b => b.isActive).slice(0, 4); // Max 4 Boards für Demo

    return [
      // Quarter Finals (Round 1)
      {
        id: 'qf-1',
        roundName: 'Viertelfinale',
        round: 1,
        player1: { id: 'player-1', name: 'Michael van Gerwen', isWinner: true },
        player2: { id: 'player-5', name: 'Rob Cross', isWinner: false },
        winner: 'player-1',
        status: 'FINISHED',
        boardName: availableBoards[0]?.name || 'Board 1'
      },
      {
        id: 'qf-2',
        roundName: 'Viertelfinale',
        round: 1,
        player1: { id: 'player-2', name: 'Peter Wright', isWinner: true },
        player2: { id: 'player-6', name: 'Nathan Aspinall', isWinner: false },
        winner: 'player-2',
        status: 'FINISHED',
        boardName: availableBoards[1]?.name || 'Board 2'
      },
      {
        id: 'qf-3',
        roundName: 'Viertelfinale',
        round: 1,
        player1: { id: 'player-3', name: 'Gerwyn Price', isWinner: true },
        player2: { id: 'player-7', name: 'Michael Smith', isWinner: false },
        winner: 'player-3',
        status: 'FINISHED',
        boardName: availableBoards[2]?.name || 'Board 3'
      },
      {
        id: 'qf-4',
        roundName: 'Viertelfinale',
        round: 1,
        player1: { id: 'player-4', name: 'Gary Anderson', isWinner: true },
        player2: { id: 'player-8', name: 'Dave Chisnall', isWinner: false },
        winner: 'player-4',
        status: 'FINISHED',
        boardName: availableBoards[3]?.name || 'Board 4'
      },
      // Semifinals (Round 2)
      {
        id: 'semi-1',
        roundName: 'Halbfinale',
        round: 2,
        player1: { id: 'player-1', name: 'Michael van Gerwen', isWinner: true },
        player2: { id: 'player-2', name: 'Peter Wright', isWinner: false },
        winner: 'player-1',
        status: 'FINISHED',
        boardName: availableBoards[0]?.name || 'Board 1'
      },
      {
        id: 'semi-2',
        roundName: 'Halbfinale',
        round: 2,
        player1: { id: 'player-3', name: 'Gerwyn Price', isWinner: false },
        player2: { id: 'player-4', name: 'Gary Anderson', isWinner: true },
        winner: 'player-4',
        status: 'FINISHED',
        boardName: availableBoards[1]?.name || 'Board 2'
      },
      // Final (Round 3)
      {
        id: 'final',
        roundName: 'Finale',
        round: 3,
        player1: { id: 'player-1', name: 'Michael van Gerwen', isWinner: true },
        player2: { id: 'player-4', name: 'Gary Anderson', isWinner: false },
        winner: 'player-1',
        status: 'FINISHED',
        boardName: availableBoards[0]?.name || 'Board 1'
      },
    ];
  };

  const bracketMatches = useMemo(() => convertGamesToBracket(games), [games]);

  // Calculate round information for round control
  const roundInfo = useMemo(() => {
    if (games.length === 0) return [];

    // Group games by round
    const gamesByRound: Record<number, Game[]> = {};
    games.forEach(game => {
      if (!gamesByRound[game.round]) gamesByRound[game.round] = [];
      gamesByRound[game.round].push(game);
    });

    // Get all round numbers and sort them
    const roundNumbers = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);

    return roundNumbers.map(roundNumber => {
      const roundGames = gamesByRound[roundNumber];
      const totalGames = roundGames.length;
      const finishedGames = roundGames.filter(g => g.status === 'FINISHED').length;
      const activeGames = roundGames.filter(g => g.status === 'ACTIVE').length;
      const waitingGames = roundGames.filter(g => g.status === 'WAITING').length;

      // Determine round status
      let status: 'pending' | 'can_start' | 'active' | 'completed' = 'pending';
      let canStart = false;

      if (finishedGames === totalGames) {
        // All games finished
        status = 'completed';
      } else if (activeGames > 0) {
        // At least one game is actually ACTIVE
        status = 'active';
      } else {
        // No active games - check if round can be started
        const previousRound = roundNumber - 1;
        if (roundNumber === 1) {
          // First round can always be started
          canStart = true;
          status = 'can_start';
        } else {
          // Check if previous round is completed
          const previousRoundGames = gamesByRound[previousRound];
          if (previousRoundGames && previousRoundGames.every(g => g.status === 'FINISHED')) {
            canStart = true;
            status = 'can_start';
          }
        }
      }

      return {
        round: roundNumber,
        totalGames,
        finishedGames,
        activeGames,
        waitingGames,
        status,
        canStart,
        progress: totalGames > 0 ? Math.round((finishedGames / totalGames) * 100) : 0
      };
    });
  }, [games]);

  // Function to start a round
  const startRound = async (roundNumber: number) => {
    try {
      const response = await fetch(`/api/dashboard/tournament/bracket/start-round/${roundNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Fehler beim Starten der Runde: ${data.error}`);
        return;
      }

      // Wait a moment for board assignment to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh the data to get updated board assignments
      const refreshResponse = await fetch('/api/dashboard/tournament/bracket');
      if (!refreshResponse.ok) {
        alert(`Runde ${roundNumber} wurde gestartet, aber Daten konnten nicht aktualisiert werden.`);
        return;
      }

      const refreshData = await refreshResponse.json();
      setGames(refreshData.games || []);
      setBoards(refreshData.boards || []);

      // Find all games of this round that have been assigned to boards
      const roundGames = refreshData.games.filter((g: Game) => 
        g.round === roundNumber && 
        g.status === 'WAITING' && 
        g.boardId
      );

      // Group games by board to get the first game per board
      const gamesByBoard: Record<string, Game> = {};
      roundGames.forEach((game: Game) => {
        if (game.boardId && !gamesByBoard[game.boardId]) {
          gamesByBoard[game.boardId] = game;
        }
      });

      const gamesToStart = Object.values(gamesByBoard);

      if (gamesToStart.length > 0) {
        // Start the first game on each board
        const startPromises = gamesToStart.map(game =>
          fetch('/api/game/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId: game.id })
          })
        );

        const startResults = await Promise.all(startPromises);
        const successfulStarts = await Promise.all(
          startResults.map(async (res, idx) => {
            if (res.ok) {
              const data = await res.json();
              return data.game;
            }
            return null;
          })
        );

        const startedGames = successfulStarts.filter(g => g !== null);

        if (startedGames.length > 0) {
          const gameList = startedGames
            .map(g => `• ${g.player1} vs ${g.player2} auf ${g.boardName}`)
            .join('\n');
          
          alert(`Runde ${roundNumber} wurde gestartet!\n\n${startedGames.length} Spiel(e) wurden automatisch gestartet:\n${gameList}`);
        } else {
          alert(`Runde ${roundNumber} wurde gestartet, aber die Spiele konnten nicht automatisch gestartet werden. ${data.gamesStarted} Spiel(e) wurden aktiviert.`);
        }
      } else {
        alert(`Runde ${roundNumber} wurde gestartet! ${data.gamesStarted} Spiel(e) wurden aktiviert und warten auf Scheibenzuweisung.`);
      }

    } catch (error) {
      console.error('Error starting round:', error);
      alert('Fehler beim Starten der Runde. Bitte versuchen Sie es erneut.');
    }
  };

  // Waiting games without board
  const waitingGames = games.filter(game =>
    game.status === 'WAITING' &&
    !game.boardId &&
    game.player1 &&
    game.player2
  );

  // Shootout component in Players style
  const ShootoutInterface = () => {
    // Filter active players (exclude waiting list and withdrawn)
    const activePlayers = tournament?.players?.filter(p => !['WAITING_LIST', 'WITHDRAWN'].includes(p.status)) || [];

    // Use statistics from API, if available
    const completedShootouts = tournament?.shootoutStats?.completedShootouts || shootoutResults.filter(r => r.score > 0).length;
    const totalPlayers = tournament?.shootoutStats?.totalPlayers || shootoutResults.length;
    const pendingShootouts = tournament?.shootoutStats?.pendingShootouts || (totalPlayers - completedShootouts);
    const progressPercentage = tournament?.shootoutStats?.progressPercentage || (totalPlayers > 0 ? Math.round((completedShootouts / totalPlayers) * 100) : 0);

    const isShootoutComplete = completedShootouts === totalPlayers && totalPlayers > 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="px-4 lg:px-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🎯 Shootout Phase</h1>
              <p className="text-muted-foreground">
                Verwalten Sie das 3-Dart-Shootout für die Setzlisten-Ermittlung
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="h-9">
                {completedShootouts}/{totalPlayers} abgeschlossen
              </Badge>
              {isShootoutComplete && (
                <Button onClick={finalizeShootout} disabled={shootoutLoading} className="w-full sm:w-auto">
                  {shootoutLoading ? 'Erstelle Bracket...' : '🏆 Bracket erstellen'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-4 lg:px-6 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamt Spieler</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPlayers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedShootouts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingShootouts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fortschritt</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressPercentage}%</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Board selection */}
        <div className="px-4 lg:px-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Shootout-Scheibe {lockedInBoard ? 'gesperrt' : 'auswählen'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lockedInBoard
                  ? `Scheibe ist für dieses Shootout gesperrt: ${boards.find(b => b.id === lockedInBoard)?.name}`
                  : 'Wählen Sie die Scheibe aus, auf der das Shootout stattfindet'
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boards
                  .filter(board => board.isActive)
                  .sort((a, b) => a.priority - b.priority)
                  .map(board => (
                    <div
                      key={board.id}
                      onClick={() => !lockedInBoard && setSelectedShootoutBoard(board.id)}
                      className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all aspect-[2/1] cursor-pointer ${lockedInBoard
                          ? board.id === lockedInBoard
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-transparent bg-gray-100 opacity-50 cursor-not-allowed'
                          : selectedShootoutBoard === board.id
                            ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        }`}
                    >
                      <div className={`p-2 rounded-full mb-2 transition-colors ${selectedShootoutBoard === board.id ? 'bg-primary/20' : 'bg-muted'}`}>
                          <Target className={`h-5 w-5 ${selectedShootoutBoard === board.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="font-bold text-center leading-tight mb-1 truncate w-full px-2" title={board.name}>
                        {board.name}
                      </div>

                      {lockedInBoard && board.id === lockedInBoard && (
                          <div className="absolute top-2 right-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                      )}
                      {!lockedInBoard && selectedShootoutBoard === board.id && (
                          <div className="absolute top-2 right-2 text-primary">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                      )}
                    </div>
                  ))}
              </div>
              {selectedShootoutBoard && !lockedInBoard && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    ✓ Ausgewählte Scheibe: {boards.find(b => b.id === selectedShootoutBoard)?.name}
                  </p>
                </div>
              )}
              {lockedInBoard && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    🔒 Gesperrte Scheibe: {boards.find(b => b.id === lockedInBoard)?.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Diese Scheibe wird für das gesamte Shootout verwendet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player selection for sequential shootout */}
        <div className="px-4 lg:px-6 pt-6" data-shootout-selection>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Spieler für Shootout auswählen
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Wählen Sie einen Spieler aus, der als nächstes das Shootout macht
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchTournamentData();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing || loading}
                title="Spielerliste aktualisieren"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="players" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="players">Einzelne Spieler</TabsTrigger>
                  <TabsTrigger value="bulk">Massen-Shootout</TabsTrigger>
                </TabsList>

                <TabsContent value="players" className="space-y-4">
                  {(tournament?.players?.filter(p => p.status === 'ACTIVE').length === 0) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3 text-yellow-800 mb-4">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">Keine aktiven Spieler verfügbar</p>
                        <p className="text-sm mt-1">
                          Um das Shootout zu starten, müssen sich Spieler im Status <Badge variant="outline" className="text-yellow-800 border-yellow-600">Aktiv</Badge> befinden.
                          Bitte ändern Sie den Status der entsprechenden Spieler in der <a href="/dashboard/players" className="underline font-medium hover:text-yellow-900">Spielerverwaltung</a>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Spieler auswählen ({activePlayers.length} verfügbar)</h4>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => setSelectedPlayers(activePlayers.map(p => p.userId))}>
                        Alle auswählen
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPlayers([])}>
                        Alle abwählen
                      </Button>
                    </div>
                  </div>

                  <div className="my-4 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Spieler suchen..."
                      value={shootoutSearchQuery}
                      onChange={(e) => setShootoutSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-1">
                    {activePlayers
                      .filter(p => !shootoutSearchQuery || p.playerName.toLowerCase().includes(shootoutSearchQuery.toLowerCase()))
                      .map(player => (
                        <div
                          key={player.id}
                          onClick={() => {
                            setSelectedPlayers([player.userId]);
                          }}
                          className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all aspect-[2/1] cursor-pointer ${selectedPlayers.includes(player.userId)
                              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                              : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                            }`}
                        >
                          <div className={`p-2 rounded-full mb-2 transition-colors ${selectedPlayers.includes(player.userId) ? 'bg-primary/20' : 'bg-muted'}`}>
                            <User className={`h-5 w-5 ${selectedPlayers.includes(player.userId) ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          
                          <div className="font-bold text-center leading-tight mb-1 truncate w-full px-2" title={player.playerName}>
                            {player.playerName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {player.seed ? `Seed: ${player.seed}` : 'Noch kein Shootout'}
                          </div>

                          {selectedPlayers.includes(player.userId) && (
                            <div className="absolute top-2 right-2 text-primary">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {selectedPlayers.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                          <strong>{selectedPlayers.length}</strong> Spieler ausgewählt für Shootout
                        </span>
                      </div>
                      <Button
                        onClick={startShootout}
                        disabled={shootoutLoading || selectedPlayers.length === 0 || (!selectedShootoutBoard && !lockedInBoard)}
                        size="lg"
                      >
                        {shootoutLoading ? 'Starte Shootout...' : `🎯 Shootout starten`}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold mb-2">Massen-Shootout</h3>
                    <p className="text-muted-foreground mb-4">
                      Traditionelles Shootout für alle Spieler gleichzeitig
                    </p>
                    <Button
                      onClick={() => {
                        const allPlayerIds = activePlayers.map(player => player.userId);
                        setSelectedPlayers(allPlayerIds);
                      }}
                      disabled={!selectedShootoutBoard && !lockedInBoard}
                      size="lg"
                    >
                      Alle Spieler starten
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Progress and results */}
        <div className="px-4 lg:px-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Shootout Fortschritt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fortschritt</span>
                    <span>{completedShootouts}/{totalPlayers}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${totalPlayers > 0 ? (completedShootouts / totalPlayers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {!isShootoutComplete && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Das Shootout läuft noch. Warten Sie, bis alle Spieler ihre 3 Darts geworfen haben.
                    </p>
                    <Button variant="outline" onClick={fetchTournamentData} className="mt-2">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Aktualisieren
                    </Button>
                  </div>
                )}

                {isShootoutComplete && (
                  <div className="text-center py-4">
                    <div className="text-green-600 font-medium">✓ Alle Spieler haben das Shootout abgeschlossen!</div>
                    <p className="text-sm text-muted-foreground">Sie können jetzt den Turnierbaum erstellen.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shootout Results Table */}
        {shootoutResults.length > 0 && (
          <div className="px-4 lg:px-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Shootout Ergebnisse
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Setzliste basierend auf Shootout-Ergebnissen
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted font-medium text-sm md:grid-cols-6">
                    <div>Rang</div>
                    <div>Spieler</div>
                    <div>Score</div>
                    <div className="hidden md:block">Würfe</div>
                    <div className="hidden md:block">Status</div>
                    <div>Aktionen</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {shootoutResults
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((result, index) => (
                        <div key={result.playerId} className="grid grid-cols-3 gap-4 p-4 border-t text-sm hover:bg-muted/50 md:grid-cols-6 items-center">
                          <div className="font-medium">
                            {result.score > 0 ? (
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                {index + 1}
                              </Badge>
                            ) : '-'}
                          </div>
                          <div className="font-medium">{result.playerName}</div>
                          <div className="font-mono font-bold">{result.score || '-'}</div>
                          <div className="hidden text-xs text-muted-foreground md:block">
                            {result.throws ? result.throws.join(' + ') : '-'}
                          </div>
                          <div className="hidden md:block">
                            {currentShootoutPlayer === result.playerId && (shootoutStatus === 'active' || shootoutStatus === 'throwing') ? (
                              <Badge variant="default" className="bg-blue-500">
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                  Wirft gerade
                                </div>
                              </Badge>
                            ) : (
                              <Badge variant={result.score > 0 ? "default" : "secondary"}>
                                {result.score > 0 ? "Abgeschlossen" : "Ausstehend"}
                              </Badge>
                            )}
                          </div>
                          <div>
                            {result.score > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-2 text-xs"
                                    onClick={() => startSingleShootout(result.playerId)}
                                    title="Shootout wiederholen"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Wiederholen
                                </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shootout Status Modal - NEW SEQUENTIAL WORKFLOW */}
        {showShootoutSpinner && currentShootoutPlayer && tournament?.players && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">🎯 Shootout läuft</h3>
                {(() => {
                  const player = tournament.players.find(p => p.id === currentShootoutPlayer);
                  return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {shootoutStatus === 'player_selected' && (
                          <>
                            <p className="text-muted-foreground">
                              <strong>{player?.playerName}</strong> wurde ausgewählt
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Bleibe hier, bis das Shootout auf /note/scheibe/ gestartet wird
                            </p>
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!window.confirm('Möchten Sie wirklich einen anderen Spieler wählen?')) return;
                                try {
                                  const response = await fetch('/api/dashboard/tournament/shootout/update', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'cancel_selection' })
                                  });
                                  if (response.ok) {
                                    setShowShootoutSpinner(false);
                                    setCurrentShootoutPlayer(null);
                                    setShootoutStatus('waiting_for_selection');
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              Spieler wechseln
                            </Button>
                          </>
                        )}
                        {shootoutStatus === 'throwing' && (
                          <>
                            <p className="text-muted-foreground">
                              <strong>{player?.playerName}</strong> wirft gerade seine 3 Darts...
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Bleibe hier, bis die Würfe auf /note/scheibe/ bestätigt wurden
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="flex justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ready for new player selection Modal - NEW WORKFLOW */}
        {showNextPlayerModal && tournament?.status === 'SHOOTOUT' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold mb-2">Spieler abgeschlossen</h3>
                <p className="text-muted-foreground mb-4">
                  {currentShootoutPlayer && tournament?.players && (() => {
                    const player = tournament.players.find(p => p.id === currentShootoutPlayer);
                    return `${player?.playerName} hat seine Würfe abgeschlossen.`;
                  })()}
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    onClick={finishCurrentPlayer} 
                    className="w-full"
                    disabled={shootoutLoading}
                  >
                    {shootoutLoading ? 'Wird geladen...' : 'Nächsten Spieler auswählen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Pre-Tournament State Component
  const PreTournamentState = () => {
    // Load players for selection (filter out waiting list and withdrawn)
    const tournamentPlayers = tournament?.players?.filter(p => !['WAITING_LIST', 'WITHDRAWN'].includes(p.status)) || [];

    const handlePlayerToggle = (userId: string) => {
      setSelectedPlayers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    };

    // Toggle game selection for shootout
    const handleGameToggle = (gameId: string) => {
      setSelectedGames(prev =>
        prev.includes(gameId)
          ? prev.filter(id => id !== gameId)
          : [...prev, gameId]
      );
    };

    const selectAllPlayers = () => {
      setSelectedPlayers(tournamentPlayers.map(p => p.userId));
    };

    const deselectAllPlayers = () => {
      setSelectedPlayers([]);
    };

    return (
      <div className="px-4 lg:px-6 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Turnier Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">Turnier bereit für Shootout</h3>
              <p className="text-muted-foreground mb-6">
                Wählen Sie zuerst eine Scheibe aus und dann die Spieler oder Spiele für das 3-Dart Shootout
              </p>

              {/* Board selection */}
              <div className="mb-6 border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-3 flex items-center gap-2 justify-center">
                  <Target className="h-4 w-4" />
                  Shootout-Scheibe auswählen
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  {boards
                    .filter(board => board.isActive)
                    .sort((a, b) => a.priority - b.priority)
                    .map(board => (
                      <div
                        key={board.id}
                        onClick={() => setSelectedShootoutBoard(board.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedShootoutBoard === board.id
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-gray-200 hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="font-medium">{board.name}</span>
                          {selectedShootoutBoard === board.id && (
                            <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Priorität: {board.priority}
                        </div>
                      </div>
                    ))}
                </div>
                {selectedShootoutBoard && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Ausgewählte Scheibe: {boards.find(b => b.id === selectedShootoutBoard)?.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Status message for active shootout */}
              {(shootoutStatus === 'throwing' || shootoutStatus === 'waiting' || shootoutStatus === 'waiting_for_admin_selection' || shootoutStatus === 'ready_for_selection') && currentShootoutPlayer && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {shootoutStatus === 'throwing' && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    )}
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {shootoutStatus === 'throwing' ? '🎯 Shootout läuft' :
                          shootoutStatus === 'waiting_for_admin_selection' ? '⏳ Warten auf Administrator' :
                            shootoutStatus === 'ready_for_selection' ? '📋 Neuen Spieler auswählen' :
                              '⏳ Nächster Spieler wartet'}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {tournamentPlayers.find(p => p.id === currentShootoutPlayer)?.playerName || 'Spieler'}
                        {shootoutStatus === 'throwing' ? ' wirft gerade seine 3 Darts...' :
                          shootoutStatus === 'waiting_for_admin_selection' ? ' wartet auf Bestätigung durch Administrator' :
                            shootoutStatus === 'ready_for_selection' ? ' hat das Shootout beendet. Wählen Sie den nächsten Spieler aus.' :
                              ' ist bereit für das Shootout'}
                      </p>
                      {shootoutStatus === 'throwing' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Warten Sie, bis der Spieler fertig ist, dann können Sie den nächsten Spieler auswählen.
                        </p>
                      )}
                      {shootoutStatus === 'waiting_for_admin_selection' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Klicken Sie auf den Spieler-Namen, um das Shootout zu starten.
                        </p>
                      )}
                      {shootoutStatus === 'ready_for_selection' && (
                        <p className="text-xs text-blue-600 mt-1">
                          Klicken Sie unten auf "Spieler auswählen" um fortzufahren.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status message for finished player */}
              {shootoutStatus === 'finished' && !currentShootoutPlayer && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        ✓ Spieler fertig
                      </h4>
                      <p className="text-sm text-green-700">
                        Der letzte Spieler hat sein Shootout beendet. Wählen Sie den nächsten Spieler aus der Liste aus.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-center mb-6">
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={!showGameSelection ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowGameSelection(false)}
                  >
                    Spieler auswählen
                  </Button>
                  <Button
                    variant={showGameSelection ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowGameSelection(true)}
                  >
                    Spiele auswählen
                  </Button>
                </div>
              </div>

              {/* Game Selection Section */}
              {showGameSelection && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Spielauswahl ({games.length} Spiele)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {games.map(game => (
                      <div key={game.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`game-${game.id}`}
                          checked={selectedGames.includes(game.id)}
                          onChange={() => handleGameToggle(game.id)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`game-${game.id}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {game.player1?.playerName || 'TBD'} vs {game.player2?.playerName || 'TBD'}
                        </label>
                      </div>
                    ))}
                  </div>

                  {selectedGames.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>{selectedGames.length}</strong> Spiele ausgewählt für das Shootout
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={startGameShootout}
                    disabled={shootoutLoading || selectedGames.length === 0 || !selectedShootoutBoard}
                    size="lg"
                    className="mt-4"
                  >
                    {shootoutLoading ? 'Starte Shootout...' : `🎯 Shootout starten (${selectedGames.length} Spiele)`}
                  </Button>
                </div>
              )}

              {/* Player selection */}
              {!showGameSelection && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Spielerauswahl ({tournamentPlayers.length} Spieler)</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllPlayers}>
                        Alle auswählen
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAllPlayers}>
                        Alle abwählen
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {tournamentPlayers.map(player => {
                      // Check if this player is currently active
                      const isPlayerActive = currentShootoutPlayer === player.id && (shootoutStatus === 'active' || shootoutStatus === 'throwing' || shootoutStatus === 'waiting_for_admin_selection');

                      return (
                        <div key={player.id} className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${isPlayerActive ? 'bg-blue-50 border border-blue-200' : ''
                          }`}>
                          <input
                            type="checkbox"
                            id={`player-${player.id}`}
                            checked={selectedPlayers.includes(player.userId)}
                            onChange={() => handlePlayerToggle(player.userId)}
                            className="rounded border-gray-300"
                            disabled={isPlayerActive} // Disable checkbox if player is active
                          />
                          <label
                            htmlFor={`player-${player.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {player.playerName}
                          </label>
                          {isPlayerActive && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-xs font-medium">Wirft gerade</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedPlayers.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>{selectedPlayers.length}</strong> Spieler ausgewählt für das Shootout
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={startShootout}
                    disabled={shootoutLoading || selectedPlayers.length === 0 || !selectedShootoutBoard}
                    size="lg"
                    className="mt-4"
                  >
                    {shootoutLoading ? 'Starte Shootout...' : `🎯 Shootout starten (${selectedPlayers.length} Spieler)`}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading || loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Lade Turnierdaten...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !canViewBracket) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-muted-foreground">Zugriff verweigert</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.shiftKey) {
      event.preventDefault();
      const container = event.currentTarget;
      container.scrollLeft += event.deltaY + event.deltaX;
    }
  };

  // Show different content based on tournament status
  const renderContent = () => {
    if (!tournament) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-semibold mb-2">Kein aktives Turnier</h2>
          <p className="text-muted-foreground">Es ist derzeit kein Turnier aktiv.</p>
        </div>
      );
    }

    switch (tournament.status) {
      case 'REGISTRATION_CLOSED':
        return ShootoutInterface();

      case 'SHOOTOUT':
        return ShootoutInterface();

      case 'ACTIVE':
        return (
          <div className="flex flex-col h-full w-full">
            {/* Tournament Bracket - FULL PAGE */}
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 rounded-none shadow-none">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Turnierbaum</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground hidden md:inline">🖱️ Shift + Mausrad zum horizontalen Scrollen</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullscreenOpen(true)}
                      className="ml-2"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                {/* Innerer Scroll-Container */}
                <div className="absolute inset-0 overflow-x-auto overflow-y-hidden bg-background" onWheel={handleWheel}>
                  {/* min-w-max zwingt zur Breite */}
                  <div className="min-w-max min-h-max p-8 inline-block">
                    {bracketMatches && bracketMatches.length > 0 ? (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <CustomBracket
                          matches={bracketMatches}
                          isDark={false}
                          onMatchClick={handleMatchClick}
                        />
                      </DragDropContext>
                    ) : (
                      <div className="flex items-center justify-center w-full h-[400px]">
                        <div className="text-center p-12">
                          <div className="text-6xl mb-4">⏳</div>
                          <h3 className="text-xl font-semibold mb-2">Keine Spiele verfügbar</h3>
                          <p className="text-muted-foreground">
                            Erstelle ein Turnier oder warte auf die Bracket-Erstellung
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'FINISHED':
        return (
          <div className="px-4 lg:px-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Turnier abgeschlossen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold mb-2">Turnier beendet!</h3>
                  <p className="text-muted-foreground mb-6">
                    Das Turnier "{tournament.name}" wurde erfolgreich abgeschlossen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-semibold mb-2">Turnier Status: {tournament.status}</h2>
            <p className="text-muted-foreground">Turnier ist nicht bereit für die Bracket-Ansicht.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Laden...</div>;
  }

  if (!canViewBracket) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <div className="p-4 rounded-full bg-red-100 text-red-600">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Zugriff verweigert</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Sie haben keine Berechtigung, den Turnierbaum zu sehen.
                Bitte wenden Sie sich an einen Administrator.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {/* Connection Status Indicator */}
        <div className="px-4 lg:px-6 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isConnected
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                {isConnected ? 'Live-Updates aktiv' : 'Verbindung verloren'}
              </div>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}
                </span>
              )}
            </div>
            {error && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                Fehler: {error}
              </div>
            )}
          </div>
        </div>

        {/* FIX: Conditional overflow. If active, we hide overflow here so only the inner card scrolls */}
        <div className={`flex flex-1 flex-col min-h-0 ${
          tournament?.status === 'ACTIVE' ? 'overflow-hidden' : 'overflow-y-auto'
        }`}>
          {renderContent()}
        </div>
      </SidebarInset>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="fixed inset-x-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[98vw] h-[95vh] max-w-none p-0 m-0 rounded-lg border-gray-200 flex flex-col">
          <DialogHeader className="p-4 pb-0 border-b border-gray-200 flex-shrink-0 bg-background">
            <DialogTitle className="flex items-center justify-between">
              <span>Turnierbaum - Vollbild</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreenOpen(false)}
              >
                Schließen
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden w-full h-full relative bg-background">
            {bracketMatches && bracketMatches.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <CustomBracket
                  matches={bracketMatches}
                  isDark={false}
                  onMatchClick={handleMatchClick}
                  className="h-full w-full"
                  style={{ maxHeight: 'none', minHeight: 'auto' }}
                />
              </DragDropContext>
            ) : (
              <div className="flex items-center justify-center h-full w-full min-w-[50vw]">
                <div className="text-center p-12">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold mb-2">Keine Spiele verfügbar</h3>
                  <p className="text-muted-foreground">
                    Erstelle ein Turnier oder warte auf die Bracket-Erstellung
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spiel-Details</DialogTitle>
          </DialogHeader>
          
          {selectedMatch && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between px-4">
                <div className="text-center flex-1">
                  <p className="font-semibold text-lg">{selectedMatch.player1?.playerName || 'TBD'}</p>
                </div>
                <div className="text-muted-foreground font-bold px-2">VS</div>
                <div className="text-center flex-1">
                  <p className="font-semibold text-lg">{selectedMatch.player2?.playerName || 'TBD'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scheibe zuweisen</label>
                  <div className="flex gap-2">
                    <Select value={newBoardId} onValueChange={setNewBoardId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Wähle eine Scheibe" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.filter(b => b.isActive).map(board => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name} {board.currentGame ? '(Belegt)' : '(Frei)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={handleAssignBoard}
                      disabled={!newBoardId || newBoardId === selectedMatch.boardId}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedMatch.boardName && (
                     <p className="text-xs text-muted-foreground">Aktuelle Scheibe: {selectedMatch.boardName}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                   <Badge variant={selectedMatch.status === 'FINISHED' ? 'secondary' : selectedMatch.status === 'ACTIVE' ? 'default' : 'outline'}>
                     {selectedMatch.status === 'FINISHED' ? 'Beendet' : selectedMatch.status === 'ACTIVE' ? 'Läuft' : 'Wartend'}
                   </Badge>
                </div>

                {selectedMatch.status === 'WAITING' && (
                    <Button 
                        onClick={() => handleStartGame(selectedMatch.id)}
                        disabled={!selectedMatch.player1 || !selectedMatch.player2 || !selectedMatch.boardId}
                        className="flex-1 ml-4"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Spiel Starten
                    </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}