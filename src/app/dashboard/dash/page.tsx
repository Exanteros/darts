// @ts-nocheck
"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { useTournamentEvents } from '@/hooks/useTournamentEvents';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  RotateCcw
} from 'lucide-react';

// Bracket library - disabled due to type issues
// import {
//   SingleEliminationBracket,
//   DoubleEliminationBracket,
//   Match,
//   MATCH_STATES,
//   createTheme,
//   SVGViewer
// } from '@g-loot/react-tournament-brackets';

// Stubs for bracket library components since library is disabled
const createTheme = (config: any) => config;
const SingleEliminationBracket = ({ matches, theme }: any) => (
  <div className="p-4 border rounded bg-muted">
    <p className="text-sm text-muted-foreground">Bracket-Ansicht ist deaktiviert (Library-Kompatibilitätsprobleme)</p>
    <p className="text-xs">Matches: {matches?.length || 0}</p>
  </div>
);
const DoubleEliminationBracket = ({ matches, theme }: any) => (
  <div className="p-4 border rounded bg-muted">
    <p className="text-sm text-muted-foreground">Bracket-Ansicht ist deaktiviert (Library-Kompatibilitätsprobleme)</p>
    <p className="text-xs">Upper Matches: {matches?.upper?.length || 0}, Lower: {matches?.lower?.length || 0}</p>
  </div>
);
const SVGViewer = ({ children, ...props }: any) => <div {...props}>{children}</div>;

import { useEffect, useState, useMemo, useRef } from 'react';

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

interface Board {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  currentGame?: Game;
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

// Correct Match Interface for @g-loot/react-tournament-brackets
interface BracketMatch {
  id: string | number;
  name?: string;
  nextMatchId?: string | number | null;
  nextLooserMatchId?: string | number | null; // Only for double elimination
  tournamentRoundText?: string;
  startTime?: string;
  state?: 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
  participants: Array<{
    id: string | number;
    name?: string;
    isWinner?: boolean;
    status?: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
    resultText?: string | null;
  }>;
}

// For double elimination brackets
interface DoubleBracketMatches {
  upper: BracketMatch[];
  lower: BracketMatch[];
}

// Bracket Configuration
interface BracketConfig {
  tournamentType: 'single' | 'double';
  theme: 'dark' | 'light' | 'custom';
  showScores: boolean;
  showStatus: boolean;
}

export default function TournamentBracket() {
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
  const [games, setGames] = useState<Game[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const tournamentId = tournament?.id || null;
  const { lastUpdate, isConnected, error } = useTournamentEvents(tournamentId);
  const [shootoutResults, setShootoutResults] = useState<ShootoutResult[]>([]);
  const [bracketConfig, setBracketConfig] = useState<BracketConfig>({
    tournamentType: 'single',
    theme: 'dark',
    showScores: true,
    showStatus: true
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [shootoutLoading, setShootoutLoading] = useState(false);
  const [selectedShootoutBoard, setSelectedShootoutBoard] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const bracketContainerRef = useRef<HTMLDivElement>(null);
  const roundHeadersRef = useRef<HTMLDivElement>(null);

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
        const gamesByRound: Record<number, any[]> = {};
        games.forEach((game: any) => {
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
        boards.forEach((board: { currentGame?: unknown; queueLength?: number; isActive?: boolean; name: string }) => {
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

  // Pan functionality for mouse navigation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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
    if (tournament?.status === 'SHOOTOUT') {
      // Poll more frequently when shootout is active
      const pollInterval = currentShootoutPlayer ? 2000 : 5000; // 2s when player active, 5s otherwise

      const interval = setInterval(() => {
        checkShootoutStatus();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [tournament?.status, currentShootoutPlayer]);

  // Show popup ONLY ONCE for the FIRST player in the shootout
  useEffect(() => {
    if (currentShootoutPlayer && tournament?.status === 'SHOOTOUT' && shootoutStatus === 'waiting') {
      const player = tournament.players?.find(p => p.id === currentShootoutPlayer);
      if (player && !shownPopups.has('first-shootout-player')) {
        // Find all players without shootout results
        const activePlayers = tournament.players || [];
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
  const startShootout = async () => {
    console.log('🚀 startShootout called');
    const boardToUse = lockedInBoard || selectedShootoutBoard;
    console.log('Board to use:', boardToUse);
    console.log('Selected players:', selectedPlayers);

    if (!boardToUse) {
      alert('Bitte wählen Sie eine Scheibe aus');
      return;
    }

    if (selectedPlayers.length !== 1) {
      alert('Bitte wählen Sie genau einen Spieler aus');
      return;
    }

    try {
      setShootoutLoading(true);
      setShowShootoutSpinner(true); // Show spinner immediately

      console.log('Step 1: Calling start_single API...');
      // Step 1: Set tournament to SHOOTOUT status (if not already done)
      const setupResponse = await fetch('/api/dashboard/tournament/shootout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_single',
          selectedPlayers: selectedPlayers,
          boardId: boardToUse
        })
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        console.error('Setup response error:', errorData);
        throw new Error(errorData.error || 'Fehler beim Shootout-Setup');
      }
      console.log('Step 1 success');

      // Step 2: Select player and set status to "player_selected"
      const selectedPlayerId = selectedPlayers[0];
      const player = tournament?.players?.find(p => p.userId === selectedPlayerId);

      if (!player) {
        throw new Error('Spieler nicht gefunden in lokaler Liste');
      }

      console.log('Step 2: Calling select_player API for', player.playerName);
      const selectResponse = await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_player',
          playerId: player.id
        })
      });

      if (!selectResponse.ok) {
        const errorData = await selectResponse.json();
        console.error('Select response error:', errorData);
        throw new Error(errorData.error || 'Fehler beim Spieler auswählen');
      }
      console.log('Step 2 success');

      // Success - Admin panel shows "Shootout Player X is running"
      setSelectedPlayers([]);
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
      alert(`Fehler beim Starten des Shootouts: ${error instanceof Error ? error.message : String(error)}`);
      setShowShootoutSpinner(false);
    } finally {
      setShootoutLoading(false);
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
      alert(`Fehler: ${error.message}`);
    } finally {
      setShootoutLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTournamentData();
      const interval = setInterval(fetchTournamentData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Pan functionality event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Limit movement to not move bracket too far
    const maxX = 400;
    const maxY = 300;
    const minX = -400;
    const minY = -300;

    setPanOffset({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global Mouse Events for better UX
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Limit movement to not move bracket too far
      const maxX = 400;
      const maxY = 300;
      const minX = -400;
      const minY = -300;

      setPanOffset({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY))
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  // Drag & Drop Handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId.startsWith('waiting-games') && destination.droppableId.startsWith('board-')) {
      // Assign game to board
      const gameId = draggableId;
      const newBoardId = destination.droppableId.replace('board-', '');

      assignGameToBoard(gameId, newBoardId);
    }
  };

  const assignGameToBoard = async (gameId: string, boardId: string) => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_game',
          gameId,
          boardId
        })
      });
      if (response.ok) {
        fetchTournamentData(); // Reload data
      }
    } catch (error) {
      console.error('Error assigning game:', error);
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

  // Organize games by rounds
  const bracket = games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = [];
    acc[game.round].push(game);
    return acc;
  }, {} as Record<number, Game[]>);

  // Convert Games to BracketMatches for react-tournament-brackets - FIXED VERSION
  const convertGamesToBracket = (games: Game[], config?: typeof bracketConfig): BracketMatch[] | DoubleBracketMatches => {
    // Safety check: if games undefined or empty, return empty array
    if (!games || games.length === 0) {
      return bracketConfig?.tournamentType === 'double'
        ? { upper: [], lower: [] }
        : [];
    }

    // Use default configuration if config undefined
    const safeConfig = config || {
      tournamentType: 'single',
      theme: 'dark',
      showScores: true,
      showStatus: true
    };

    const sortedGames = [...games].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.id.localeCompare(b.id);
    });

    // For single elimination
    if (safeConfig.tournamentType === 'single') {
      const matches: BracketMatch[] = [];

      // Group games by rounds
      const gamesByRound = sortedGames.reduce((acc, game) => {
        if (!acc[game.round]) acc[game.round] = [];
        acc[game.round].push(game);
        return acc;
      }, {} as Record<number, Game[]>);

      // Process existing rounds only
      Object.keys(gamesByRound).forEach(roundStr => {
        const round = parseInt(roundStr);
        const roundGames = gamesByRound[round];

        roundGames.forEach((game, index) => {
          // Determine nextMatchId based on tournament logic
          let nextMatchId: string | null = null;

          // Find the next match in the next round (winner advances)
          const nextRoundGames = gamesByRound[round + 1] || [];
          const nextGameIndex = Math.floor(index / 2);
          if (nextRoundGames[nextGameIndex]) {
            nextMatchId = nextRoundGames[nextGameIndex].id;
          }

          // Determine Match State based on Game Status
          let matchState: BracketMatch['state'] = 'NO_PARTY';
          if (game.status === 'FINISHED') {
            matchState = 'DONE';
          } else if (game.status === 'ACTIVE') {
            matchState = 'SCORE_DONE';
          } else if (game.player1 && game.player2) {
            matchState = 'NO_PARTY';
          }

          // Round names mapping
          const getRoundName = (round: number) => {
            const totalRounds = Object.keys(gamesByRound).length;
            if (round === totalRounds) return 'Finale';
            if (round === totalRounds - 1) return 'Halbfinale';
            if (round === totalRounds - 2) return 'Viertelfinale';
            if (round === totalRounds - 3) return 'Achtelfinale';
            return `Runde ${round}`;
          };

          matches.push({
            id: game.id,
            name: getRoundName(game.round),
            nextMatchId,
            tournamentRoundText: getRoundName(game.round),
            startTime: game.boardName ? `Scheibe: ${game.boardName}` : undefined,
            state: matchState,
            participants: [
              {
                id: game.player1?.id || `placeholder-${game.id}-1`,
                name: game.player1?.playerName || 'TBD',
                isWinner: game.winner?.id === game.player1?.id,
                status: game.status === 'FINISHED' ? 'PLAYED' : null,
                resultText: safeConfig.showScores ? (game.boardName || null) : null
              },
              {
                id: game.player2?.id || `placeholder-${game.id}-2`,
                name: game.player2?.playerName || 'TBD',
                isWinner: game.winner?.id === game.player2?.id,
                status: game.status === 'FINISHED' ? 'PLAYED' : null,
                resultText: safeConfig.showScores ? (game.boardName || null) : null
              }
            ]
          });
        });
      });

      return matches;
    }
    // For double elimination
    else {
      // For double elimination, we need to separate upper and lower bracket games
      // This would need to be implemented based on your backend data structure
      // For now, return a basic structure
      const upperMatches: BracketMatch[] = [];
      const lowerMatches: BracketMatch[] = [];

      // You would need to implement the logic to separate games into upper/lower brackets
      // based on your tournament structure

      return {
        upper: upperMatches,
        lower: lowerMatches
      };
    }
  };

  // Custom Match Component for extended display - FIXED VERSION
  const CustomMatch = (props: any) => {
    const {
      match,
      onMatchClick,
      onPartyClick,
      onMouseEnter,
      onMouseLeave,
      topParty,
      bottomParty,
      topWon,
      bottomWon,
      topHovered,
      bottomHovered,
      topText,
      bottomText,
      connectorColor,
      computedStyles,
      teamNameFallback,
      resultFallback,
    } = props;

    const game = games.find(g => g.id === match.id);

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          color: bracketConfig.theme === 'light' ? '#000' : '#fff',
          backgroundColor: bracketConfig.theme === 'light' ? '#fff' : '#2d3748',
          border: `2px solid ${topWon || bottomWon ? '#10b981' : '#e2e8f0'}`,
          borderRadius: '8px',
          width: '200px',
          height: '80px',
          padding: '8px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
        onClick={() => onMatchClick && onMatchClick(match)}
      >
        {/* Player 1 */}
        <div
          onMouseEnter={() => onMouseEnter && onMouseEnter(topParty.id)}
          onMouseLeave={() => onMouseLeave && onMouseLeave(topParty.id)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: topWon ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: topWon ? 'bold' : 'normal'
          }}
        >
          <span>{topParty.name || teamNameFallback}</span>
          {bracketConfig.showScores && (
            <span>{topParty.resultText ?? (topWon ? '🏆' : '')}</span>
          )}
        </div>

        <div style={{ height: '1px', width: '100%', background: '#e2e8f0' }} />

        {/* Player 2 */}
        <div
          onMouseEnter={() => onMouseEnter && onMouseEnter(bottomParty.id)}
          onMouseLeave={() => onMouseLeave && onMouseLeave(bottomParty.id)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: bottomWon ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: bottomWon ? 'bold' : 'normal'
          }}
        >
          <span>{bottomParty.name || teamNameFallback}</span>
          {bracketConfig.showScores && (
            <span>{bottomParty.resultText ?? (bottomWon ? '🏆' : '')}</span>
          )}
        </div>

        {/* Status Display */}
        {bracketConfig.showStatus && game && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: game.status === 'FINISHED' ? '#10b981' :
              game.status === 'ACTIVE' ? '#f59e0b' : '#6b7280',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
          }}>
            {game.status === 'FINISHED' ? '✓' :
              game.status === 'ACTIVE' ? '▶' : '⏳'}
          </div>
        )}
      </div>
    );
  };

  const bracketMatches = useMemo(() => convertGamesToBracket(games, bracketConfig), [games, bracketConfig]);

  // Waiting games without board
  const waitingGames = games.filter(game =>
    game.status === 'WAITING' &&
    !game.boardId &&
    game.player1 &&
    game.player2
  );

  // Shootout component in Players style
  const ShootoutInterface = () => {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🎯 Shootout Phase</h1>
              <p className="text-muted-foreground">
                Verwalten Sie das 3-Dart-Shootout für die Setzlisten-Ermittlung
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {completedShootouts}/{totalPlayers} abgeschlossen
              </Badge>
              {isShootoutComplete && (
                <Button onClick={finalizeShootout} disabled={shootoutLoading}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {boards
                  .filter(board => board.isActive)
                  .sort((a, b) => a.priority - b.priority)
                  .map(board => (
                    <div
                      key={board.id}
                      onClick={() => !lockedInBoard && setSelectedShootoutBoard(board.id)}
                      className={`p-4 border rounded-lg transition-all ${lockedInBoard
                          ? board.id === lockedInBoard
                            ? 'border-green-500 bg-green-50 cursor-not-allowed'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : selectedShootoutBoard === board.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 cursor-pointer hover:shadow-md'
                            : 'border-gray-200 hover:border-primary/50 cursor-pointer hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{board.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Priorität: {board.priority}
                          </div>
                        </div>
                        {lockedInBoard && board.id === lockedInBoard && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Gesperrt</span>
                          </div>
                        )}
                        {!lockedInBoard && selectedShootoutBoard === board.id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Spieler für Shootout auswählen
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Wählen Sie einen Spieler aus, der als nächstes das Shootout macht
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="players" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="players">Einzelne Spieler</TabsTrigger>
                  <TabsTrigger value="bulk">Massen-Shootout</TabsTrigger>
                </TabsList>

                <TabsContent value="players" className="space-y-4">
                  {(tournament?.players?.filter(p => !['WAITING_LIST', 'WITHDRAWN'].includes(p.status)).length === 0) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3 text-yellow-800 mb-4">
                      <IconInfoCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">Keine aktiven Spieler verfügbar</p>
                        <p className="text-sm mt-1">
                          Um das Shootout zu starten, müssen sich Spieler im Status <Badge variant="outline" className="text-yellow-800 border-yellow-600">Aktiv</Badge>, <Badge variant="outline" className="text-yellow-800 border-yellow-600">Registriert</Badge> oder <Badge variant="outline" className="text-yellow-800 border-yellow-600">Bestätigt</Badge> befinden.
                          Bitte ändern Sie den Status der entsprechenden Spieler in der <a href="/dashboard/players" className="underline font-medium hover:text-yellow-900">Spielerverwaltung</a>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Spieler auswählen ({tournament?.players?.length || 0} verfügbar)</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedPlayers([])}>
                        Alle abwählen
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {tournament?.players
                      ?.map(player => (
                        <div
                          key={player.id}
                          onClick={() => {
                            setSelectedPlayers([player.userId]);
                          }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${selectedPlayers.includes(player.userId)
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-primary/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{player.playerName}</div>
                              <div className="text-xs text-muted-foreground">
                                {player.seed ? `Seed: ${player.seed}` : 'Noch kein Shootout'} • {player.status}
                              </div>
                            </div>
                            {selectedPlayers.includes(player.userId) && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
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
                        const allPlayers = tournament?.players
                          ?.map(player => player.userId) || [];
                        setSelectedPlayers(allPlayers);
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
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-medium text-sm">
                    <div>Rang</div>
                    <div>Spieler</div>
                    <div>Score</div>
                    <div>Würfe</div>
                    <div>Status</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {shootoutResults
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((result, index) => (
                        <div key={result.playerId} className="grid grid-cols-5 gap-4 p-4 border-t text-sm hover:bg-muted/50">
                          <div className="font-medium">
                            {result.score > 0 ? (
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                {index + 1}
                              </Badge>
                            ) : '-'}
                          </div>
                          <div className="font-medium">{result.playerName}</div>
                          <div className="font-mono font-bold">{result.score || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.throws ? result.throws.join(' + ') : '-'}
                          </div>
                          <div>
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
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Pre-Tournament State Component
  const PreTournamentState = () => {
    // Load players for selection
    const tournamentPlayers = tournament?.players || [];

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

  // Create bracket theme - FIXED VERSION
  const bracketTheme = useMemo(() => {
    if (bracketConfig.theme === 'light') {
      return createTheme({
        textColor: { main: '#1f2937', highlighted: '#111827', dark: '#6b7280' },
        matchBackground: { wonColor: '#ecfdf5', lostColor: '#f3f4f6' },
        score: {
          background: { wonColor: '#10b981', lostColor: '#6b7280' },
          text: { highlightedWonColor: '#ffffff', highlightedLostColor: '#ffffff' },
        },
        border: {
          color: '#e5e7eb',
          highlightedColor: '#10b981',
        },
        roundHeader: { backgroundColor: '#f9fafb', fontColor: '#1f2937' },
        connectorColor: '#d1d5db',
        connectorColorHighlight: '#10b981',
        svgBackground: '#ffffff',
      });
    } else {
      return createTheme({
        textColor: { main: '#e5e7eb', highlighted: '#ffffff', dark: '#9ca3af' },
        matchBackground: { wonColor: '#064e3b', lostColor: '#374151' },
        score: {
          background: { wonColor: '#10b981', lostColor: '#6b7280' },
          text: { highlightedWonColor: '#ffffff', highlightedLostColor: '#ffffff' },
        },
        border: {
          color: '#4b5563',
          highlightedColor: '#10b981',
        },
        roundHeader: { backgroundColor: '#374151', fontColor: '#e5e7eb' },
        connectorColor: '#6b7280',
        connectorColorHighlight: '#10b981',
        svgBackground: '#1f2937',
      });
    }
  }, [bracketConfig.theme]);

  // Dynamic ViewBox size based on number of games
  const getViewBoxSize = (matches: BracketMatch[] | DoubleBracketMatches) => {
    // Dynamically compute viewBox based on number of rounds (columns) and
    // the largest round (rows). This prevents the SVG from being too small
    // which can cause visual scaling / misplacement of boxes when there are
    // many rounds.

    if (!matches) {
      return { width: 1400, height: 700 };
    }

    // Styles must align with SingleEliminationBracket options below
    const columnWidth = 220; // includes match width + spacing
    const rowHeight = 90; // height per row
    const canvasPadding = 20;

    let columns = 1;
    let maxRows = 1;

    if (Array.isArray(matches)) {
      // Count unique round texts or fallback to rounds deduced from matches
      const rounds = new Map<string, number>();
      matches.forEach((m) => {
        const key = m.tournamentRoundText || `Runde ${m.id}`;
        rounds.set(key, (rounds.get(key) || 0) + 1);
      });
      columns = Math.max(1, rounds.size);
      maxRows = Math.max(...Array.from(rounds.values()), 1);
    } else {
      const upperRounds = new Map<string, number>();
      const lowerRounds = new Map<string, number>();
      matches.upper?.forEach(m => upperRounds.set(m.tournamentRoundText || `${m.id}`, (upperRounds.get(m.tournamentRoundText || `${m.id}`) || 0) + 1));
      matches.lower?.forEach(m => lowerRounds.set(m.tournamentRoundText || `${m.id}`, (lowerRounds.get(m.tournamentRoundText || `${m.id}`) || 0) + 1));
      columns = Math.max(1, upperRounds.size + lowerRounds.size);
      maxRows = Math.max(...Array.from(upperRounds.values(), v => v || 0).concat(Array.from(lowerRounds.values(), v => v || 0), [1]));
    }

    // Ensure min sizes for small tournaments so layout stays sane
    const minWidth = 1400;
    const minHeight = 700;

    const width = Math.max(minWidth, columns * columnWidth + canvasPadding * 2);
    const height = Math.max(minHeight, maxRows * rowHeight + canvasPadding * 2);

    return { width, height };
  };

  const viewBoxSize = useMemo(() => getViewBoxSize(bracketMatches), [bracketMatches]);

  // Extract round names from bracket matches
  const roundHeaders = useMemo(() => {
    if (!bracketMatches || !Array.isArray(bracketMatches)) return [];
    
    const rounds = new Map<string, number>();
    bracketMatches.forEach((match) => {
      const roundText = match.tournamentRoundText || 'Runde';
      if (!rounds.has(roundText)) {
        rounds.set(roundText, rounds.size);
      }
    });
    
    return Array.from(rounds.keys());
  }, [bracketMatches]);

  // Sync scroll between round headers and bracket container
  useEffect(() => {
    const bracketContainer = bracketContainerRef.current;
    const roundHeadersContainer = roundHeadersRef.current;

    if (!bracketContainer || !roundHeadersContainer) return;

    const handleScroll = () => {
      roundHeadersContainer.scrollLeft = bracketContainer.scrollLeft;
    };

    bracketContainer.addEventListener('scroll', handleScroll);

    return () => {
      bracketContainer.removeEventListener('scroll', handleScroll);
    };
  }, [bracketMatches]);

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

  if (!isAuthenticated) {
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
            <p className="text-muted-foreground">Nicht angemeldet</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
        return <ShootoutInterface />;

      case 'SHOOTOUT':
        return <ShootoutInterface />;

      case 'ACTIVE':
        return (
          <div className="space-y-6 pt-6 overflow-x-hidden">
            {/* Tournament Header */}
            <Card className="mx-4 lg:mx-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {tournament.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Activity className="mr-1 h-3 w-3" />
                      Aktiv
                    </Badge>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={autoSchedule}>
                          <Settings className="mr-2 h-4 w-4" />
                          Auto-Schedule
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetAssignments}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Zuweisungen
                        </Button>
                        <Button variant="outline" size="sm" onClick={resetAndReschedule}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset & Neu Zuweisen
                        </Button>
                        <Button variant="outline" size="sm" onClick={showDebugInfo}>
                          <Activity className="mr-2 h-4 w-4" />
                          Debug Info
                        </Button>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Bracket Configuration */}
            {isAdmin && (
              <Card className="mx-4 lg:mx-6">
                <CardHeader>
                  <CardTitle>Bracket Einstellungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Turnier-Typ</label>
                      <Select
                        value={bracketConfig.tournamentType}
                        onValueChange={(value: 'single' | 'double') =>
                          setBracketConfig(prev => ({ ...prev, tournamentType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Elimination</SelectItem>
                          <SelectItem value="double">Double Elimination</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Theme</label>
                      <Select
                        value={bracketConfig.theme}
                        onValueChange={(value: 'dark' | 'light') =>
                          setBracketConfig(prev => ({ ...prev, theme: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Hell</SelectItem>
                          <SelectItem value="dark">Dunkel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showScores"
                        checked={bracketConfig.showScores}
                        onChange={(e) => setBracketConfig(prev => ({ ...prev, showScores: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="showScores" className="text-sm font-medium">
                        Scores anzeigen
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showStatus"
                        checked={bracketConfig.showStatus}
                        onChange={(e) => setBracketConfig(prev => ({ ...prev, showStatus: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="showStatus" className="text-sm font-medium">
                        Status anzeigen
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tournament Bracket - FIXED VERSION */}
            <Card className="mx-4 lg:mx-6">
              <CardHeader>
                <CardTitle>Turnierbaum</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative border rounded-lg" style={{ height: '700px', overflow: 'hidden' }}>
                  {/* Fixed Round Headers - positioned at the top inside the container */}
                  {roundHeaders.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm" style={{ overflow: 'hidden' }}>
                      <div 
                        ref={roundHeadersRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide px-3 py-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {roundHeaders.map((roundName, index) => (
                          <div
                            key={index}
                            className="flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm"
                            style={{
                              backgroundColor: bracketConfig.theme === 'light' ? '#f3f4f6' : '#374151',
                              color: bracketConfig.theme === 'light' ? '#1f2937' : '#e5e7eb',
                              // Match the column width used by the bracket library (columnWidth)
                              width: '220px',
                              textAlign: 'center'
                            }}
                          >
                            {roundName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div
                    ref={bracketContainerRef}
                    id="bracket-container"
                    className="h-full overflow-x-auto overflow-y-hidden"
                    style={{ 
                      paddingTop: roundHeaders.length > 0 ? '56px' : '0',
                      width: '100%'
                    }}
                  >
                  {bracketMatches && (
                    Array.isArray(bracketMatches) ? (
                      // Single Elimination
                      bracketMatches.length > 0 ? (
                        bracketConfig.tournamentType === 'single' ? (
                          <SingleEliminationBracket
                            matches={bracketMatches}
                            matchComponent={CustomMatch}
                            theme={bracketTheme}
                            options={{
                              style: {
                                roundHeader: {
                                  backgroundColor: bracketTheme.roundHeader?.backgroundColor || '#374151',
                                  fontColor: bracketTheme.roundHeader?.fontColor || '#e5e7eb'
                                },
                                connectorColor: bracketTheme.connectorColor || '#6b7280',
                                connectorColorHighlight: bracketTheme.connectorColorHighlight || '#10b981',
                                matchMaxWidth: 200,
                                matchMinWidth: 200,
                                boxHeight: 80,
                                canvasPadding: 20,
                                rowHeight: 90,
                                columnWidth: 220,
                                roundSeparatorWidth: 30,
                              },
                            }}
                            svgWrapper={({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
                              <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                <SVGViewer
                                  width={viewBoxSize.width}
                                  height={viewBoxSize.height}
                                  background={bracketTheme.svgBackground || '#1f2937'}
                                  SVGBackground={bracketTheme.svgBackground || '#1f2937'}
                                  {...props}
                                >
                                  {children}
                                </SVGViewer>
                              </div>
                            )}
                          />
                        ) : null
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-4xl mb-4">⏳</div>
                            <p className="text-muted-foreground">Keine Spiele verfügbar</p>
                          </div>
                        </div>
                      )
                    ) : (
                      // Double Elimination
                      bracketConfig.tournamentType === 'double' &&
                        bracketMatches.upper &&
                        bracketMatches.upper.length > 0 ? (
                        <DoubleEliminationBracket
                          matches={bracketMatches}
                          matchComponent={CustomMatch}
                          theme={bracketTheme}
                          options={{
                            style: {
                              roundHeader: {
                                backgroundColor: bracketTheme.roundHeader?.backgroundColor || '#374151',
                                fontColor: bracketTheme.roundHeader?.fontColor || '#e5e7eb'
                              },
                              connectorColor: bracketTheme.connectorColor || '#6b7280',
                              connectorColorHighlight: bracketTheme.connectorColorHighlight || '#10b981',
                              matchMaxWidth: 200,
                              matchMinWidth: 200,
                              boxHeight: 80,
                              canvasPadding: 20,
                              rowHeight: 90,
                              columnWidth: 220,
                              roundSeparatorWidth: 30,
                            },
                          }}
                          svgWrapper={({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
                            <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                              <SVGViewer
                                width={viewBoxSize.width}
                                height={viewBoxSize.height}
                                background={bracketTheme.svgBackground || '#1f2937'}
                                SVGBackground={bracketTheme.svgBackground || '#1f2937'}
                                {...props}
                              >
                                {children}
                              </SVGViewer>
                            </div>
                          )}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-4xl mb-4">⏳</div>
                            <p className="text-muted-foreground">Bracket wird geladen...</p>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Info */}
            {debugInfo && (
              <Card className="mx-4 lg:mx-6">
                <CardHeader>
                  <CardTitle>🔍 Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded whitespace-pre-wrap overflow-auto max-h-96">
                    {debugInfo}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugInfo('')}
                    className="mt-2"
                  >
                    Schließen
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Drag & Drop Game Management */}
            {isAdmin && waitingGames.length > 0 && (
              <Card className="mx-4 lg:mx-6">
                <CardHeader>
                  <CardTitle>Spiel-Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Waiting Games */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Wartende Spiele ({waitingGames.length})
                        </h4>
                        <Droppable droppableId="waiting-games">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2 min-h-[200px] p-3 border rounded-lg bg-muted/50"
                            >
                              {waitingGames.map((game, index) => (
                                <Draggable key={game.id} draggableId={game.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-3 bg-white border rounded-lg shadow-sm transition-all ${snapshot.isDragging ? 'shadow-lg scale-105' : ''
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline">Runde {game.round}</Badge>
                                          <span className="text-sm font-medium">
                                            {game.player1?.playerName} vs {game.player2?.playerName}
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Warten auf Scheibe
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>

                      {/* Boards */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Scheiben ({boards.filter(b => b.isActive).length})
                        </h4>
                        <div className="space-y-3">
                          {boards
                            .filter(board => board.isActive)
                            .sort((a, b) => a.priority - b.priority)
                            .map(board => (
                              <Droppable key={board.id} droppableId={`board-${board.id}`}>
                                {(provided, snapshot) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`p-3 border rounded-lg transition-all ${snapshot.isDraggingOver
                                        ? 'border-primary bg-primary/5'
                                        : board.currentGame
                                          ? 'border-orange-300 bg-orange-50'
                                          : 'border-green-300 bg-green-50'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={board.currentGame ? "default" : "secondary"}>
                                          {board.name}
                                        </Badge>
                                        {board.currentGame && (
                                          <Badge variant="outline" className="text-xs">
                                            <Play className="mr-1 h-3 w-3" />
                                            Aktiv
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Queue: {board.queueLength}
                                      </div>
                                    </div>

                                    {board.currentGame ? (
                                      <div className="text-sm">
                                        <div className="font-medium">
                                          {board.currentGame.player1?.playerName} vs {board.currentGame.player2?.playerName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Runde {board.currentGame.round}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        Bereit für nächstes Spiel
                                      </div>
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            ))}
                        </div>
                      </div>
                    </div>
                  </DragDropContext>
                </CardContent>
              </Card>
            )}
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
      <SidebarInset className="overflow-x-hidden">
        <SiteHeader />

        {/* Connection Status Indicator */}
        <div className="px-4 lg:px-6 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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

        <div className="flex flex-1 flex-col overflow-x-hidden">
          {renderContent()}
        </div>
      </SidebarInset>

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
                  <div className="space-y-2">
                    {shootoutStatus === 'player_selected' && (
                      <>
                        <p className="text-muted-foreground">
                          <strong>{player?.playerName}</strong> wurde ausgewählt
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bleibe hier, bis das Shootout auf /note/scheibe/ gestartet wird
                        </p>
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
              <div className="space-y-2">
                <Button
                  onClick={finishCurrentPlayer}
                  className="w-full"
                  disabled={shootoutLoading}
                >
                  {shootoutLoading ? 'Wird bearbeitet...' : 'Nächsten Spieler auswählen'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}