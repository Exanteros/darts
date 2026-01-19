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
  totalCount?: number;
  filters?: Record<string, string>;
}

export function BulkOperations({ players, onUpdate, totalCount = 0, filters = {} }: BulkOperationsProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
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
      setSelectAllGlobal(false);
    }
  };

  const handleSelectAllGlobal = () => {
    setSelectAllGlobal(true);
  };

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers(prev => [...prev, playerId]);
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
      setSelectAllGlobal(false);
    }
  };

  const handleBulkUpdate = async () => {
    let targetPlayerIds = selectedPlayers;

    if (targetPlayerIds.length === 0 && !selectAllGlobal) {
      toast({
        title: 'Keine Spieler ausgewählt',
        description: 'Bitte wählen Sie mindestens einen Spieler aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Wenn global ausgewählt, hole alle IDs
      if (selectAllGlobal) {
        const params = new URLSearchParams({
          limit: '10000',
          ...filters
        });
        const res = await fetch(`/api/admin/players?${params}`);
        const data = await res.json();
        if (data.success) {
          targetPlayerIds = data.players.map((p: any) => p.id);
        }
      }

      const updates: any = {};

      if (operation === 'status' && newStatus) {
        updates.status = newStatus;
      }

      if (operation === 'payment' && newPaidStatus !== null) {
        updates.paid = newPaidStatus;
        // Automatisch auf ACTIVE setzen wenn bezahlt (wie bei Einzel-Update)
        if (newPaidStatus === true) {
          updates.status = 'ACTIVE';
        }
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
      const promises = targetPlayerIds.map(playerId =>
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
        description: `${targetPlayerIds.length} Spieler wurden aktualisiert.`
      });

      setSelectedPlayers([]);
      setSelectAllGlobal(false);
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
              <div className="space-y-3">
                 <Button 
                    variant={newStatus === 'ACTIVE' ? 'default' : 'outline'} 
                    size="lg"
                    className={`w-full justify-start h-14 text-lg transition-all ${newStatus === 'ACTIVE' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setNewStatus('ACTIVE')}
                 >
                    <div className="flex items-center gap-3 w-full">
                       <div className={`h-4 w-4 rounded-full ${newStatus === 'ACTIVE' ? 'bg-white' : 'bg-green-500'}`} />
                       <div className="flex flex-col items-start">
                          <span>Aktiv setzen</span>
                          <span className="text-xs opacity-80 font-normal">Bereit für Spiel/Shootout</span>
                       </div>
                       {newStatus === 'ACTIVE' && <Settings className="ml-auto h-5 w-5" />}
                    </div>
                 </Button>

                 <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant={newStatus === 'CONFIRMED' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => setNewStatus('CONFIRMED')}
                    >
                        Bestätigt
                    </Button>
                    <Button 
                        variant={newStatus === 'REGISTERED' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => setNewStatus('REGISTERED')}
                    >
                        Registriert
                    </Button>
                    <Button 
                        variant={newStatus === 'WAITING_LIST' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => setNewStatus('WAITING_LIST')}
                    >
                        Warteliste
                    </Button>
                     <Button 
                        variant={newStatus === 'WITHDRAWN' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => setNewStatus('WITHDRAWN')}
                    >
                        Zurückgezogen
                    </Button>
                 </div>
              </div>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label>Spieler auswählen ({selectAllGlobal ? totalCount : selectedPlayers.length} von {totalCount || players.length})</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(selectedPlayers.length !== players.length)}
                >
                  {selectedPlayers.length === players.length ? 'Alle auf Seite abwählen' : 'Alle auf Seite auswählen'}
                </Button>
                
                {selectedPlayers.length === players.length && totalCount > players.length && !selectAllGlobal && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectAllGlobal}
                  >
                    Alle {totalCount} Spieler auswählen
                  </Button>
                )}
              </div>
            </div>
            
            {selectAllGlobal && (
              <div className="bg-muted p-2 rounded text-sm text-center">
                Alle <strong>{totalCount}</strong> Spieler im Filter sind ausgewählt.
              </div>
            )}

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
          <div className="flex flex-col gap-3 pt-4 border-t mt-4">
            <Button
              size="lg"
              className="w-full text-base font-semibold h-12"
              onClick={handleBulkUpdate}
              disabled={selectedPlayers.length === 0 || !operation || (operation === 'status' && !newStatus)}
            >
              {selectedPlayers.length > 0 ? `${selectedPlayers.length} Spieler aktualisieren` : 'Bitte Spieler auswählen'}
            </Button>
             <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
