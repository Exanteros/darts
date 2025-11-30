"use client";

import { useState, useEffect } from 'react';

interface GameStats {
  id: string;
  tournamentId: string;
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
}

interface PlayerStats {
  name: string;
  score: number;
  legs: number;
  lastThrow: string[];
}

export default function DartsScoreboardMock() {
  const [currentGame, setCurrentGame] = useState<GameStats | null>(null);
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats>({
    name: 'Player A',
    score: 170,
    legs: 0,
    lastThrow: ['T20', 'T20', 'BULL']
  });
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats>({
    name: 'Player B',
    score: 121,
    legs: 0,
    lastThrow: []
  });

  const shortenName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      // Vorname + abgekürzter Nachname (nur erster Buchstabe)
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }
    return fullName;
  };

  const fetchLiveData = async () => {
    try {
      const response = await fetch('/api/obs/live');
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug-Log
        if (data.game) {
          setCurrentGame(data.game);
          setPlayer1Stats({
            name: shortenName(data.game.player1Name || 'Player A'),
            score: data.game.player1Score,
            legs: data.game.player1Legs,
            lastThrow: data.player1LastThrow || ['T20', 'T20', 'BULL']
          });
          setPlayer2Stats({
            name: shortenName(data.game.player2Name || 'Player B'),
            score: data.game.player2Score,
            legs: data.game.player2Legs,
            lastThrow: data.player2LastThrow || []
          });
        } else {
          console.log('Kein aktives Spiel gefunden - zeige Demo-Daten');
        }
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  useEffect(() => {
    // Initial load
    fetchLiveData();

    // Update every 2 seconds
    const interval = setInterval(fetchLiveData, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6">
      <div className="relative grid grid-cols-[auto_600px_auto] items-start gap-0 select-none">
        {/* Left red callout with throws */}
        <div className="flex items-center justify-center">
          <div className="bg-[#8d0e0e] text-white text-lg tracking-wide uppercase flex items-center px-3 h-12 shadow self-start mt-[40px]">
            {player1Stats.lastThrow.length > 0 ? (
              player1Stats.lastThrow.map((throw_, index) => (
                <span key={index} className={`px-2 ${index > 0 ? 'border-l border-white/30' : ''}`}>
                  {throw_}
                </span>
              ))
            ) : (
              <>
                <span className="px-2">T20</span>
                <span className="px-2 border-l border-white/30">T20</span>
                <span className="px-2 border-l border-white/30">BULL</span>
              </>
            )}
          </div>
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
                  Darts Masters Puschendorf 2025 - {currentGame?.boardName || 'Scheibe A'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right red arrow box */}
        <div className="flex items-center justify-center">
          <div className="bg-[#8d0e0e] h-12 w-10 flex items-center justify-center shadow self-start mt-[40px]">
            <div className="w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
