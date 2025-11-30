"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Target, Trophy, TrendingUp, Award, Calculator, Edit } from 'lucide-react';

interface PlayerStatistics {
  id: string;
  playerName: string;
  average?: number;
  firstNineAvg?: number;
  highFinish?: number;
  oneEighties?: number;
  checkoutRate?: number;
  doubleRate?: number;
  bestLeg?: number;
  totalPoints?: number;
  legsPlayed?: number;
  legsWon?: number;
  matchesPlayed?: number;
  matchesWon?: number;
  currentRank?: number;
  prizeMoney?: number;
}

interface PlayerStatisticsCardProps {
  player: PlayerStatistics;
  onUpdate: () => void;
}

export function PlayerStatisticsCard({ player, onUpdate }: PlayerStatisticsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [statistics, setStatistics] = useState({
    average: player.average || 0,
    firstNineAvg: player.firstNineAvg || 0,
    highFinish: player.highFinish || 0,
    oneEighties: player.oneEighties || 0,
    checkoutRate: player.checkoutRate || 0,
    doubleRate: player.doubleRate || 0,
    bestLeg: player.bestLeg || 0,
    totalPoints: player.totalPoints || 0,
    legsPlayed: player.legsPlayed || 0,
    legsWon: player.legsWon || 0,
    matchesPlayed: player.matchesPlayed || 0,
    matchesWon: player.matchesWon || 0,
    currentRank: player.currentRank || 0,
    prizeMoney: player.prizeMoney || 0,
  });
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/players/statistics', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: player.id,
          statistics
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Erfolg',
          description: 'Statistiken wurden aktualisiert'
        });
        setIsEditing(false);
        onUpdate();
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Aktualisieren',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Aktualisieren',
        variant: 'destructive'
      });
    }
  };

  const handleCalculate = async () => {
    try {
      const response = await fetch('/api/admin/players/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: player.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatistics(prev => ({
          ...prev,
          ...data.statistics
        }));
        toast({
          title: 'Erfolg',
          description: 'Statistiken wurden berechnet'
        });
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Berechnen',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error calculating statistics:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Berechnen',
        variant: 'destructive'
      });
    }
  };

  const statItems = [
    { label: 'Average', value: statistics.average, icon: Target, suffix: '', color: 'text-blue-600' },
    { label: 'First 9 Avg', value: statistics.firstNineAvg, icon: TrendingUp, suffix: '', color: 'text-green-600' },
    { label: 'High Finish', value: statistics.highFinish, icon: Trophy, suffix: '', color: 'text-yellow-600' },
    { label: '180s', value: statistics.oneEighties, icon: Award, suffix: '', color: 'text-purple-600' },
    { label: 'Checkout %', value: statistics.checkoutRate, icon: Target, suffix: '%', color: 'text-red-600' },
    { label: 'Double %', value: statistics.doubleRate, icon: Target, suffix: '%', color: 'text-indigo-600' },
    { label: 'Best Leg', value: statistics.bestLeg, icon: Trophy, suffix: '', color: 'text-orange-600' },
    { label: 'Total Points', value: statistics.totalPoints, icon: Calculator, suffix: '', color: 'text-gray-600' },
    { label: 'Legs Played', value: statistics.legsPlayed, icon: Target, suffix: '', color: 'text-blue-500' },
    { label: 'Legs Won', value: statistics.legsWon, icon: Trophy, suffix: '', color: 'text-green-500' },
    { label: 'Matches Played', value: statistics.matchesPlayed, icon: Target, suffix: '', color: 'text-purple-500' },
    { label: 'Matches Won', value: statistics.matchesWon, icon: Trophy, suffix: '', color: 'text-orange-500' },
    { label: 'Current Rank', value: statistics.currentRank, icon: Award, suffix: '', color: 'text-yellow-500' },
    { label: 'Prize Money', value: statistics.prizeMoney, icon: Trophy, suffix: '€', color: 'text-green-700' },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          {player.playerName} - Statistiken
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculate}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Berechnen
          </Button>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Statistiken bearbeiten - {player.playerName}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {Object.entries(statistics).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setStatistics(prev => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>
                  Speichern
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Icon className={`h-5 w-5 ${item.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className={`text-lg font-semibold ${item.color}`}>
                    {item.value || 0}{item.suffix}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
