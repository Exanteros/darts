'use client';

import React from 'react';
import { Target, CheckCircle, Clock } from 'lucide-react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { useIsMobile } from "@/hooks/use-mobile"

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
  winner?: string; // Winner ID
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  boardName?: string;
}

interface CustomBracketProps {
  matches: BracketMatch[];
  isDark?: boolean;
  onMatchClick?: (matchId: string) => void;
}

export const CustomBracket: React.FC<CustomBracketProps> = ({
  matches,
  isDark = false,
  onMatchClick
}) => {
  const isMobile = useIsMobile()
  // Organize matches by rounds
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, BracketMatch[]>);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);
  const totalRounds = roundNumbers.length;

  return (
    <div
      className="relative w-full overflow-x-auto overflow-y-auto bg-background"
      style={{
        minHeight: '600px',
        maxHeight: '800px',
      }}
    >
      {/* Tournament Bracket */}
      <div
        className="flex gap-8 sm:gap-16 p-4 sm:p-8 bg-background"
        style={{
          minWidth: `${totalRounds * (isMobile ? 300 : 400)}px`,
        }}
      >
        {roundNumbers.map((roundNum, roundIndex) => {
          const roundMatches = rounds[roundNum];

          return (
            <div
              key={roundNum}
              className="flex flex-col"
              style={{
                minWidth: isMobile ? '260px' : '320px',
              }}
            >
              {/* Round Header */}
              <div
                className={`sticky top-0 z-10 text-center py-2 px-4 rounded font-semibold text-base mb-6 border ${
                  isDark
                    ? 'bg-background border-border text-foreground'
                    : 'bg-background border-border text-foreground'
                }`}
              >
                {roundMatches[0]?.roundName || `Runde ${roundNum}`}
              </div>

              {/* Matches in this round */}
              <div className="flex flex-col gap-6 flex-1">
                {roundMatches.map((match, matchIndex) => (
                  <div
                    key={match.id}
                    className="relative"
                  >
                    {/* Match Card */}
                    <div
                      onClick={() => onMatchClick?.(match.id)}
                      className={`relative rounded-md border transition-all duration-200 cursor-pointer hover:border-primary/50 bg-card ${
                        match.winner
                          ? 'border-primary'
                          : match.status === 'ACTIVE'
                          ? 'border-primary/60'
                          : match.status === 'WAITING' && match.player1 && match.player2
                          ? 'border-muted-foreground/30 hover:border-primary/40'
                          : 'border-border'
                      }`}
                      style={{
                        minHeight: '140px',
                      }}
                    >
                      {/* Status Badge */}
                      {match.status !== 'WAITING' && (
                        <div
                          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs border bg-background ${
                            match.status === 'FINISHED'
                              ? 'border-primary text-primary'
                              : 'border-muted-foreground text-muted-foreground'
                          }`}
                        >
                          {match.status === 'FINISHED' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      {/* Players */}
                      <div className="p-4 space-y-3">
                        {/* Player 1 Position */}
                        <Droppable droppableId={`match-${match.id}-player1`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`relative flex items-center justify-between p-2.5 rounded transition-all border ${
                                snapshot.isDraggingOver
                                  ? 'border-primary bg-primary/5'
                                  : match.player1?.isWinner
                                  ? 'bg-muted border-muted-foreground/20 font-semibold'
                                  : 'bg-muted/50 border-border'
                              }`}
                            >
                              {match.player1 ? (
                                <Draggable draggableId={`player-${match.player1.id}`} index={0}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`flex items-center justify-between w-full cursor-move transition-all ${
                                        snapshot.isDragging ? 'opacity-50 scale-105' : ''
                                      }`}
                                    >
                                      <span className="flex-1 truncate text-sm text-foreground">
                                        {match.player1?.name}
                                      </span>
                                      {match.player1?.isWinner && (
                                        <CheckCircle className="ml-2 h-4 w-4 text-primary" />
                                      )}
                                      {match.player1?.score && (
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                                          {match.player1.score}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  TBD
                                </span>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Play Button between players for WAITING games */}
                        {match.status === 'WAITING' && match.player1 && match.player2 ? (
                          <div className="flex items-center justify-center py-1">
                            <div className="bg-primary text-primary-foreground rounded-full p-2 hover:scale-110 transition-transform cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="h-px bg-border" />
                        )}

                        {/* Player 2 Position */}
                        <Droppable droppableId={`match-${match.id}-player2`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`relative flex items-center justify-between p-2.5 rounded transition-all border ${
                                snapshot.isDraggingOver
                                  ? 'border-primary bg-primary/5'
                                  : match.player2?.isWinner
                                  ? 'bg-muted border-muted-foreground/20 font-semibold'
                                  : 'bg-muted/50 border-border'
                              }`}
                            >
                              {match.player2 ? (
                                <Draggable draggableId={`player-${match.player2.id}`} index={0}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`flex items-center justify-between w-full cursor-move transition-all ${
                                        snapshot.isDragging ? 'opacity-50 scale-105' : ''
                                      }`}
                                    >
                                      <span className="flex-1 truncate text-sm text-foreground">
                                        {match.player2?.name}
                                      </span>
                                      {match.player2?.isWinner && (
                                        <CheckCircle className="ml-2 h-4 w-4 text-primary" />
                                      )}
                                      {match.player2?.score && (
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                                          {match.player2.score}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  TBD
                                </span>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>

                      {/* Board Info */}
                      {match.boardName && (
                        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-b-md border-t bg-muted/30 text-muted-foreground">
                          <Target className="w-3 h-3" />
                          {match.boardName}
                        </div>
                      )}
                    </div>

                    {/* Connector line to next round */}
                    {roundIndex < totalRounds - 1 && (
                      <div
                        className="absolute top-1/2 -right-16 w-16 h-px bg-border"
                        style={{
                          transform: 'translateY(-50%)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
