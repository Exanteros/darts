"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings } from 'lucide-react';

interface Player {
  id: string;
  playerName: string;
  status: string;
  paid: boolean;
}

interface BulkOperationsProps {
  players: Player[];
  onUpdate: () => void;
}

export function BulkOperations({ players, onUpdate }: BulkOperationsProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPaidStatus, setNewPaidStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(players.map(p => p.id));
    } else {
      setSelectedPlayers([]);
    }
  };

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers(prev => [...prev, playerId]);
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: 'Keine Spieler ausgewählt',
        description: 'Bitte wählen Sie mindestens einen Spieler aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updates: any = {};

      if (operation === 'status' && newStatus) {
        updates.status = newStatus;
      }

      if (operation === 'payment' && newPaidStatus !== null) {
        updates.paid = newPaidStatus;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'Keine Änderungen',
          description: 'Bitte wählen Sie eine Operation aus.',
          variant: 'destructive'
        });
        return;
      }

      // Bulk Update durchführen
      const promises = selectedPlayers.map(playerId =>
        fetch('/api/admin/players', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            playerId,
            updates
          })
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Erfolg',
        description: `${selectedPlayers.length} Spieler wurden aktualisiert.`
      });

      setSelectedPlayers([]);
      setIsOpen(false);
      onUpdate();

    } catch (error) {
      console.error('Error bulk updating players:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren der Spieler.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Bulk-Operationen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk-Operationen für Spieler
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Operation auswählen */}
          <div className="space-y-4">
            <Label>Operation auswählen</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Operation auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status ändern</SelectItem>
                <SelectItem value="payment">Zahlungsstatus ändern</SelectItem>
              </SelectContent>
            </Select>

            {operation === 'status' && (
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Neuer Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTERED">Registriert</SelectItem>
                  <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="ELIMINATED">Ausgeschieden</SelectItem>
                  <SelectItem value="WITHDRAWN">Zurückgezogen</SelectItem>
                </SelectContent>
              </Select>
            )}

            {operation === 'payment' && (
              <Select value={newPaidStatus?.toString()} onValueChange={(value) => setNewPaidStatus(value === 'true')}>
                <SelectTrigger>
                  <SelectValue placeholder="Zahlungsstatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Bezahlt</SelectItem>
                  <SelectItem value="false">Nicht bezahlt</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Spieler auswählen */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Spieler auswählen ({selectedPlayers.length} von {players.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(selectedPlayers.length !== players.length)}
              >
                {selectedPlayers.length === players.length ? 'Alle abwählen' : 'Alle auswählen'}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={player.id}
                    checked={selectedPlayers.includes(player.id)}
                    onCheckedChange={(checked) => handleSelectPlayer(player.id, checked as boolean)}
                  />
                  <Label htmlFor={player.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{player.playerName}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {player.status} | Bezahlt: {player.paid ? 'Ja' : 'Nein'}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={selectedPlayers.length === 0 || !operation}
            >
              {selectedPlayers.length} Spieler aktualisieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
