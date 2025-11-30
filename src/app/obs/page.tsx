"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';

interface GameStats {
  id: string;
  tournamentId: string;
  tournamentName?: string;
  round: number;
  boardId: string;
  boardName?: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Legs: number;
  player2Legs: number;
  currentPlayer: 1 | 2;
  status: 'WAITING' | 'ACTIVE' | 'PAUSED' | 'FINISHED';
  legsToWin: number;
  currentLeg: number;
  currentPlayerDarts?: string[]; // Individual darts like ["T20", "BULL", "D10"]
}

interface PlayerStats {
  name: string;
  score: number;
  legs: number;
  lastThrow: string[];
  average?: number;
}

export default function DartsScoreboardLive() {
  const [currentGame, setCurrentGame] = useState<GameStats | null>(null);
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats>({
    name: 'Warte auf Spieler...',
    score: 501,
    legs: 0,
    lastThrow: [],
    average: 0
  });
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats>({
    name: 'Warte auf Spieler...',
    score: 501,
    legs: 0,
    lastThrow: [],
    average: 0
  });
  const [previousScore1, setPreviousScore1] = useState(501);
  const [previousScore2, setPreviousScore2] = useState(501);

  const shortenName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      // Vorname + abgekürzter Nachname (nur erster Buchstabe)
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return fullName;
  };

  const formatThrow = (throwData: any): string[] => {
    if (!throwData) return [];
    // Hier könntest du die Wurf-Daten formatieren
    // Beispiel: [20, 20, 20] -> ['20', '20', '20']
    return [];
  };

  const fetchLiveData = async () => {
    try {
      // Allow a developer mock mode using ?mock=1 in the URL which hits /api/obs/mock
      const useMock = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';
      const fetchUrl = useMock ? '/api/obs/mock' : '/api/obs/live';
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.game) {
          // Es gibt ein aktives Spiel
          setCurrentGame(data.game);
          
          // Track score changes
          if (data.game.player1Score !== previousScore1) {
            setPreviousScore1(data.game.player1Score);
          }
          if (data.game.player2Score !== previousScore2) {
            setPreviousScore2(data.game.player2Score);
          }

          setPlayer1Stats({
            name: shortenName(data.game.player1Name || 'Warte auf Spieler...'),
            score: data.game.player1Score ?? 501,
            legs: data.game.player1Legs || 0,
            lastThrow: data.game.player1Stats?.lastThrow || [],
            average: data.game.player1Stats?.average || 0
          });
          setPlayer2Stats({
            name: shortenName(data.game.player2Name || 'Warte auf Spieler...'),
            score: data.game.player2Score ?? 501,
            legs: data.game.player2Legs || 0,
            lastThrow: data.game.player2Stats?.lastThrow || [],
            average: data.game.player2Stats?.average || 0
          });
        } else {
          // Kein aktives Spiel - Zurücksetzen auf Wartezustand
          setCurrentGame(null);
          setPlayer1Stats({
            name: 'Warte auf Spieler...',
            score: 501,
            legs: 0,
            lastThrow: [],
            average: 0
          });
          setPlayer2Stats({
            name: 'Warte auf Spieler...',
            score: 501,
            legs: 0,
            lastThrow: [],
            average: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  // WebSocket für Echtzeit-Updates
  const { isConnected, sendMessage } = useWebSocket({
    url: typeof window !== 'undefined' ? `ws://${window.location.hostname}:3001` : 'ws://localhost:3001',
    onMessage: (data) => {
      if (data.type === 'game-update' || data.type === 'throw-update') {
        // Bei Echtzeit-Update sofort neu laden
        fetchLiveData();
      } else if (data.type === 'game-reset') {
        // Spiel wurde zurückgesetzt
        setCurrentGame(null);
        setPlayer1Stats({
          name: 'Warte auf Spieler...',
          score: 501,
          legs: 0,
          lastThrow: [],
          average: 0
        });
        setPlayer2Stats({
          name: 'Warte auf Spieler...',
          score: 501,
          legs: 0,
          lastThrow: [],
          average: 0
        });
      }
    },
    onConnect: () => {
      console.log('🟢 WebSocket verbunden');
    },
    onDisconnect: () => {
      console.log('🔴 WebSocket getrennt');
    }
  });

  useEffect(() => {
    // Initiales Laden beim Start
    fetchLiveData();
    
    // Kein Polling mehr - nur WebSocket-Updates!
    // Wenn WebSocket disconnected ist, wird automatisch reconnected (siehe useWebSocket Hook)
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6">
      <div className="relative grid grid-cols-[auto_600px_auto] items-start gap-0 select-none">
        {/* Left red callout with throws - moves to active player */}
        <div className="flex flex-col gap-0 items-center justify-start">
          <AnimatePresence mode="wait">
            {currentGame?.currentPlayer === 1 ? (
              <motion.div
                key="darts-player1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#8d0e0e] text-white text-lg tracking-wide uppercase flex items-center px-3 h-12 shadow mt-[40px]"
              >
                {currentGame?.currentPlayerDarts && currentGame.currentPlayerDarts.length > 0 ? (
                  currentGame.currentPlayerDarts.map((dart: string, index: number) => (
                    <span key={index} className={`px-2 ${index > 0 ? 'border-l border-white/30' : ''}`}>
                      {dart}
                    </span>
                  ))
                ) : (
                  <span className="px-2 opacity-50">-</span>
                )}
              </motion.div>
            ) : currentGame?.currentPlayer === 2 ? (
              <motion.div
                key="darts-player2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#8d0e0e] text-white text-lg tracking-wide uppercase flex items-center px-3 h-12 shadow mt-[104px]"
              >
                {currentGame?.currentPlayerDarts && currentGame.currentPlayerDarts.length > 0 ? (
                  currentGame.currentPlayerDarts.map((dart: string, index: number) => (
                    <span key={index} className={`px-2 ${index > 0 ? 'border-l border-white/30' : ''}`}>
                      {dart}
                    </span>
                  ))
                ) : (
                  <span className="px-2 opacity-50">-</span>
                )}
              </motion.div>
            ) : (
              <div key="darts-none" className="h-12 mt-[40px]" />
            )}
          </AnimatePresence>
        </div>

        {/* Scoreboard body */}
        <div className="bg-black text-white w-[600px] shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm">
                <th className="px-4 py-2">First to {currentGame?.legsToWin || 7}</th>
                <th className="px-4 py-2 text-center">Sets</th>
                <th className="px-4 py-2 text-center">Legs</th>
                <th className="px-4 py-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="text-2xl font-medium">
              <tr className="border-t border-black/10 bg-white text-black">
                <td className="px-4 py-3 flex items-center justify-between">
                  {player1Stats.name} <div className={`h-2 w-2 rounded-full ml-2 ${
                    currentGame?.currentPlayer === 1 ? 'bg-[#a31212]' : 'bg-transparent'
                  }`} />
                </td>
                <td className="text-center bg-[#1c7a1d] text-white">0</td>
                <td className="text-center bg-[#1c7a1d] text-white">{player1Stats.legs}</td>
                <td className="text-center font-semibold bg-[#1c7a1d] text-white">{player1Stats.score}</td>
              </tr>
              <tr className="border-t border-black/10 bg-white text-black">
                <td className="px-4 py-3 flex items-center justify-between">
                  {player2Stats.name} <div className={`h-2 w-2 rounded-full ml-2 ${
                    currentGame?.currentPlayer === 2 ? 'bg-[#a31212]' : 'bg-transparent'
                  }`} />
                </td>
                <td className="text-center bg-[#1c7a1d] text-white">0</td>
                <td className="text-center bg-[#1c7a1d] text-white">{player2Stats.legs}</td>
                <td className="text-center font-semibold bg-[#1c7a1d] text-white">{player2Stats.score}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="px-4 py-2 text-sm text-white bg-black">
                  {currentGame?.tournamentName || 'Darts Turnier'} - {currentGame?.boardName || 'Scheibe'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right red arrow box - moves to active player */}
        <div className="flex flex-col gap-0 items-center justify-start">
          <AnimatePresence mode="wait">
            {currentGame?.currentPlayer === 1 ? (
              <motion.div
                key="arrow-player1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#8d0e0e] h-12 w-10 flex items-center justify-center shadow mt-[40px]"
              >
                <div className="w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white mr-1" />
              </motion.div>
            ) : currentGame?.currentPlayer === 2 ? (
              <motion.div
                key="arrow-player2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#8d0e0e] h-12 w-10 flex items-center justify-center shadow mt-[104px]"
              >
                <div className="w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white mr-1" />
              </motion.div>
            ) : (
              <div key="arrow-none" className="h-12 w-10 mt-[40px]" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
