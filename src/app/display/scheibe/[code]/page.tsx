"use client";

import { useState, useEffect, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Wifi, WifiOff, Activity } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

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
  throws: Array<any>;
  gameStatus: "waiting" | "active" | "finished";
  winner?: 1 | 2;
  isShootout?: boolean;
  isPractice?: boolean;
}

/* ================= COMPONENTS ================= */

// Hintergrund-Grid wie auf den anderen Seiten
function BackgroundGrid() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]" />
    </div>
  );
}

// Score Number mit Animation bei Änderung
function AnimatedScore({ value, active }: { value: number; active: boolean }) {
  return (
    <motion.div
      key={value}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "font-mono font-bold tracking-tighter tabular-nums leading-none transition-colors duration-500",
        active ? "text-slate-900" : "text-slate-300"
      )}
      style={{ fontSize: "clamp(6rem, 20vw, 14rem)" }}
    >
      {value}
    </motion.div>
  );
}

/* ================= MAIN PAGE ================= */

export default function DisplayBoard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [logos, setLogos] = useState<{ mainLogo: string; sponsorLogos: string[] }>({
    mainLogo: '',
    sponsorLogos: []
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const isPracticeRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    if (gameState?.isPractice) {
        isPracticeRef.current = true;
    } else if (gameState && !gameState.isPractice) {
        isPracticeRef.current = false;
    }
  }, [gameState]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Connection Status für UI-Feedback
  const { isConnected, sendMessage } = useWebSocket({
    url: typeof window !== 'undefined' 
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'ws://localhost:3001'
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`)
      : 'ws://localhost:3001',
    onMessage: (data) => {
      // Prüfe ob die Nachricht für dieses Board ist
      if (data.boardId && data.boardId !== boardId) {
        console.log('⚠️ Display: Nachricht für anderes Board ignoriert:', data.boardId);
        return;
      }

      if (data.type === 'throw-update' && data.gameData) {
        // SPECIAL CASE: Practice Mode Init or Reset
        // We use 'throw-update' with 'isPractice' flag to bypass server whitelist
        if (data.isPractice && data.practiceConfig) {
             console.log('🎮 Display: Practice Update received', data.practiceConfig);
             setGameState({
                player1: { 
                    name: data.practiceConfig.player1Name || "Spieler 1", 
                    score: data.gameData.player1Score, 
                    legs: data.gameData.player1Legs, 
                    totalDarts: 0, 
                    average: 0 
                },
                player2: { 
                    name: data.practiceConfig.player2Name || "Spieler 2", 
                    score: data.gameData.player2Score, 
                    legs: data.gameData.player2Legs, 
                    totalDarts: 0, 
                    average: 0 
                },
                currentPlayer: data.gameData.currentPlayer,
                currentLeg: data.gameData.currentLeg,
                legsToWin: data.practiceConfig.legsToWin || 3,
                throws: [],
                gameStatus: 'active',
                isPractice: true
             });
             return; // Skip standard logic
        }

        // Standard Logic: Wenn ein neues Leg beginnt (Score 501), erzwinge einen Refresh vom Server
        // um sicherzustellen, dass alles synchron ist
        if (!isPracticeRef.current && 
           data.gameData.player1Score === 501 && data.gameData.player2Score === 501 && 
           (data.gameData.player1Legs > 0 || data.gameData.player2Legs > 0)) {
            setRefreshTrigger(prev => prev + 1);
        }

        // Aktualisiere Game State direkt aus WebSocket-Daten
        setGameState(prev => {
          // Auch wenn wir bisher keinen State hatten ("Practice Mode"), übernehmen wir die Daten
          const currentState = prev || {
              player1: { name: 'Player 1', score: 501, legs: 0, totalDarts: 0, average: 0 },
              player2: { name: 'Player 2', score: 501, legs: 0, totalDarts: 0, average: 0 },
              currentPlayer: 1,
              currentLeg: 1,
              legsToWin: 3,
              throws: [],
              gameStatus: 'active'
          };

          return {
            ...currentState,
            player1: {
              ...currentState.player1,
              score: data.gameData.player1Score,
              legs: data.gameData.player1Legs
            },
            player2: {
              ...currentState.player2,
              score: data.gameData.player2Score,
              legs: data.gameData.player2Legs
            },
            currentPlayer: data.gameData.currentPlayer,
            currentLeg: data.gameData.currentLeg
          };
        });
        console.log('🎯 Display: Live-Update empfangen - Spieler:', data.gameData.currentPlayer);
      } else if (data.type === 'game-update' || data.type === 'game-reset' || data.type === 'game-assigned') {
        // Für andere Updates: Trigger API refresh
        setRefreshTrigger(prev => prev + 1);
      }
    },
    onConnect: () => {
      // Subscribe to this board when connected
      if (boardId) {
        sendMessage({ type: 'subscribe', boardId });
      }
    }
  });

  // Subscribe to board updates when boardId changes
  useEffect(() => {
    if (boardId && isConnected) {
      sendMessage({ type: 'subscribe', boardId });
    }
  }, [boardId, isConnected, sendMessage]);

  // 1. Resolve Board
  useEffect(() => {
    const resolveBoardCode = async () => {
      try {
        const response = await fetch(`/api/board/${code}`);
        if (!response.ok) throw new Error('Board not found');
        const board = await response.json();
        setBoardId(board.id);
        setTournamentId(board.tournamentId);
      } catch (err) {
        setError('Ungültiger Board-Code');
      } finally {
        setLoading(false);
      }
    };
    resolveBoardCode();
  }, [code]);

  // 2. Fetch Game State
  useEffect(() => {
    if (!boardId) return;
    
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/board/${code}/game`);
        if (!response.ok) return;
        
        const data = await response.json();
        const game = data.game;

        if (game) {
          setGameState({
            player1: {
              name: game.player1Name || "Spieler 1",
              score: game.player1Score ?? 501,
              legs: game.player1Legs || 0,
              totalDarts: 0,
              average: 0
            },
            player2: {
              name: game.player2Name || "Spieler 2",
              score: game.player2Score ?? 501,
              legs: game.player2Legs || 0,
              totalDarts: 0,
              average: 0
            },
            currentPlayer: game.currentPlayer || 1,
            currentLeg: game.currentLeg || 1,
            legsToWin: game.legsToWin || 2,
            throws: [],
            gameStatus: game.status === 'ACTIVE' ? 'active' : game.status === 'FINISHED' ? 'finished' : 'waiting',
            winner: game.winner ? (game.winner === game.player1Name ? 1 : 2) : undefined,
          });
        } else {
          setGameState({
            player1: { name: "Spieler 1", score: 501, legs: 0, totalDarts: 0, average: 0 },
            player2: { name: "Spieler 2", score: 501, legs: 0, totalDarts: 0, average: 0 },
            currentPlayer: 1, currentLeg: 1, legsToWin: 2, throws: [], gameStatus: "waiting"
          });
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchGameState();
  }, [boardId, code, refreshTrigger]);

  // 3. Load Logos
  useEffect(() => {
    if (!tournamentId) return;
    fetch('/api/admin/tournament/settings')
      .then(res => res.ok ? res.json() : null)
      .then(settings => {
        if (settings) setLogos({ mainLogo: settings.mainLogo || '', sponsorLogos: settings.sponsorLogos || [] });
      });
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4" />
        <p className="text-slate-500 animate-pulse">Verbinde mit Board...</p>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md text-center p-8 border-slate-200 shadow-xl">
          <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Kein Signal</h2>
          <p className="text-slate-500 mt-2">{error || "Warte auf Spieldaten..."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans selection:bg-blue-100">
      <BackgroundGrid />

      {/* --- HEADER --- */}
      <header className="absolute top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          {logos.mainLogo ? (
            <img src={logos.mainLogo} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-lg">Darts Masters</span>
            </div>
          )}
        </div>

        {/* Game Meta Info */}
        {gameState.gameStatus === 'active' && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-8 px-4 bg-white/50 backdrop-blur border-slate-200 text-slate-600 font-mono">
              LEG {gameState.currentLeg}
            </Badge>
            <Badge variant="secondary" className="h-8 px-4 bg-slate-100 text-slate-900 font-medium">
              Best of {gameState.legsToWin}
            </Badge>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
              <Wifi className="h-3 w-3" /> LIVE
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
              <WifiOff className="h-3 w-3" /> OFFLINE
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="h-full w-full relative z-10 pt-20 pb-12 px-4 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STATE: WAITING */}
          {gameState.gameStatus === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4 ring-1 ring-slate-100">
                  <Activity className="h-8 w-8 text-slate-400 animate-pulse" />
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                  Warte auf Match...
                </h1>
                <p className="text-xl text-slate-500">Das Board ist bereit. Spieler bitte anmelden.</p>
              </div>

              {/* Display Main Sponsor/Event Logo specifically requested */}
              {logos.mainLogo && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="py-8"
                >
                  <img 
                    src={logos.mainLogo} 
                    alt="Event Logo" 
                    className="h-40 md:h-56 w-auto mx-auto object-contain drop-shadow-lg"
                  />
                </motion.div>
              )}

              {logos.sponsorLogos.length > 0 && (
                <div className="w-full max-w-4xl border-t border-slate-100 pt-12">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">Sponsored by</p>
                  <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    {logos.sponsorLogos.map((url, i) => (
                      <img key={i} src={url} className="h-12 w-auto object-contain" alt="Sponsor" />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STATE: ACTIVE GAME (Split Screen) */}
          {gameState.gameStatus === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 grid grid-cols-2 gap-px bg-slate-200/50 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50"
            >
              {/* Player 1 Area */}
              <div className={cn(
                "relative flex flex-col items-center justify-center p-8 transition-all duration-500",
                gameState.currentPlayer === 1 ? "bg-white" : "bg-slate-50/50"
              )}>
                {gameState.currentPlayer === 1 && (
                  <motion.div layoutId="active-indicator" className="absolute top-0 inset-x-0 h-1.5 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                )}
                
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold tracking-tight text-center max-w-lg break-words",
                    gameState.currentPlayer === 1 ? "text-slate-900" : "text-slate-400"
                  )}>
                    {gameState.player1.name}
                  </h2>
                  
                  <AnimatedScore value={gameState.player1.score} active={gameState.currentPlayer === 1} />
                </div>

                <div className="w-full mt-auto pt-8 border-t border-slate-100/50 flex justify-between items-center px-4">
                   <div className="flex gap-2">
                      {[...Array(gameState.legsToWin)].map((_, i) => (
                        <div key={i} className={cn(
                          "h-4 w-4 rounded-full border transition-colors",
                          i < gameState.player1.legs 
                            ? "bg-slate-900 border-slate-900" 
                            : "bg-transparent border-slate-300"
                        )} />
                      ))}
                   </div>
                   <div className="text-slate-400 font-mono text-xl">{gameState.player1.legs} LEGS</div>
                </div>
              </div>

              {/* Player 2 Area */}
              <div className={cn(
                "relative flex flex-col items-center justify-center p-8 transition-all duration-500",
                gameState.currentPlayer === 2 ? "bg-white" : "bg-slate-50/50"
              )}>
                {gameState.currentPlayer === 2 && (
                  <motion.div layoutId="active-indicator" className="absolute top-0 inset-x-0 h-1.5 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                )}

                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                  <h2 className={cn(
                    "text-3xl md:text-5xl font-bold tracking-tight text-center max-w-lg break-words",
                    gameState.currentPlayer === 2 ? "text-slate-900" : "text-slate-400"
                  )}>
                    {gameState.player2.name}
                  </h2>
                  
                  <AnimatedScore value={gameState.player2.score} active={gameState.currentPlayer === 2} />
                </div>

                <div className="w-full mt-auto pt-8 border-t border-slate-100/50 flex justify-between items-center px-4">
                   <div className="text-slate-400 font-mono text-xl">{gameState.player2.legs} LEGS</div>
                   <div className="flex gap-2">
                      {[...Array(gameState.legsToWin)].map((_, i) => (
                        <div key={i} className={cn(
                          "h-4 w-4 rounded-full border transition-colors",
                          i < gameState.player2.legs 
                            ? "bg-slate-900 border-slate-900" 
                            : "bg-transparent border-slate-300"
                        )} />
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE: FINISHED */}
          {gameState.gameStatus === "finished" && gameState.winner && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <Card className="max-w-2xl w-full border-slate-200 shadow-2xl bg-white overflow-hidden">
                <div className="bg-slate-900 text-white p-12 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
                   <Trophy className="h-24 w-24 mx-auto text-yellow-400 mb-6 drop-shadow-lg" />
                   <h2 className="text-6xl font-bold tracking-tight mb-2">WINNER</h2>
                   <p className="text-2xl text-slate-300 font-light">Game Shot & The Match</p>
                </div>
                <CardContent className="p-12 text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-6">
                    {gameState.winner === 1 ? gameState.player1.name : gameState.player2.name}
                  </div>
                  <div className="text-2xl text-slate-500 font-mono bg-slate-50 py-4 rounded-xl border border-slate-100">
                    {gameState.player1.legs} : {gameState.player2.legs}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- FOOTER --- */}
      <footer className="absolute bottom-4 left-0 right-0 text-center z-20">
        <p className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">
          Softwareentwicklung Cedric Geißdörfer
        </p>
      </footer>
    </div>
  );
}