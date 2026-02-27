"use client";

import { useState, useEffect, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Target, ArrowLeft, RotateCcw, Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TestspielPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [boardId, setBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidatedToken, setHasValidatedToken] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const checkInactivity = () => {
    const now = Date.now();
    if (now - lastActivityRef.current > 5 * 60 * 1000) {
      setError("Sitzung wegen Inaktivität (5 Minuten) abgelaufen. Bitte scanne den QR-Code auf dem Display erneut.");
      return true;
    }
    lastActivityRef.current = now;
    return false;
  };

  const [step, setStep] = useState<"setup" | "game">("setup");
  const [player1Name, setPlayer1Name] = useState("Spieler 1");
  const [player2Name, setPlayer2Name] = useState("Spieler 2");
  const [legsToWin, setLegsToWin] = useState(2);

  const [gameState, setGameState] = useState({
    player1Score: 501,
    player2Score: 501,
    player1Legs: 0,
    player2Legs: 0,
    currentPlayer: 1 as 1 | 2,
    currentLeg: 1,
  });

  const [currentInput, setCurrentInput] = useState("");
  const [showMultiplierPopup, setShowMultiplierPopup] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const { isConnected, sendMessage } = useWebSocket({
    url: typeof window !== 'undefined' 
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'ws://localhost:3001'
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`)
      : 'ws://localhost:3001',
    onMessage: (data) => {
      // If an official game starts, we should probably kick the user out or show a message
      if (data.boardId === boardId && data.type === 'game-assigned') {
        setError("Ein offizielles Spiel wurde auf diesem Board gestartet.");
        setStep("setup");
      }
    }
  });

  useEffect(() => {
    if (hasValidatedToken) return;

    const resolveBoardCode = async () => {
      try {
        const t = searchParams.get('t');
        if (!t) {
          setError('Ungültiger oder abgelaufener QR-Code. Bitte scanne den Code auf dem Display erneut.');
          setLoading(false);
          return;
        }

        const tokenTime = parseInt(t, 10);
        const now = Date.now();
        // Token is valid for 65 seconds (60s rotation + 5s grace period)
        if (isNaN(tokenTime) || now - tokenTime > 65000) {
          setError('Der QR-Code ist abgelaufen. Bitte scanne den Code auf dem Display erneut.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/board/${code}`);
        if (!response.ok) throw new Error('Board not found');
        const board = await response.json();
        setBoardId(board.id);
        setHasValidatedToken(true);
        lastActivityRef.current = Date.now();
      } catch (err) {
        setError('Ungültiger Board-Code');
      } finally {
        setLoading(false);
      }
    };
    resolveBoardCode();
  }, [code, searchParams, hasValidatedToken]);

  const startGame = () => {
    if (checkInactivity()) return;
    if (!boardId) return;
    
    const initialGameState = {
      player1Score: 501,
      player2Score: 501,
      player1Legs: 0,
      player2Legs: 0,
      currentPlayer: 1 as 1 | 2,
      currentLeg: 1,
    };
    
    setGameState(initialGameState);
    setStep("game");

    sendMessage({
      type: 'throw-update',
      boardId,
      isPractice: true,
      practiceConfig: {
        player1Name,
        player2Name,
        legsToWin
      },
      gameData: initialGameState
    });
  };

  const handleNumberClick = (num: string) => {
    if (checkInactivity()) return;
    const parsedNum = parseInt(num);
    if (parsedNum >= 1 && parsedNum <= 20) {
      setSelectedNumber(parsedNum);
      setShowMultiplierPopup(true);
    } else if (num === "25") {
      setSelectedNumber(25);
      setShowMultiplierPopup(true);
    } else if (num === "0") {
      addScoreToInput(0);
    }
  };

  const addScoreToInput = (score: number) => {
    if (currentInput.length < 3) {
      const currentTotal = currentInput ? parseInt(currentInput) : 0;
      const newTotal = currentTotal + score;
      if (newTotal <= 180) {
        setCurrentInput(newTotal.toString());
      }
    }
    setShowMultiplierPopup(false);
    setSelectedNumber(null);
  };

  const handleMultiplierSelect = (multiplier: number) => {
    if (checkInactivity()) return;
    if (selectedNumber !== null) {
      addScoreToInput(selectedNumber * multiplier);
    }
  };

  const handleBackspace = () => {
    if (checkInactivity()) return;
    setCurrentInput("");
  };

  const submitScore = () => {
    if (checkInactivity()) return;
    if (!currentInput) return;
    const score = parseInt(currentInput);
    if (isNaN(score) || score > 180) return;

    let newState = { ...gameState };
    let isBust = false;
    let legWon = false;

    if (newState.currentPlayer === 1) {
      const newScore = newState.player1Score - score;
      if (newScore < 0 || newScore === 1) {
        isBust = true;
      } else if (newScore === 0) {
        legWon = true;
        newState.player1Legs += 1;
      } else {
        newState.player1Score = newScore;
      }
    } else {
      const newScore = newState.player2Score - score;
      if (newScore < 0 || newScore === 1) {
        isBust = true;
      } else if (newScore === 0) {
        legWon = true;
        newState.player2Legs += 1;
      } else {
        newState.player2Score = newScore;
      }
    }

    if (legWon) {
      // Check match win
      if (newState.player1Legs >= legsToWin || newState.player2Legs >= legsToWin) {
        alert(`${newState.player1Legs >= legsToWin ? player1Name : player2Name} hat das Spiel gewonnen!`);
        setStep("setup");
        // Reset display to waiting state? Or just leave it?
        // We can send a game-reset to clear the display
        sendMessage({
          type: 'game-reset',
          boardId
        });
        return;
      } else {
        // Next leg
        newState.player1Score = 501;
        newState.player2Score = 501;
        newState.currentLeg += 1;
        // Loser of leg starts next leg (simple rule, or alternate)
        // Let's just alternate based on leg number
        newState.currentPlayer = newState.currentLeg % 2 === 0 ? 2 : 1;
      }
    } else {
      // Switch player
      newState.currentPlayer = newState.currentPlayer === 1 ? 2 : 1;
    }

    setGameState(newState);
    setCurrentInput("");

    sendMessage({
      type: 'throw-update',
      boardId,
      isPractice: true,
      gameData: newState
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Lade...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button className="w-full" onClick={() => router.push('/')}>Zurück zur Startseite</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 overflow-hidden">
      <header className="bg-white border-b border-slate-200 h-14 md:h-16 flex items-center justify-between px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2 font-bold text-base md:text-lg tracking-tight">
          <div className="h-7 w-7 md:h-8 md:w-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          Testspiel
        </div>
        <div className="text-[10px] md:text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 md:px-3 md:py-1.5 rounded-md border border-slate-200 font-medium">
          Board: {code}
        </div>
      </header>

      <main className="flex-1 p-3 md:p-4 flex flex-col max-w-md mx-auto w-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "setup" ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 md:space-y-6 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mt-2 md:mt-4 overflow-y-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Spieler Setup</h2>
                <p className="text-sm text-slate-500 mt-1">Wer tritt ans Oche?</p>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Spieler 1</Label>
                  <Input value={player1Name} onChange={e => setPlayer1Name(e.target.value)} className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Spieler 2</Label>
                  <Input value={player2Name} onChange={e => setPlayer2Name(e.target.value)} className="h-12 text-lg bg-slate-50 border-slate-200 focus-visible:ring-slate-900" />
                </div>
                <div className="space-y-3 pt-2">
                  <Label className="text-slate-700 font-semibold">Legs to Win (Best of {legsToWin * 2 - 1})</Label>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Button variant="outline" className="h-10 w-10 rounded-lg border-slate-200 bg-white" onClick={() => setLegsToWin(Math.max(1, legsToWin - 1))}>-</Button>
                    <span className="text-2xl font-black tabular-nums">{legsToWin}</span>
                    <Button variant="outline" className="h-10 w-10 rounded-lg border-slate-200 bg-white" onClick={() => setLegsToWin(Math.min(2, legsToWin + 1))}>+</Button>
                  </div>
                  <p className="text-xs text-slate-500 text-center">Maximal Best of 3 (2 Legs to win) im Testspiel.</p>
                </div>
              </div>

              <Button 
                onClick={startGame} 
                disabled={!isConnected}
                className="w-full h-14 text-lg font-bold mt-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                Spiel Starten
              </Button>
              {!isConnected && <p className="text-center text-sm text-red-500 mt-2 font-medium">Verbinde zum Server...</p>}
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col h-full"
            >
              {/* Scoreboard */}
              <div className="grid grid-cols-2 gap-1.5 mb-1.5 mt-0.5 md:gap-3 md:mb-4 md:mt-2 shrink-0">
                <Card className={cn(
                  "p-1.5 md:p-4 text-center transition-all duration-300 border-2 rounded-xl md:rounded-2xl",
                  gameState.currentPlayer === 1 
                    ? "bg-white border-slate-900 shadow-md scale-[1.02]" 
                    : "bg-slate-50 border-transparent opacity-60 scale-95"
                )}>
                  <div className="font-semibold truncate text-slate-700 text-[10px] md:text-base leading-tight">{player1Name}</div>
                  <div className={cn("text-2xl md:text-5xl font-bold my-0 md:my-2 tabular-nums tracking-tighter leading-none", gameState.currentPlayer === 1 ? "text-slate-900" : "text-slate-400")}>
                    {gameState.player1Score}
                  </div>
                  <div className="text-[8px] md:text-xs font-mono font-medium text-slate-500 bg-slate-100 inline-block px-1 py-0.5 md:px-2 md:py-1 rounded-md mt-0.5">
                    LEGS: {gameState.player1Legs}
                  </div>
                </Card>
                <Card className={cn(
                  "p-1.5 md:p-4 text-center transition-all duration-300 border-2 rounded-xl md:rounded-2xl",
                  gameState.currentPlayer === 2 
                    ? "bg-white border-slate-900 shadow-md scale-[1.02]" 
                    : "bg-slate-50 border-transparent opacity-60 scale-95"
                )}>
                  <div className="font-semibold truncate text-slate-700 text-[10px] md:text-base leading-tight">{player2Name}</div>
                  <div className={cn("text-2xl md:text-5xl font-bold my-0 md:my-2 tabular-nums tracking-tighter leading-none", gameState.currentPlayer === 2 ? "text-slate-900" : "text-slate-400")}>
                    {gameState.player2Score}
                  </div>
                  <div className="text-[8px] md:text-xs font-mono font-medium text-slate-500 bg-slate-100 inline-block px-1 py-0.5 md:px-2 md:py-1 rounded-md mt-0.5">
                    LEGS: {gameState.player2Legs}
                  </div>
                </Card>
              </div>

              {/* Input Display */}
              <div className="bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl h-10 md:h-20 flex items-center justify-center text-2xl md:text-5xl font-bold mb-1.5 md:mb-4 shadow-sm tabular-nums tracking-tighter text-slate-900 shrink-0">
                {currentInput || "0"}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-1 md:gap-2 flex-1 min-h-0">
                {[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 25].map(num => (
                  <Button 
                    key={num} 
                    variant="outline" 
                    className="h-full text-base md:text-2xl font-semibold bg-white hover:bg-slate-50 border-slate-200 rounded-lg md:rounded-xl text-slate-700 p-0"
                    onClick={() => handleNumberClick(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  className="h-full text-base md:text-2xl font-semibold bg-white hover:bg-slate-50 border-slate-200 rounded-lg md:rounded-xl text-slate-700 p-0"
                  onClick={() => handleNumberClick("0")}
                >
                  0
                </Button>
                <Button 
                  variant="outline" 
                  className="h-full text-base md:text-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 rounded-lg md:rounded-xl p-0"
                  onClick={handleBackspace}
                >
                  <RotateCcw className="h-4 w-4 md:h-6 md:w-6" />
                </Button>
                <Button 
                  className="h-full text-base md:text-xl font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg md:rounded-xl shadow-md p-0"
                  onClick={submitScore}
                >
                  <Check className="h-5 w-5 md:h-10 md:w-10" />
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="mt-1 md:mt-4 text-slate-400 hover:text-slate-600 font-medium shrink-0 h-8 md:h-10 text-xs md:text-sm"
                onClick={() => {
                  if(confirm("Spiel wirklich abbrechen?")) {
                    setStep("setup");
                    sendMessage({ type: 'game-reset', boardId });
                  }
                }}
              >
                Spiel abbrechen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiplier Popup */}
        <AnimatePresence>
          {showMultiplierPopup && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 rounded-3xl"
                onClick={() => setShowMultiplierPopup(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-8 left-4 right-4 bg-white p-6 rounded-3xl shadow-2xl z-50 border border-slate-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Faktor für <span className="text-2xl font-bold ml-2">{selectedNumber}</span>
                  </h3>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setShowMultiplierPopup(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    className="h-16 md:h-20 text-lg md:text-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-transparent rounded-2xl"
                    onClick={() => handleMultiplierSelect(1)}
                  >
                    Single
                  </Button>
                  <Button 
                    className="h-16 md:h-20 text-lg md:text-xl font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-2xl"
                    onClick={() => handleMultiplierSelect(2)}
                  >
                    Double
                  </Button>
                  {selectedNumber !== 25 && (
                    <Button 
                      className="h-16 md:h-20 text-lg md:text-xl font-semibold bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 rounded-2xl"
                      onClick={() => handleMultiplierSelect(3)}
                    >
                      Triple
                    </Button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
