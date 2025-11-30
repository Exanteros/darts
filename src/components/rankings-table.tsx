"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Target, Award, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RankingPlayer {
  id: string;
  playerName: string;
  rank: number;
  average?: number;
  oneEighties?: number;
  highFinish?: number;
  checkoutRate?: number;
  totalPoints?: number;
  legsPlayed?: number;
  legsWon?: number;
  matchesPlayed?: number;
  matchesWon?: number;
  prizeMoney?: number;
  winRate: number;
  matchWinRate: number;
  user: {
    name: string;
    email: string;
  };
  tournament: {
    name: string;
  };
}

export function RankingsTable() {
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('average');
  const { toast } = useToast();

  useEffect(() => {
    fetchRankings();
  }, [sortBy]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/rankings?sortBy=${sortBy}`);
      const data = await response.json();

      if (data.success) {
        setRankings(data.rankings);
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Laden der Rangliste',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Laden der Rangliste',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getSortLabel = (value: string) => {
    const labels: Record<string, string> = {
      average: 'Average',
      oneEighties: '180s',
      highFinish: 'High Finish',
      checkoutRate: 'Checkout %',
      totalPoints: 'Total Points',
      legsWon: 'Legs Gewonnen',
      matchesWon: 'Matches Gewonnen',
      prizeMoney: 'Preisgeld'
    };
    return labels[value] || value;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Rangliste
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="average">Nach Average</SelectItem>
                <SelectItem value="oneEighties">Nach 180s</SelectItem>
                <SelectItem value="highFinish">Nach High Finish</SelectItem>
                <SelectItem value="checkoutRate">Nach Checkout %</SelectItem>
                <SelectItem value="totalPoints">Nach Punkten</SelectItem>
                <SelectItem value="legsWon">Nach Legs</SelectItem>
                <SelectItem value="matchesWon">Nach Matches</SelectItem>
                <SelectItem value="prizeMoney">Nach Preisgeld</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchRankings}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Sortiert nach: {getSortLabel(sortBy)}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Lade Rangliste...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Spieler</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">180s</TableHead>
                  <TableHead className="text-right">High Finish</TableHead>
                  <TableHead className="text-right">Checkout %</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Preisgeld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((player) => (
                  <TableRow key={player.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRankIcon(player.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{player.playerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {player.tournament.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.average ? player.average.toFixed(1) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.oneEighties || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.highFinish || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.checkoutRate ? `${player.checkoutRate}%` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.legsWon || 0}/{player.legsPlayed || 0} Legs
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {player.prizeMoney ? `${player.prizeMoney}€` : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rankings.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Keine Spieler in der Rangliste gefunden.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
