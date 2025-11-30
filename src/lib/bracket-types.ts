// Type definitions for @g-loot/react-tournament-brackets
// This file provides proper TypeScript types for the bracket library

import type { ReactNode, FC } from 'react';

export interface ParticipantType {
  id: string | number;
  name?: string;
  isWinner?: boolean;
  status?: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
  resultText?: string | null;
}

export interface MatchType {
  id: string | number;
  name?: string;
  nextMatchId?: string | number | null;
  nextLooserMatchId?: string | number | null;
  tournamentRoundText?: string;
  startTime?: string;
  state?: 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
  participants: ParticipantType[];
}

export interface DoubleBracketMatches {
  upper: MatchType[];
  lower: MatchType[];
}

export interface ThemeType {
  textColor?: {
    main?: string;
    highlighted?: string;
    dark?: string;
  };
  matchBackground?: {
    wonColor?: string;
    lostColor?: string;
  };
  score?: {
    background?: {
      wonColor?: string;
      lostColor?: string;
    };
    text?: {
      highlightedWonColor?: string;
      highlightedLostColor?: string;
    };
  };
  border?: {
    color?: string;
    highlightedColor?: string;
  };
  roundHeader?: {
    backgroundColor?: string;
    fontColor?: string;
  };
  connectorColor?: string;
  connectorColorHighlight?: string;
  svgBackground?: string;
}

export interface MatchComponentProps {
  match: MatchType;
  onMatchClick?: (match: MatchType) => void;
  onPartyClick?: (party: ParticipantType, partyWon: boolean) => void;
  onMouseEnter?: (partyId: string | number) => void;
  onMouseLeave?: (partyId: string | number) => void;
  topParty: ParticipantType;
  bottomParty: ParticipantType;
  topWon: boolean;
  bottomWon: boolean;
  topHovered: boolean;
  bottomHovered: boolean;
  topText: string;
  bottomText: string;
  connectorColor?: string;
  computedStyles?: Record<string, unknown>;
  teamNameFallback: string;
  resultFallback: (party: ParticipantType) => string;
}

export interface OptionsType {
  style?: {
    roundHeader?: {
      backgroundColor?: string;
      fontColor?: string;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string | number;
    };
    connectorColor?: string;
    connectorColorHighlight?: string;
  };
}

export interface SVGViewerProps {
  width: number;
  height: number;
  background?: string;
  SVGBackground?: string;
  children: ReactNode;
  [key: string]: unknown;
}

export interface SingleEliminationBracketProps {
  matches: MatchType[];
  matchComponent?: FC<MatchComponentProps>;
  theme?: ThemeType;
  options?: OptionsType;
  svgWrapper?: FC<SVGViewerProps>;
  onMatchClick?: (match: MatchType) => void;
  onPartyClick?: (party: ParticipantType, partyWon: boolean) => void;
}

export interface DoubleEliminationBracketProps {
  matches: DoubleBracketMatches;
  matchComponent?: FC<MatchComponentProps>;
  theme?: ThemeType;
  options?: OptionsType;
  svgWrapper?: FC<SVGViewerProps>;
  onMatchClick?: (match: MatchType) => void;
  onPartyClick?: (party: ParticipantType, partyWon: boolean) => void;
}

// Match states constant
export const MATCH_STATES = {
  PLAYED: 'PLAYED',
  NO_SHOW: 'NO_SHOW',
  WALK_OVER: 'WALK_OVER',
  NO_PARTY: 'NO_PARTY',
  DONE: 'DONE',
  SCORE_DONE: 'SCORE_DONE',
} as const;
