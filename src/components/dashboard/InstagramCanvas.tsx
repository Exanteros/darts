'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  tournamentId: string;
}

interface StatsData {
  game: {
    round: number;
    legsToWin: number;
    player1Legs: number;
    player2Legs: number;
  };
  tournament: {
    name: string;
  };
  player1: {
    name: string;
    stats: { average: number; oneEighties: number; highestCheckout: number; checkoutPercent: number; };
  };
  player2: {
    name: string;
    stats: { average: number; oneEighties: number; highestCheckout: number; checkoutPercent: number; };
  };
}

export function InstagramCanvas({ isOpen, onClose, gameId, tournamentId }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [format, setFormat] = useState<'post' | 'story'>('post');
  const [loading, setLoading] = useState(true);

  // Layout-Größen
  const isPost = format === 'post';
  const width = 1080;
  const height = isPost ? 1080 : 1920;
  
  // Skalierung für die Vorschau, damit es in den Dialog passt.
  // Post (1:1) -> 400x400
  // Story (9:16) -> 300x533
  const previewScale = isPost ? 400 / 1080 : 300 / 1080;

  useEffect(() => {
    if (isOpen && gameId) {
      loadStats();
    }
  }, [isOpen, gameId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/tournament/game/${gameId}/stats?tournament=${tournamentId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (canvasRef.current) {
      // Temporär die Skalierung entfernen (transform: none) auf dem Container
      const el = canvasRef.current;
      const oldTransform = el.style.transform;
      
      try {
        const dataUrl = await toPng(el, { 
          quality: 1, 
          pixelRatio: 1,
          width: width,
          height: height
        });
        
        const link = document.createElement('a');
        link.download = `match-${data?.player1?.name}-vs-${data?.player2?.name}-stats.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Oops, something went wrong!', err);
      } finally {
        // Skalierung wiederherstellen (das passiert ohnehin über CSS-Klassen, aber sicherheitshalber)
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Instagram Share / PDC Stats</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Select value={format} onValueChange={(v: 'post' | 'story') => setFormat(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Instagram Post (1:1)</SelectItem>
              <SelectItem value="story">Instagram Story (9:16)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleDownload} className="ml-auto" disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> Herunterladen
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">Lädt PDC Stats...</div>
        ) : !data ? (
          <div className="flex-1 flex justify-center items-center text-red-500">Daten konnten nicht geladen werden.</div>
        ) : (
          <div className="flex-1 flex justify-center items-center overflow-auto bg-slate-900 rounded-xl relative">
            {/* Der skalierte Container für die Vorschau */}
            <div 
              style={{
                width: `${width}px`, 
                height: `${height}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'center center',
              }}
              className="flex justify-center items-center absolute"
            >
              {/* Der eigentliche Canvas, der von html-to-image erfasst wird */}
              <div 
                ref={canvasRef}
                className="w-full h-full bg-[#111] overflow-hidden flex flex-col items-center justify-between font-sans text-white p-12 relative"
                style={{
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)',
                  backgroundSize: '40px 40px'
                }}></div>

                {/* Header */}
                <div className="text-center z-10 mt-8">
                  <h2 className="text-red-600 font-black tracking-widest uppercase text-3xl mb-2">OFFICIAL MATCH STATS</h2>
                  <h1 className="text-5xl font-bold text-white tracking-tight">{data.tournament?.name || 'Darts Turnier'}</h1>
                </div>

                {/* Main Scoreboard */}
                <div className="w-full max-w-[900px] z-10 flex flex-col gap-8">
                  
                  {/* Player Names & Score */}
                  <div className="flex justify-between items-center w-full bg-black/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
                    <div className="flex-1 text-center">
                      <div className="text-5xl font-black uppercase tracking-wider mb-4 leading-none truncate px-4">{data.player1?.name || 'Player 1'}</div>
                      <div className="text-8xl font-black text-green-500 tabular-nums leading-none">{data.game?.player1Legs || '0'}</div>
                    </div>
                    
                    <div className="px-8 text-neutral-500 flex flex-col items-center text-4xl font-bold italic">
                      <div>VS</div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="text-5xl font-black uppercase tracking-wider mb-4 leading-none truncate px-4">{data.player2?.name || 'Player 2'}</div>
                      <div className="text-8xl font-black text-red-500 tabular-nums leading-none">{data.game?.player2Legs || '0'}</div>
                    </div>
                  </div>

                  {/* Stats Table */}
                  <div className="w-full bg-black/40 border-t border-b border-white/10 flex flex-col">
                    {/* Stat Row */}
                    <div className="flex items-center py-6 border-b border-white/5">
                      <div className="flex-1 text-right text-4xl font-bold pr-12 text-white tabular-nums">
                        {data.player1?.stats.average.toFixed(2)}
                      </div>
                      <div className="w-64 text-center text-2xl font-black text-neutral-400 tracking-widest uppercase">
                        3-DART AVG
                      </div>
                      <div className="flex-1 text-left text-4xl font-bold pl-12 text-white tabular-nums">
                        {data.player2?.stats.average.toFixed(2)}
                      </div>
                    </div>

                    {/* Stat Row */}
                    <div className="flex items-center py-6 border-b border-white/5">
                      <div className="flex-1 text-right text-4xl font-bold pr-12 text-white tabular-nums">
                        {data.player1?.stats.highestCheckout}
                      </div>
                      <div className="w-64 text-center text-2xl font-black text-neutral-400 tracking-widest uppercase">
                        HI FINISH
                      </div>
                      <div className="flex-1 text-left text-4xl font-bold pl-12 text-white tabular-nums">
                        {data.player2?.stats.highestCheckout}
                      </div>
                    </div>

                    {/* Stat Row */}
                    <div className="flex items-center py-6 border-b border-white/5">
                      <div className="flex-1 text-right text-4xl font-bold pr-12 text-white tabular-nums">
                        {data.player1?.stats.checkoutPercent}%
                      </div>
                      <div className="w-64 text-center text-2xl font-black text-neutral-400 tracking-widest uppercase">
                        CHECKOUT %
                      </div>
                      <div className="flex-1 text-left text-4xl font-bold pl-12 text-white tabular-nums">
                        {data.player2?.stats.checkoutPercent}%
                      </div>
                    </div>

                    {/* Stat Row */}
                    <div className="flex items-center py-6">
                      <div className="flex-1 text-right text-4xl font-bold pr-12 text-white tabular-nums">
                        {data.player1?.stats.oneEighties}
                      </div>
                      <div className="w-64 text-center text-2xl font-black text-yellow-500 tracking-widest uppercase">
                        180s
                      </div>
                      <div className="flex-1 text-left text-4xl font-bold pl-12 text-white tabular-nums">
                        {data.player2?.stats.oneEighties}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Logo */}
                <div className="z-10 mb-8 w-full px-16 flex justify-between items-end opacity-60">
                   <div className="font-mono text-xl tracking-widest text-[#dc2626]">DART MASTERS APP</div>
                   <div className="font-mono text-xl tracking-widest text-neutral-500">FORMAT: BEST OF {data.game.legsToWin * 2 - 1}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
