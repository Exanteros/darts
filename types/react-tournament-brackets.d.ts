declare module '@g-loot/react-tournament-brackets' {
  export interface Match {
    id: string | number;
    name?: string;
    nextMatchId?: string | number | null;
    nextLooserMatchId?: string | number | null;
    tournamentRoundText?: string;
    startTime?: string;
    state?: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
    participants?: Array<{
      id: string | number;
      name?: string;
      isWinner?: boolean;
      status?: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
      resultText?: string | null;
    }>;
  }

  export interface SingleEliminationProps {
    matches: Match[];
    matchComponent?: React.ComponentType<any>;
    currentRound?: string;
    onMatchClick?: (match: Match) => void;
    onPartyClick?: (match: Match, party: any) => void;
    svgWrapper?: React.ComponentType<any>;
    theme?: any;
    options?: {
      style?: {
        roundHeader?: any;
        connectionLinesColor?: string;
        connectorColor?: string;
        connectorColorHighlight?: string;
      };
    };
  }

  export const SingleElimination: React.ComponentType<SingleEliminationProps>;
}
