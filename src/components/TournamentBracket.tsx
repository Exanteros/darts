"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy, User, Clock, CheckCircle, Play, Users } from 'lucide-react';

interface TournamentPlayer {
  id: string;
  playerName: string;
  seed?: number;
  status: string;
}

interface GameData {
  id: string;
  round: number;
  matchNumber?: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: TournamentPlayer;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'PAUSED';
  boardId?: string;
  boardName?: string;
  startedAt?: string;
  finishedAt?: string;
}

interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: GameData[];
}

interface BracketData {
  rounds: BracketRound[];
  totalRounds: number;
  activeRound: number;
}

interface TournamentBracketProps {
  brackets: BracketData | null;
  onAssignGame: (gameId: string, boardId: string) => void;
  onStartGame: (gameId: string) => void;
  availableBoards: any[];
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  brackets, 
  onAssignGame, 
  onStartGame, 
  availableBoards 
}) => {
  if (!brackets || brackets.rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">Kein Turnierbaum verfügbar</h3>
        <p className="text-sm text-muted-foreground">Starten Sie ein Turnier, um den Turnierbaum zu sehen</p>
      </div>
    );
  }

  // Sortiere Runden umgekehrt für Turnierbaum-Darstellung (Finale zuerst)
  const reversedRounds = [...brackets.rounds].reverse();
  const maxMatchesInRound = Math.max(...brackets.rounds.map(r => r.matches.length));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Play className="h-3 w-3" />;
      case 'FINISHED': return <CheckCircle className="h-3 w-3" />;
      case 'WAITING': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'FINISHED': return 'bg-blue-500';
      case 'WAITING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const MatchCard = ({ match, roundIndex }: { match: GameData; roundIndex: number }) => {
    const isWinner = (player: TournamentPlayer | undefined) => {
      return match.winner && player && match.winner.id === player.id;
    };

    return (
      <Card className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        match.status === 'ACTIVE' && "ring-2 ring-green-500 shadow-lg",
        "w-48 mx-2 my-1"
      )}>
        <CardContent className="p-3">
          {/* Match Header */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {match.status === 'FINISHED' ? 'Beendet' : 
               match.status === 'ACTIVE' ? 'Läuft' : 'Wartend'}
            </Badge>
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(match.status))} />
          </div>

          {/* Players */}
          <div className="space-y-2">
            {/* Player 1 */}
            <div className={cn(
              "flex items-center justify-between p-2 rounded border",
              isWinner(match.player1) && "bg-green-50 border-green-200 font-semibold",
              !match.player1 && "bg-gray-50 border-dashed"
            )}>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {match.player1?.playerName || 'TBD'}
                </span>
              </div>
              {match.player1?.seed && (
                <Badge variant="secondary" className="text-xs">
                  #{match.player1.seed}
                </Badge>
              )}
              {isWinner(match.player1) && (
                <Trophy className="h-3 w-3 text-yellow-600" />
              )}
            </div>

            {/* VS Divider */}
            <div className="text-center text-xs text-muted-foreground font-medium">
              VS
            </div>

            {/* Player 2 */}
            <div className={cn(
              "flex items-center justify-between p-2 rounded border",
              isWinner(match.player2) && "bg-green-50 border-green-200 font-semibold",
              !match.player2 && "bg-gray-50 border-dashed"
            )}>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {match.player2?.playerName || 'TBD'}
                </span>
              </div>
              {match.player2?.seed && (
                <Badge variant="secondary" className="text-xs">
                  #{match.player2.seed}
                </Badge>
              )}
              {isWinner(match.player2) && (
                <Trophy className="h-3 w-3 text-yellow-600" />
              )}
            </div>
          </div>

          {/* Match Info */}
          {match.boardName && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {match.boardName}
            </div>
          )}

          {/* Actions */}
          {match.status === 'WAITING' && match.player1 && match.player2 && !match.boardId && (
            <div className="mt-2">
              <select 
                className="w-full text-xs p-1 border rounded"
                onChange={(e) => e.target.value && onAssignGame(match.id, e.target.value)}
              >
                <option value="">Scheibe zuweisen...</option>
                {availableBoards.filter(b => b.isActive && b.status === 'idle').map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>

        {/* Connection Lines */}
        {roundIndex < reversedRounds.length - 1 && (
          <>
            {/* Horizontal line to right */}
            <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-gray-300 transform -translate-y-0.5" />
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max p-6">
        <div className="flex justify-center items-start gap-12">
          {reversedRounds.map((round, roundIndex) => (
            <div key={round.roundNumber} className="flex flex-col items-center">
              {/* Round Title */}
              <div className="mb-6 text-center">
                <h3 className="font-bold text-lg text-center mb-1">
                  {round.roundName}
                </h3>
                <Badge variant="outline" className="text-xs">
                  Runde {round.roundNumber}
                </Badge>
              </div>

              {/* Matches Container */}
              <div className="relative flex flex-col gap-6" style={{
                minHeight: `${maxMatchesInRound * 120}px`
              }}>
                {round.matches.map((match, matchIndex) => {
                  // Berechne vertikale Position für bessere Verteilung
                  const totalMatches = round.matches.length;
                  const spacing = maxMatchesInRound > totalMatches ? 
                    (maxMatchesInRound * 120) / totalMatches : 120;
                  
                  return (
                    <div 
                      key={match.id}
                      className="relative"
                      style={{
                        marginTop: matchIndex === 0 ? 
                          ((maxMatchesInRound - totalMatches) * spacing / 2) : 
                          (spacing - 120)
                      }}
                    >
                      <MatchCard match={match} roundIndex={roundIndex} />
                    </div>
                  );
                })}

                {/* Vertical connecting lines between rounds */}
                {roundIndex < reversedRounds.length - 1 && round.matches.length > 1 && (
                  <svg className="absolute -right-6 top-0 w-6 h-full pointer-events-none">
                    {/* Vertical connector lines */}
                    {round.matches.map((_, matchIndex) => {
                      if (matchIndex % 2 === 0 && matchIndex + 1 < round.matches.length) {
                        const y1 = 60 + (matchIndex * 140);
                        const y2 = 60 + ((matchIndex + 1) * 140);
                        const midY = (y1 + y2) / 2;
                        
                        return (
                          <g key={matchIndex}>
                            {/* Vertical line */}
                            <line x1="0" y1={y1} x2="0" y2={y2} stroke="#d1d5db" strokeWidth="2" />
                            {/* Horizontal line to next round */}
                            <line x1="0" y1={midY} x2="24" y2={midY} stroke="#d1d5db" strokeWidth="2" />
                          </g>
                        );
                      }
                      return null;
                    })}
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex justify-center">
          <Card className="p-4">
            <CardContent className="p-0">
              <h4 className="font-semibold mb-3 text-center">Status-Legende</h4>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>Wartend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Aktiv</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Beendet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-3 w-3 text-yellow-600" />
                  <span>Gewinner</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;