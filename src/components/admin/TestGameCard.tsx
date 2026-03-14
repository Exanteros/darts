"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/hooks/use-toast';
import { MonitorPlay, StopCircle } from 'lucide-react';

interface TestGameCardProps {
  boards: Array<{ id: string; name: string; isMain?: boolean }>;
}

export function TestGameCard({ boards }: TestGameCardProps) {
  const [player1, setPlayer1] = useState('Max Mustermann');
  const [player2, setPlayer2] = useState('Erika Musterfrau');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStartGame = async () => {
    if (!selectedBoardId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Dartscheibe aus.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: selectedBoardId,
          player1Name: player1,
          player2Name: player2
        })
      });

      if (response.ok) {
        toast({
          title: "Testspiel gestartet",
          description: `Das Spiel wurde auf ${boards.find(b => b.id === selectedBoardId)?.name} gestartet.`
        });
      } else {
        const err = await response.json();
        toast({
          title: "Fehler",
          description: err.error || "Spiel konnte nicht gestartet werden.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Netzwerkfehler",
        description: "Konnte Verbindung zum Server nicht herstellen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopGame = async () => {
    if (!selectedBoardId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Dartscheibe aus.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-game', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: selectedBoardId
        })
      });

      if (response.ok) {
        toast({
          title: "Spiel beendet",
          description: "Das Testspiel wurde beendet und von der Anzeige entfernt."
        });
      } else {
        toast({
          title: "Fehler",
          description: "Spiel konnte nicht gestoppt werden.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Netzwerkfehler",
        description: "Fehler beim Beenden des Spiels.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorPlay className="h-5 w-5" />
          Testspiel-Simulator
        </CardTitle>
        <CardDescription>
          Starten Sie ein virtuelles Spiel, um Displays und Eingabegeräte zu testen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
             <Label>Spieler 1</Label>
             <Input 
                value={player1} 
                onChange={e => setPlayer1(e.target.value)} 
                placeholder="Name Spieler 1" 
             />
          </div>
          <div className="space-y-2">
             <Label>Spieler 2</Label>
             <Input 
                value={player2} 
                onChange={e => setPlayer2(e.target.value)} 
                placeholder="Name Spieler 2" 
             />
          </div>
          <div className="space-y-2">
             <Label>Dartscheibe</Label>
             <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger>
                   <SelectValue placeholder="Scheibe wählen..." />
                </SelectTrigger>
                <SelectContent>
                   {boards.map(b => (
                       <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
           <LoadingButton 
              variant="outline"
              onClick={handleStopGame} 
              loading={loading}
              className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={!selectedBoardId}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Spiel beenden
           </LoadingButton>
           <LoadingButton 
              onClick={handleStartGame} 
              loading={loading}
              className="w-full sm:w-auto"
              disabled={!selectedBoardId}
           >
              <MonitorPlay className="mr-2 h-4 w-4" />
              Testspiel starten
           </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
