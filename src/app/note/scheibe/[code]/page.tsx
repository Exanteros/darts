"use client";

import { useState, useEffect, use, useRef, FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, RotateCcw, Target, Trash2, CheckCircle, Trophy, Play, Users, Activity, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTournamentEvents } from '@/hooks/useTournamentEvents';
import { useWebSocket } from '@/hooks/useWebSocket';

// --- STATE-DEFINITION ---

interface ThrowDart {
  value: number;
  multiplier: number;
}

interface GameState {
  player1: {
    name: string;
    score: number;
    legs: number;
    totalDarts: number;
    average: number;
  };
  player2: {
    name: string;
    score: number;
    legs: number;
    totalDarts: number;
    average: number;
  };
  currentPlayer: 1 | 2;
  currentLeg: number;
  legsToWin: number;
  throws: Array<{
    player: 1 | 2;
    darts: number[];
    total: number;
    remaining: number;
    leg: number;
  }>;
  gameStatus: "active" | "finished";
  winner?: 1 | 2;
  isShootout?: boolean;
  shootoutThrows: Array<{
    player: 1 | 2;
    darts: number[];
    total: number;
  }>;
}

const initialGameState: GameState = {
  player1: { name: "Spieler 1", score: 501, legs: 0, totalDarts: 0, average: 0 },
  player2: { name: "Spieler 2", score: 501, legs: 0, totalDarts: 0, average: 0 },
  currentPlayer: 1,
  currentLeg: 1,
  legsToWin: 2,
  throws: [],
  gameStatus: "active",
  isShootout: false,
  shootoutThrows: []
};

// --- HAUPTKOMPONENTE ---

export default function ScoreEntry({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  
  // Board State
  const [boardId, setBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentThrow, setCurrentThrow] = useState<ThrowDart[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  
  // Tournament State
  const [tournamentStatus, setTournamentStatus] = useState<string>('UPCOMING');
  const [shootoutBoardId, setShootoutBoardId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  
  // Popup States
  const [showShootoutPopup, setShowShootoutPopup] = useState(false);
  const [nextPlayerName, setNextPlayerName] = useState<string>('');
  const [currentShootoutPlayer, setCurrentShootoutPlayer] = useState<string>('');
  const [shootoutPlayersShown, setShootoutPlayersShown] = useState<Set<string>>(new Set());
  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [hasShownFirstPopup, setHasShownFirstPopup] = useState(false);
  const [hasReloadedForNewPlayer, setHasReloadedForNewPlayer] = useState(false);
  const [showNextPlayerReadyPopup, setShowNextPlayerReadyPopup] = useState(false);
  const [showStartShootoutPopup, setShowStartShootoutPopup] = useState(false);
  const [showGameStartPopup, setShowGameStartPopup] = useState(false);
  const [shownGamePopups, setShownGamePopups] = useState<Set<string>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Utils
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { lastUpdate, isConnected } = useTournamentEvents(tournamentId);
  
  // WebSocket für Game-Updates an Display
  const { sendMessage: sendGameUpdate, isConnected: wsConnected } = useWebSocket({
    url: typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`
      : 'ws://localhost:3001',
    onConnect: () => {
      console.log('🎯 Note/Scheibe: WebSocket verbunden');
    },
    onMessage: (data) => {
      if (data.type === 'game-reset' && (!data.gameId || (currentGame && data.gameId === currentGame.id))) {
        console.log('🔄 Game reset received');
        window.location.reload();
      }
    }
  });
  
  const dartboardNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const currentPlayerData = gameState[`player${gameState.currentPlayer}`];

  // --- LOGIK & EFFEKTE ---

  // 1. Resolve Board Code
  useEffect(() => {
    const resolveBoardCode = async () => {
      try {
        const response = await fetch(`/api/board/${code}`);
        if (!response.ok) throw new Error('Board not found');
        const board = await response.json();
        setBoardId(board.id);
        setLoading(false);
      } catch (err) {
        setBoardError('Ungültiger Board-Code');
        setLoading(false);
      }
    };
    resolveBoardCode();
  }, [code]);

  // 2. Load Initial Tournament Status
  useEffect(() => {
    const loadTournamentStatus = async () => {
      try {
        const response = await fetch('/api/dashboard/tournament/shootout');
        const data = await response.json();
        if (data.tournament) {
          setTournamentStatus(data.tournament.status);
          setTournamentId(data.tournament.id);
          
          if (data.tournament.status === 'SHOOTOUT' && data.tournament.shootoutBoardId === boardId) {
            setGameState(prev => ({
              ...prev,
              isShootout: true,
              player1: { ...prev.player1, score: 0 },
              player2: { ...prev.player2, score: 0 }
            }));
            
            setTimeout(() => {
              checkForShootoutStatusOnly();
              setTimeout(() => checkForShootoutStatusOnly(), 2000);
            }, 500);
          } else if (data.tournament.status === 'ACTIVE') {
            checkForGameAssignment();
          }
          
          setShootoutBoardId(data.tournament.shootoutBoardId || null);
        }
      } catch (error) {
        console.error('Error loading tournament status:', error);
      }
    };
    
    if (boardId) {
        loadTournamentStatus();
    }
    const cleanup = startStatusInterval();
    return cleanup;
  }, [boardId]);

  // 3. Polling Logic
  const startStatusInterval = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    const interval = setInterval(() => {
      if (tournamentStatus === 'SHOOTOUT' && shootoutBoardId === boardId) {
        checkForShootoutStatusOnly();
      } else if (tournamentStatus === 'ACTIVE' && !showGameStartPopup && !gameState.isShootout) {
        checkForGameAssignment();
      }
    }, showWaitingPopup ? 1000 : (currentShootoutPlayer ? 2000 : 5000));
    
    pollingIntervalRef.current = interval;
    
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  };

  useEffect(() => {
    const cleanup = startStatusInterval();
    return cleanup;
  }, [currentShootoutPlayer, tournamentStatus, shootoutBoardId, boardId, showWaitingPopup, showGameStartPopup, gameState.isShootout]);

  // 4. Update Time & Connection
  useEffect(() => {
    if (lastUpdate) setLastUpdateTime(new Date());
  }, [lastUpdate]);

  useEffect(() => {
    if (isConnected && !lastUpdateTime) setLastUpdateTime(new Date());
  }, [isConnected, lastUpdateTime]);

  // 5. Game Logic: Finish Game
  useEffect(() => {
    const finishGame = async () => {
      if (gameState.gameStatus === 'finished' && gameState.winner && currentGame && !gameState.isShootout) {
        try {
          const winnerName = gameState[`player${gameState.winner}`].name;
          await fetch('/api/game/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: currentGame.id,
              winner: winnerName,
              player1Score: gameState.player1.legs,
              player2Score: gameState.player2.legs
            })
          });
          setShownGamePopups(prev => new Set([...prev, currentGame.id]));
          setCurrentGame(null);
          setGameState(initialGameState);
        } catch (error) {
          console.error('Error finishing game:', error);
        }
      }
    };
    finishGame();
  }, [gameState.gameStatus, gameState.winner, currentGame]);

  // 6. WebSocket Updates
  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'tournament_update' && lastUpdate.tournament) {
      setTournamentStatus(lastUpdate.tournament.status);
      setShootoutBoardId(lastUpdate.tournament.shootoutBoardId);

      if (lastUpdate.tournament.status === 'SHOOTOUT') checkForShootoutStatusOnly();
      else if (lastUpdate.tournament.status === 'ACTIVE') checkForGameAssignment();
    }
  }, [lastUpdate]);

  // --- API Helper Functions ---

  const checkForShootoutStatusOnly = async () => {
    try {
      const response = await fetch(`/api/dashboard/tournament/shootout/status?activePlayer=${currentShootoutPlayer || ''}`);
      const data = await response.json();

      if (data.status === 'waiting_for_selection') {
        if (!showWaitingPopup && !showShootoutPopup) {
          setShowWaitingPopup(true);
          setShowShootoutPopup(false);
          setShowNextPlayerReadyPopup(false);
        }
        setCurrentShootoutPlayer('');
      } else if (data.status === 'player_selected' && data.currentPlayer) {
        setShowWaitingPopup(false);
        setShowShootoutPopup(false);
        setShowNextPlayerReadyPopup(false);
        setShowStartShootoutPopup(true);
        setCurrentShootoutPlayer(data.currentPlayer.id);
        setNextPlayerName(data.currentPlayer.playerName);
        
        if (gameState.player1.name !== data.currentPlayer.playerName) {
          setGameState(prev => ({
            ...prev,
            isShootout: true,
            player1: { ...prev.player1, name: data.currentPlayer.playerName, score: 0 }
          }));
        }
      } else if (data.status === 'throwing' && data.currentPlayer) {
        setShowWaitingPopup(false);
        setShowNextPlayerReadyPopup(false);
        setCurrentShootoutPlayer(data.currentPlayer.id);
        setNextPlayerName(data.currentPlayer.playerName);
        
        if (!shootoutPlayersShown.has(data.currentPlayer.id)) {
          setShootoutPlayersShown(prev => new Set([...prev, data.currentPlayer.id]));
          setShowShootoutPopup(true);
        }
        
        if (gameState.player1.name !== data.currentPlayer.playerName) {
          setGameState(prev => ({
            ...prev,
            player1: { ...prev.player1, name: data.currentPlayer.playerName, score: 0 }
          }));
        }
      } else if (data.status === 'waiting_for_admin') {
        setShowShootoutPopup(false);
        setShowWaitingPopup(true);
        setShowNextPlayerReadyPopup(false);
      } else if (data.status === 'completed') {
        setShowWaitingPopup(false);
        setShowShootoutPopup(false);
        setShowNextPlayerReadyPopup(false);
        setCurrentShootoutPlayer('');
      }
    } catch (error) {
      console.error('Error checking shootout status:', error);
    }
  };

  const checkForGameAssignment = async () => {
    if (!boardId || tournamentStatus !== 'ACTIVE') return;

    try {
      const response = await fetch(`/api/admin/boards/${boardId}`);
      const data = await response.json();
      
      if (data.success && data.board.currentGame && !gameState.isShootout) {
        const game = data.board.currentGame;
        if (game.status === 'FINISHED') return;
        
        setCurrentGame(game);
        
        // Check if we need to update the local state
        // We update if:
        // 1. It's a different game (names don't match)
        // 2. OR our local state is "fresh" (501/0) but the server has progress
        // 3. OR we explicitly want to force a sync (e.g. on load)
        
        const isFreshState = gameState.player1.score === 501 && gameState.player1.legs === 0 && 
                             gameState.player2.score === 501 && gameState.player2.legs === 0 &&
                             gameState.throws.length === 0;

        const serverHasProgress = game.player1Score !== 501 || game.player1Legs > 0 || 
                                  game.player2Score !== 501 || game.player2Legs > 0 ||
                                  (game.throws && game.throws.length > 0);

        const isNewGame = gameState.player1.name !== game.player1 || gameState.player2.name !== game.player2;

        if (isNewGame || (isFreshState && serverHasProgress)) {
          console.log('🔄 Syncing game state from server:', {
            local: { p1: gameState.player1.score, p2: gameState.player2.score },
            server: { p1: game.player1Score, p2: game.player2Score },
            reason: isNewGame ? 'new_game' : 'fresh_state_sync'
          });
          
          setGameState(prev => ({
            ...prev,
            player1: { 
              ...prev.player1, 
              name: game.player1, 
              score: game.player1Score ?? 501,
              legs: game.player1Legs ?? 0
            },
            player2: { 
              ...prev.player2, 
              name: game.player2, 
              score: game.player2Score ?? 501,
              legs: game.player2Legs ?? 0
            },
            currentPlayer: game.currentPlayerId === game.player2Id ? 2 : 1,
            currentLeg: game.currentLeg ?? 1,
            legsToWin: game.legsToWin ?? 2,
            gameStatus: 'active',
            isShootout: false,
            throws: game.throws || []
          }));
        }
        
        if (!shownGamePopups.has(game.id) && !showGameStartPopup && isNewGame) {
          setShowGameStartPopup(true);
          setShownGamePopups(prev => new Set([...prev, game.id]));
        }
      }
    } catch (error) {
      console.error('Error checking for game assignment:', error);
    }
  };

  const startAssignedGame = () => setShowGameStartPopup(false);

  const finishPlayerShootout = async () => {
    if (!currentShootoutPlayer) return;
    try {
      const playerThrows = gameState.shootoutThrows.filter(t => t.player === 1);
      const totalScore = playerThrows.reduce((sum, t) => sum + t.total, 0);
      const allDarts: number[] = [];
      playerThrows.forEach(throwData => allDarts.push(...throwData.darts));

      await fetch('/api/dashboard/tournament/shootout/finish-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentShootoutPlayer,
          score: totalScore,
          throws: allDarts.slice(0, 3)
        })
      });

      await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_throwing',
          playerId: currentShootoutPlayer,
          score: totalScore
        })
      });      
      
      setTimeout(() => checkForShootoutStatusOnly(), 500);
      setHasReloadedForNewPlayer(false);
      setGameState(prev => ({
        ...prev,
        isShootout: false,
        player1: { name: '', score: 0, legs: 0, totalDarts: 0, average: 0 },
        player2: { name: '', score: 0, legs: 0, totalDarts: 0, average: 0 },
        shootoutThrows: []
      }));
    } catch (error) {
      console.error('Error finishing player shootout:', error);
    }
  };

  const startNextPlayerShootout = async (playerName: string, playerId: string) => {
    try {
      await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active_player', playerId })
      });
    } catch (error) { console.error(error); }

    setGameState(prev => ({
      ...prev,
      isShootout: true,
      player1: { ...prev.player1, name: playerName, score: 0, totalDarts: 0 },
      player2: { ...prev.player2, name: '', score: 0, totalDarts: 0 },
      currentPlayer: 1,
      gameStatus: 'active',
      shootoutThrows: []
    }));
    setShowNextPlayerReadyPopup(false);
    setShootoutPlayersShown(prev => new Set([...prev, 'next-player-popup-dismissed']));
  };

  const startSinglePlayerShootout = async (playerName: string) => {
    try {
      await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active_player', playerId: currentShootoutPlayer })
      });
    } catch (error) { console.error(error); }

    setGameState(prev => ({
      ...prev,
      isShootout: true,
      player1: { ...prev.player1, name: playerName, score: 0, totalDarts: 0 },
      player2: { ...prev.player2, name: '', score: 0, totalDarts: 0 },
      currentPlayer: 1,
      gameStatus: 'active',
      shootoutThrows: []
    }));
    setShowShootoutPopup(false);
    setShootoutPlayersShown(prev => new Set([...prev, 'popup-dismissed']));
    setHasShownFirstPopup(true);
    if (!hasReloadedForNewPlayer) setHasReloadedForNewPlayer(true);
  };

  const startThrowing = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/shootout/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_throwing' })
      });
      if (response.ok) setShowStartShootoutPopup(false);
    } catch (error) { console.error(error); }
  };

  const updateCurrentThrowDisplay = async (darts: ThrowDart[]) => {
    if (!currentGame?.id) return;
    try {
      await fetch('/api/game/current-throw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: currentGame.id,
          darts: darts.map(d => d.value),
          player: gameState.currentPlayer,
          score: darts.reduce((sum, d) => sum + d.value, 0)
        })
      });
    } catch (error) { console.error(error); }
  };

  const clearCurrentThrowDisplay = async () => {
    if (!currentGame?.id) return;
    try {
      await fetch(`/api/game/current-throw?gameId=${currentGame.id}`, { method: 'DELETE' });
    } catch (error) { console.error(error); }
  };

  // --- GAME ACTIONS ---

  const addDart = (baseNumber: number, mult: 0 | 1 | 2 | 3) => {
    if (currentThrow.length < 3 && gameState.gameStatus === "active") {
      const dartValue = baseNumber * mult;
      const newThrow = [...currentThrow, { value: dartValue, multiplier: mult }];
      setCurrentThrow(newThrow);
      setSelectedNumber(null);
      updateCurrentThrowDisplay(newThrow);
    }
  };

  const clearThrow = () => {
    setCurrentThrow([]);
    setSelectedNumber(null);
    clearCurrentThrowDisplay();
  };

  const submitThrow = async () => {
    if (currentThrow.length !== 3 || gameState.gameStatus !== "active") return;
    const throwTotal = currentThrow.reduce((sum, dart) => sum + dart.value, 0);

    if (gameState.isShootout) {
      setGameState(prev => {
        const newState = { ...prev };
        newState.shootoutThrows.push({ player: prev.currentPlayer, darts: currentThrow.map(d => d.value), total: throwTotal });
        const player = `player${prev.currentPlayer}` as "player1" | "player2";
        newState[player] = {
          ...newState[player],
          score: newState[player].score + throwTotal,
          totalDarts: newState[player].totalDarts + currentThrow.length
        };
        
        const totalDartsThrown = newState.shootoutThrows.filter(t => t.player === 1).reduce((sum, t) => sum + t.darts.length, 0);
        if (totalDartsThrown >= 3) {
          newState.gameStatus = "finished";
          finishPlayerShootout();
        }
        return newState;
      });
    } else {
      // 501 Logic
      const newScore = currentPlayerData.score - throwTotal;
      const lastDart = currentThrow[currentThrow.length - 1];
      
      // Double Out Check: Must reach 0 exactly, and last dart must be a double (multiplier 2)
      // Exception: Bullseye (50) is considered a double for checkout.
      const isDoubleOut = lastDart.multiplier === 2 || lastDart.value === 50;
      const isBust = newScore < 0 || (newScore === 1) || (newScore === 0 && !isDoubleOut);

      setGameState(prev => {
        const newState = { ...prev };
        const player = `player${prev.currentPlayer}` as "player1" | "player2";

        if (isBust) {
          newState[player].totalDarts += currentThrow.length;
        } else {
          newState[player].score = newScore;
          newState[player].totalDarts += currentThrow.length;
          
          if (newScore === 0) {
            newState[player].legs += 1;
            if (newState[player].legs >= newState.legsToWin) {
              newState.gameStatus = "finished";
              newState.winner = prev.currentPlayer;
            } else {
              newState.player1.score = 501;
              newState.player2.score = 501;
              newState.currentLeg += 1;
              // Sync leg win
              if (currentGame?.id) {
                fetch('/api/game/leg-won', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gameId: currentGame.id,
                    winnerId: prev.currentPlayer === 1 ? currentGame.player1Id : currentGame.player2Id,
                    player1Legs: newState.player1.legs,
                    player2Legs: newState.player2.legs,
                    newLeg: newState.currentLeg
                  })
                }).catch(console.error);
              }
            }
          }
        }

        newState.throws.push({
          player: prev.currentPlayer,
          darts: currentThrow.map(d => d.value),
          total: throwTotal,
          remaining: isBust ? currentPlayerData.score : newScore,
          leg: prev.currentLeg
        });

        if (newState.gameStatus === "active") {
          newState.currentPlayer = prev.currentPlayer === 1 ? 2 : 1;
        }
        return newState;
      });

      // Sync throw to DB
      if (currentGame?.id) {
        try {
          await fetch('/api/game/throw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: currentGame.id,
              playerId: gameState.currentPlayer === 1 ? currentGame.player1Id : currentGame.player2Id,
              dart1: currentThrow[0]?.value || 0,
              dart2: currentThrow[1]?.value || 0,
              dart3: currentThrow[2]?.value || 0,
              score: isBust ? 0 : throwTotal
            })
          });
        } catch (error) {
          console.error('Error syncing throw:', error);
        }
      }
      
      // Sende WebSocket-Update an Display
      if (boardId && wsConnected) {
        sendGameUpdate({
          type: 'throw-update',
          boardId,
          gameData: {
            player1Score: gameState.player1.score - (gameState.currentPlayer === 1 ? throwTotal : 0),
            player2Score: gameState.player2.score - (gameState.currentPlayer === 2 ? throwTotal : 0),
            player1Legs: gameState.player1.legs,
            player2Legs: gameState.player2.legs,
            currentPlayer: gameState.currentPlayer,
            currentLeg: gameState.currentLeg
          },
          throw: {
            player: gameState.currentPlayer,
            darts: currentThrow.map(d => d.value),
            total: throwTotal,
            newScore: isBust ? currentPlayerData.score : newScore,
            isBust
          }
        });
        console.log('📤 WebSocket throw-update gesendet für Board:', boardId);
      }
    }

    setCurrentThrow([]);
    setSelectedNumber(null);
    clearCurrentThrowDisplay();
  };

  const undoLastThrow = () => {
    if (gameState.throws.length > 0) {
      const lastThrow = gameState.throws[gameState.throws.length - 1];
      setGameState(prev => {
        const newState = { ...prev };
        const player = `player${lastThrow.player}` as "player1" | "player2";
        const pointsToRestore = lastThrow.remaining === newState[player].score ? 0 : lastThrow.total;
        
        newState[player].score += pointsToRestore;
        newState[player].totalDarts = Math.max(0, newState[player].totalDarts - lastThrow.darts.length);
        newState.throws = newState.throws.slice(0, -1);
        newState.currentPlayer = lastThrow.player;
        return newState;
      });
    }
  };

  const resetGame = async () => {
    if (!currentGame?.id) return;
    try {
      await fetch('/api/game/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: currentGame.id })
      });
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Target className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium text-slate-700">Board wird geladen...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (boardError || !boardId) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Board nicht gefunden</h2>
              <p className="text-muted-foreground mb-4">
                Der Board-Code "{code}" ist ungültig oder das Board existiert nicht.
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Zurück zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-svh bg-background overflow-hidden flex flex-col font-sans">
      
      {/* Header-Container */}
      <div className="flex-none z-10">
        <ScoreEntryHeader
          boardId={boardId}
          gameState={gameState}
          onBackClick={() => router.push("/")}
          onUndoClick={undoLastThrow}
          onResetClick={() => setShowResetConfirm(true)}
          isConnected={isConnected}
          lastUpdateTime={lastUpdateTime}
        />
      </div>

      {/* Haupt-Container */}
      <div className="flex-1 overflow-hidden bg-slate-50/50">
        {/* Innerer Container */}
        <div className="w-full h-full p-2">
          
          {/* NEU: 3-Stufen-Grid
            - Mobile: 'grid-cols-1' (Alles untereinander)
            - iPad H: 'md:grid-cols-3' (Main nimmt 2 Spalten, Sidebar 1 Spalte)
            - iPad Q/Desktop: 'lg:grid-cols-3' (Gleiches Verhältnis, aber inneres Layout ändert sich)
          */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full pb-0">

            {/* --- HAUPTSPALTE (Input & Current Turn) ---
              NEU:
              - 'order-2 md:order-1': Auf Mobile unten (nach Stats), ab Tablet links/erste Stelle.
            */}
            <div className="md:col-span-2 lg:col-span-2 order-2 md:order-1 flex flex-col gap-2 overflow-y-auto h-full">
              
              {/* NEU: Inneres Grid für Main Content
                  - 'lg:grid-cols-2': Auf Desktop nebeneinander
                  - 'items-start': Damit sie nicht unnötig gestreckt werden, wenn unterschiedlich hoch
              */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:items-stretch lg:h-full h-full">
                <CurrentTurn
                  gameState={gameState}
                  currentThrow={currentThrow}
                  currentPlayerData={currentPlayerData}
                  onSubmitThrow={submitThrow}
                  onClearThrow={clearThrow}
                  className="flex flex-col h-full" 
                />
                <DartboardInput
                  dartboardNumbers={dartboardNumbers}
                  selectedNumber={selectedNumber}
                  onSetSelectedNumber={setSelectedNumber}
                  onAddDart={addDart}
                  currentThrowLength={currentThrow.length}
                  gameStatus={gameState.gameStatus}
                  className="flex flex-col h-full" 
                />
              </div>
            </div>

            {/* --- SEITENLEISTE (Stats & History) ---
              NEU:
              - 'order-1 md:order-2': Auf Mobile oben (vor Input), ab Tablet rechts/zweite Stelle.
            */}
            <div className="md:col-span-1 lg:col-span-1 order-1 md:order-2 flex flex-col gap-2 overflow-y-auto h-full">
              <PlayerOverview
                gameState={gameState}
                tournamentStatus={tournamentStatus}
              />
              <GameHistory 
                gameState={gameState} 
                // NEU: Versteckt auf Mobile und Tablet Portrait, sichtbar ab Large (Desktop/iPad Q)
                className="flex-1 hidden lg:flex"
              />
            </div>

          </div> 
        </div> 
      </div>

      {/* MODALS */}
      <MultiplierDialog
        selectedNumber={selectedNumber}
        onSetSelectedNumber={setSelectedNumber}
        onAddDart={addDart}
        currentThrowLength={currentThrow.length}
      />

      <ShootoutModals
        showShootoutPopup={showShootoutPopup}
        setShowShootoutPopup={setShowShootoutPopup}
        nextPlayerName={nextPlayerName}
        startSinglePlayerShootout={startSinglePlayerShootout}
        showStartShootoutPopup={showStartShootoutPopup}
        setShowStartShootoutPopup={setShowStartShootoutPopup}
        startThrowing={startThrowing}
        showWaitingPopup={showWaitingPopup}
        showNextPlayerReadyPopup={showNextPlayerReadyPopup}
        setShowNextPlayerReadyPopup={setShowNextPlayerReadyPopup}
        startNextPlayerShootout={startNextPlayerShootout}
        currentShootoutPlayer={currentShootoutPlayer}
        showGameStartPopup={showGameStartPopup}
        setShowGameStartPopup={setShowGameStartPopup}
        currentGame={currentGame}
        startAssignedGame={startAssignedGame}
      />

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <RefreshCw className="h-5 w-5" /> Spiel zurücksetzen?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Möchtest du das aktuelle Spiel wirklich zurücksetzen? Alle Würfe und Punkte werden gelöscht und das Spiel beginnt von vorne bei 501.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={resetGame}>
              Zurücksetzen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GameOverModal
        gameState={gameState}
        onBackClick={() => router.push("/")}
        onNewGameClick={() => window.location.reload()}
      />
    </div>
  );
}

// --- SUB-COMPONENTS (Ausgelagert für bessere Übersicht) ---

interface HeaderProps {
  boardId: string;
  gameState: GameState;
  onBackClick: () => void;
  onUndoClick: () => void;
  onResetClick: () => void;
  isConnected: boolean;
  lastUpdateTime: Date | null;
}

const ScoreEntryHeader: FC<HeaderProps> = ({ boardId, gameState, onBackClick, onUndoClick, onResetClick, isConnected, lastUpdateTime }) => (
  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 shadow-sm">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBackClick} className="h-9 w-9 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
           <h1 className="text-sm font-bold text-slate-900 leading-none">
             {gameState.isShootout ? "Shootout" : "Scheibe"} {boardId}
           </h1>
           <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? "Online" : "Offline"} />
        </div>
        <span className="text-[10px] text-slate-400 leading-none mt-0.5 font-medium">
            {isConnected ? 'Online' : 'Offline'} {lastUpdateTime && isConnected ? `• ${lastUpdateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
         </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
       {gameState.isShootout && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-5">SHOOTOUT</Badge>
        )}
      <div className="flex items-center bg-slate-100 rounded-lg px-2 py-1 h-8 border border-slate-200">
        <span className="text-xs font-semibold text-slate-600">Runde {gameState.currentLeg}</span>
      </div>
      <Button variant="outline" onClick={onUndoClick} disabled={gameState.throws.length === 0} size="icon" className="h-8 w-8 border-slate-200 text-slate-600 hover:bg-slate-50">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={onResetClick} size="icon" className="h-8 w-8 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

// Removed ConnectionStatusBadge component as it is now integrated into the header

interface PlayerOverviewProps {
  gameState: GameState;
  tournamentStatus: string;
}

const PlayerOverview: FC<PlayerOverviewProps> = ({ gameState, tournamentStatus }) => (
  <Card className="border-slate-200 shadow-sm bg-white">
    <CardHeader className="pb-2 border-b border-slate-50">
      <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Users className="h-4 w-4 text-slate-500" />
        Match Status
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-2">
      {/* 3-Stufen-Grid Anpassung */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2">
        {/* Player 1 */}
        <div className={`p-2 border rounded-xl transition-all duration-300 ${
          gameState.currentPlayer === 1
            ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20'
            : 'border-slate-100 bg-slate-50/50 opacity-60'
        }`}>
          <div className="flex justify-between items-start mb-1">
             <div className="text-sm font-medium text-slate-900 truncate max-w-[120px]" title={gameState.player1.name}>
               {gameState.player1.name}
             </div>
             {gameState.currentPlayer === 1 && (
               <div className="w-2 h-2 bg-blue-500 rounded-full" />
             )}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
            {gameState.player1.score}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">
            {gameState.isShootout ?
              `${gameState.shootoutThrows.filter(t => t.player === 1).length}/3 Darts` :
              `${gameState.player1.legs} Legs`
            }
          </div>
        </div>

        {/* Player 2 or Shootout Status */}
        {!gameState.isShootout ? (
          <div className={`p-2 border rounded-xl transition-all duration-300 ${
            gameState.currentPlayer === 2
              ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20'
              : 'border-slate-100 bg-slate-50/50 opacity-60'
          }`}>
            <div className="flex justify-between items-start mb-1">
               <div className="text-sm font-medium text-slate-900 truncate max-w-[120px]" title={gameState.player2.name}>
                 {gameState.player2.name}
               </div>
               {gameState.currentPlayer === 2 && (
                 <div className="w-2 h-2 bg-blue-500 rounded-full" />
               )}
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
              {gameState.player2.score}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">
              {gameState.player2.legs} Legs
            </div>
          </div>
        ) : (
          <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 md:col-span-2 lg:col-span-1">
            <div className="text-center space-y-1">
              <div className="text-sm font-medium text-slate-900">Shootout Modus</div>
              <div className="text-xs text-slate-500">
                Setzlisten-Ermittlung aktiv
              </div>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

interface CurrentTurnProps {
  gameState: GameState;
  currentThrow: ThrowDart[];
  currentPlayerData: GameState['player1'];
  onSubmitThrow: () => void;
  onClearThrow: () => void;
  className?: string;
}

const CurrentTurn: FC<CurrentTurnProps> = ({ gameState, currentThrow, currentPlayerData, onSubmitThrow, onClearThrow, className = '' }) => (
  <Card className={`${className} border-slate-200 shadow-sm bg-white`}>
    <CardHeader className="pb-1 border-b border-slate-50 px-3 py-2">
      <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Target className="h-4 w-4 text-slate-500" />
        Aktueller Wurf
      </CardTitle>
      <p className="text-xs text-slate-500">
        {gameState.isShootout ?
          `${gameState.player1.name} am Oche` :
          `${gameState.currentPlayer === 1 ? gameState.player1.name : gameState.player2.name} am Wurf`
        }
      </p>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col p-2 h-full">
      <div className="flex-1 flex flex-col justify-center space-y-4">
        
        {/* Darts Visualization */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-20 h-20 rounded-xl flex items-center justify-center border-2 text-3xl font-mono font-bold transition-all duration-200 ${
                currentThrow[i] !== undefined 
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105" 
                  : "border-slate-100 bg-slate-50 text-slate-300"
              }`}
            >
              {currentThrow[i] !== undefined ? currentThrow[i].value : (i + 1)}
            </div>
          ))}
        </div>

        <div className="space-y-1 text-center">
          <div className="text-4xl font-bold font-mono text-slate-900 tracking-tight">
            {currentThrow.length > 0 ? currentThrow.reduce((sum, dart) => sum + dart.value, 0) : 0}
          </div>
          <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">
            Gesamtpunkte
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 h-20 shrink-0">
        <Button
          onClick={onSubmitThrow}
          disabled={currentThrow.length !== 3 || gameState.gameStatus !== "active"}
          className="flex-1 h-full text-lg font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 active:scale-[0.98] transition-all touch-manipulation"
        >
          <CheckCircle className="mr-2 h-6 w-6" />
          Bestätigen
        </Button>
        <Button
          variant="outline"
          onClick={onClearThrow}
          disabled={currentThrow.length === 0}
          className="h-full w-20 rounded-xl border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-[0.98] transition-all touch-manipulation"
        >
          <Trash2 className="h-6 w-6" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

interface DartboardInputProps {
  dartboardNumbers: number[];
  selectedNumber: number | null;
  onSetSelectedNumber: (num: number | null) => void;
  onAddDart: (base: number, mult: 0 | 1 | 2 | 3) => void;
  currentThrowLength: number;
  gameStatus: "active" | "finished";
  className?: string;
}

const DartboardInput: FC<DartboardInputProps> = ({
  dartboardNumbers,
  selectedNumber,
  onSetSelectedNumber,
  onAddDart,
  currentThrowLength,
  gameStatus,
  className = ''
}) => (
  <Card className={`${className} border-slate-200 shadow-sm bg-white`}>
    <CardHeader className="pb-1 border-b border-slate-50 px-3 py-2">
      <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Target className="h-4 w-4 text-slate-500" />
        Eingabe
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col p-2 h-full">
      <div className="flex-1 grid grid-cols-5 gap-1 mb-2">
          {dartboardNumbers.map((number) => (
            <Button
              key={number}
              variant={selectedNumber === number ? "default" : "outline"}
              className={`w-full h-full p-0 font-bold text-xl rounded-lg transition-all duration-150 touch-manipulation ${
                selectedNumber === number 
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => onSetSelectedNumber(number)}
              disabled={currentThrowLength >= 3 || gameStatus !== "active"}
            >
              {number}
            </Button>
          ))}
      </div>

      {/* Bulls Row & Miss */}
      <div className="flex gap-2 h-16 shrink-0">
        <Button
          className="flex-1 h-full font-bold text-xl rounded-lg touch-manipulation transition-all bg-slate-100 text-slate-500 hover:bg-slate-200 border-2 border-slate-200"
          onClick={() => onAddDart(0, 0)}
          disabled={currentThrowLength >= 3 || gameStatus !== "active"}
        >
          MISS
        </Button>
        <Button
          className={`flex-1 h-full font-bold text-xl rounded-lg touch-manipulation transition-all ${
             selectedNumber === 25 
               ? "bg-green-600 text-white ring-2 ring-green-600 ring-offset-2" 
               : "bg-white border-2 border-green-500 text-green-600 hover:bg-green-50"
          }`}
          onClick={() => onSetSelectedNumber(25)}
          disabled={currentThrowLength >= 3 || gameStatus !== "active"}
        >
          25
        </Button>
        <Button
          className="flex-1 h-full font-bold text-xl rounded-lg touch-manipulation transition-all bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 hover:shadow-sm active:scale-95"
          onClick={() => onAddDart(50, 1)}
          disabled={currentThrowLength >= 3 || gameStatus !== "active"}
        >
          BULL
        </Button>
      </div>
    </CardContent>
  </Card>
);

interface GameHistoryProps {
  gameState: GameState;
  className?: string;
}

const GameHistory: FC<GameHistoryProps> = ({ gameState, className = '' }) => {
  if (gameState.isShootout) return null;

  return (
    <div className={`hidden lg:flex ${className}`}>
      <Card className="flex-1 flex flex-col border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-50">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Activity className="h-4 w-4 text-slate-500" />
            Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden pt-0">
          <div className="h-full overflow-y-auto pt-4 space-y-2 pr-1 custom-scrollbar">
            {gameState.throws.slice(-10).reverse().map((throw_, index) => (
              <div key={gameState.throws.length - index - 1} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-xs w-6">
                    #{gameState.throws.length - index}
                  </span>
                  <span className="font-medium text-slate-900 truncate max-w-[100px]">
                    {throw_.player === 1 ? gameState.player1.name : gameState.player2.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {throw_.total}
                  </span>
                  <span className="text-slate-400 font-mono w-12 text-right">
                    {throw_.remaining}
                  </span>
                </div>
              </div>
            ))}
            {gameState.throws.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Target className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Noch keine Würfe</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MultiplierDialogProps {
  selectedNumber: number | null;
  onSetSelectedNumber: (num: number | null) => void;
  onAddDart: (base: number, mult: 0 | 1 | 2 | 3) => void;
  currentThrowLength: number;
}

const MultiplierDialog: FC<MultiplierDialogProps> = ({ selectedNumber, onSetSelectedNumber, onAddDart, currentThrowLength }) => (
  <Dialog open={selectedNumber !== null} onOpenChange={() => onSetSelectedNumber(null)}>
    <DialogContent className="sm:max-w-md bg-white rounded-2xl border-slate-200 shadow-xl">
      <DialogHeader className="text-center pb-2">
        <div className="mx-auto mb-3 w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
          <span className="text-4xl font-bold text-white">{selectedNumber}</span>
        </div>
        <DialogTitle className="text-2xl font-bold text-slate-900">
          Wähle den Multiplikator
        </DialogTitle>
        <p className="text-sm text-slate-500 pt-1">Tippe auf die gewünschte Option</p>
      </DialogHeader>
      
      <div className="grid grid-cols-1 gap-3 py-6">
        {selectedNumber === 25 ? (
          <>
            <Button
              className="h-16 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] touch-manipulation"
              onClick={() => {
                onAddDart(selectedNumber!, 1);
                onSetSelectedNumber(null);
              }}
              disabled={currentThrowLength >= 3}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>Single Bull</span>
                <span className="text-2xl font-bold">25</span>
              </div>
            </Button>
            <Button
              className="h-16 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] touch-manipulation"
              onClick={() => {
                onAddDart(50, 1);
                onSetSelectedNumber(null);
              }}
              disabled={currentThrowLength >= 3}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>Bullseye</span>
                <span className="text-2xl font-bold">50</span>
              </div>
            </Button>
          </>
        ) : (
          <>
            <Button
              className="h-16 text-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-200 rounded-xl transition-all active:scale-[0.98] touch-manipulation"
              onClick={() => {
                onAddDart(selectedNumber!, 1);
                onSetSelectedNumber(null);
              }}
              disabled={currentThrowLength >= 3}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>Single</span>
                <span className="text-2xl font-bold font-mono">{selectedNumber}</span>
              </div>
            </Button>
            <Button
              className="h-16 text-lg font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] touch-manipulation"
              onClick={() => {
                onAddDart(selectedNumber!, 2);
                onSetSelectedNumber(null);
              }}
              disabled={currentThrowLength >= 3}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>Double</span>
                <span className="text-2xl font-bold font-mono">{selectedNumber! * 2}</span>
              </div>
            </Button>
            <Button
              className="h-16 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] touch-manipulation"
              onClick={() => {
                onAddDart(selectedNumber!, 3);
                onSetSelectedNumber(null);
              }}
              disabled={currentThrowLength >= 3}
            >
              <div className="flex items-center justify-between w-full px-2">
                <span>Triple</span>
                <span className="text-2xl font-bold font-mono">{selectedNumber! * 3}</span>
              </div>
            </Button>
          </>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        onClick={() => onSetSelectedNumber(null)} 
        className="w-full h-12 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl font-medium"
      >
        Abbrechen
      </Button>
    </DialogContent>
  </Dialog>
);

interface ShootoutModalsProps {
  showShootoutPopup: boolean;
  setShowShootoutPopup: (show: boolean) => void;
  nextPlayerName: string;
  startSinglePlayerShootout: (name: string) => void;
  showStartShootoutPopup: boolean;
  setShowStartShootoutPopup: (show: boolean) => void;
  startThrowing: () => void;
  showWaitingPopup: boolean;
  showNextPlayerReadyPopup: boolean;
  setShowNextPlayerReadyPopup: (show: boolean) => void;
  startNextPlayerShootout: (name: string, id: string) => void;
  currentShootoutPlayer: string;
  showGameStartPopup?: boolean;
  setShowGameStartPopup?: (show: boolean) => void;
  currentGame?: any;
  startAssignedGame?: () => void;
}

const ShootoutModals: FC<ShootoutModalsProps> = ({
  showShootoutPopup, setShowShootoutPopup, nextPlayerName, startSinglePlayerShootout,
  showStartShootoutPopup, setShowStartShootoutPopup, startThrowing,
  showWaitingPopup, showNextPlayerReadyPopup, setShowNextPlayerReadyPopup, startNextPlayerShootout, currentShootoutPlayer,
  showGameStartPopup, setShowGameStartPopup, currentGame, startAssignedGame
}) => (
  <>
    {/* Shootout Popup */}
    <Dialog open={showShootoutPopup} onOpenChange={setShowShootoutPopup}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" /> Shootout starten
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-slate-900 mb-2">{nextPlayerName}</div>
          <p className="text-slate-500 mb-6">Ist an der Reihe für 3 Darts.</p>
          <Button onClick={() => startSinglePlayerShootout(nextPlayerName)} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            Starten
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Game Start Popup */}
    <Dialog open={showGameStartPopup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Play className="h-5 w-5 text-green-600" /> Neues Spiel
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-4 text-2xl font-bold text-slate-900 mb-2">
             <span>{currentGame?.player1}</span>
             <span className="text-slate-300 text-lg">vs</span>
             <span>{currentGame?.player2}</span>
          </div>
          <p className="text-slate-500 mb-8 text-sm">Best of {currentGame?.legsToWin || 3} Legs</p>
          <Button onClick={startAssignedGame} className="w-full h-14 rounded-xl bg-slate-900 text-white text-lg">
            Match Starten
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Other Modals (Waiting, Start, Next) kept simple for brevity but using same style */}
    <Dialog open={showWaitingPopup && !showShootoutPopup && !showNextPlayerReadyPopup && !showStartShootoutPopup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Warte auf nächsten Spieler...</h3>
          <p className="text-slate-500 text-sm mt-2">Die Turnierleitung weist den nächsten Spieler zu.</p>
        </div>
      </DialogContent>
    </Dialog>
  </>
);

interface GameOverModalProps {
  gameState: GameState;
  onBackClick: () => void;
  onNewGameClick: () => void;
}

const GameOverModal: FC<GameOverModalProps> = ({ gameState, onBackClick, onNewGameClick }) => {
  if (gameState.gameStatus !== "finished") return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
           <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
           <h2 className="text-3xl font-bold text-white mb-1">Game Shot!</h2>
           <p className="text-slate-400 text-sm">Das Spiel ist beendet.</p>
        </div>
        <CardContent className="p-8 text-center">
          <div className="mb-8">
             <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Gewinner</div>
             <div className="text-4xl font-bold text-slate-900">
               {gameState.winner === 1 ? gameState.player1.name : gameState.player2.name}
             </div>
             <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                {gameState.player1.legs} : {gameState.player2.legs}
             </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBackClick} className="flex-1 h-12 rounded-xl border-slate-200">
              Zurück
            </Button>
            <Button onClick={onNewGameClick} className="flex-1 h-12 rounded-xl bg-slate-900 text-white">
              Neues Spiel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};