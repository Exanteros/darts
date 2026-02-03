'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function BracketSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bracketFormat: 'single',
    seedingAlgorithm: 'standard',
    autoAssignBoards: true,
    mainBoardPriority: true,
    distributeEvenly: false,
    mainBoardPriorityLevel: 'finals',
    maxConcurrentGames: 8,
    legsPerRound: {
      round1: 3,
      round2: 3,
      round3: 3,
      round4: 3,
      round5: 5,
      round6: 7
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/settings/bracket');
      if (response.ok) {
        const data = await response.json();
        // Ensure legsPerRound has all needed keys
        const defaultLegs = { round1: 3, round2: 3, round3: 3, round4: 3, round5: 5, round6: 7 };
        setFormData({
            ...data,
            legsPerRound: { ...defaultLegs, ...(data.legsPerRound || {}) }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
          title: 'Fehler',
          description: 'Fehler beim Laden der Einstellungen',
          variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/tournament/settings/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
            title: 'Erfolg',
            description: 'Einstellungen erfolgreich gespeichert',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
            title: 'Fehler',
            description: 'Fehler beim Speichern der Einstellungen',
            variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLegs = (round: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      legsPerRound: {
        ...prev.legsPerRound,
        [round]: value
      }
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Lade Einstellungen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Turnier-Format */}
        <Card>
          <CardHeader>
            <CardTitle>Turnier-Format</CardTitle>
            <CardDescription>Grundlegende Regeln für den Turnierbaum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modus</Label>
              <Select 
                value={formData.bracketFormat} 
                onValueChange={(val) => setFormData({...formData, bracketFormat: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle Modus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Elimination</SelectItem>
                  <SelectItem value="double">Double Elimination (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Single Elimination: Verlust = Ausgeschieden
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Setzliste / Seeding</Label>
              <Select 
                value={formData.seedingAlgorithm} 
                onValueChange={(val) => setFormData({...formData, seedingAlgorithm: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle Algorithmus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snake">Turnier-Standard (1 vs 64, 32 vs 33) - Empfohlen</SelectItem>
                  <SelectItem value="standard">Sequentiell (1 vs 64, 2 vs 63)</SelectItem>
                  <SelectItem value="random">Zufällig</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Bestimmt, wer in der ersten Runde gegeneinander spielt. "Turnier-Standard" sorgt dafür, dass Favoriten später aufeinandertreffen.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scheiben-Zuordnung */}
        <Card>
          <CardHeader>
            <CardTitle>Scheiben-Zuordnung</CardTitle>
            <CardDescription>Steuerung der automatischen Spielzuweisung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Max. parallele Spiele</Label>
              <Input 
                type="number" 
                value={formData.maxConcurrentGames} 
                onChange={(e) => setFormData({...formData, maxConcurrentGames: parseInt(e.target.value) || 1})}
                min={1}
                max={32}
              />
              <p className="text-xs text-muted-foreground">
                Begrenzt die Anzahl der gleichzeitig laufenden Spiele (z.B. bei Personalmangel).
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label>Wichtige Spiele priorisieren</Label>
                <p className="text-xs text-muted-foreground">
                   Finale/Halbfinale bevorzugt auf Haupt-Scheiben
                </p>
              </div>
              <Switch 
                checked={formData.mainBoardPriority}
                onCheckedChange={(val) => setFormData({...formData, mainBoardPriority: val})}
              />
            </div>

            <div className="space-y-2">
              <Label>Verteilungs-Strategie</Label>
              <RadioGroup 
                value={formData.distributeEvenly ? 'even' : 'all'} 
                onValueChange={(val) => setFormData({...formData, distributeEvenly: val === 'even'})}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="r1" />
                  <Label htmlFor="r1">Alle Scheiben nutzen (Maximaler Durchsatz)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="even" id="r2" />
                  <Label htmlFor="r2">Gleichmäßige Verteilung (Pausen für Schreiber)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Legs-Konfiguration */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Legs-Konfiguration</CardTitle>
            <CardDescription>
              Best of X: Anzahl der Legs, die maximal gespielt werden.
              <br/>
              Beispiel: Bei "3" (Best of 3) muss ein Spieler 2 Legs gewinnen (First to 2).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((round) => (
                <div key={round} className="space-y-2">
                  <Label>Runde {round} {round === 6 ? '(Finale)' : round === 5 ? '(Halbfinale)' : ''}</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={formData.legsPerRound[`round${round}` as keyof typeof formData.legsPerRound]} 
                      onChange={(e) => updateLegs(`round${round}`, parseInt(e.target.value) || 1)}
                      min={1}
                      step={2}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      First to {Math.ceil((formData.legsPerRound[`round${round}` as keyof typeof formData.legsPerRound] || 0) / 2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hinweis</AlertTitle>
        <AlertDescription>
          Diese Einstellungen beeinflussen die automatische Turnierbaum-Generierung und Scheiben-Zuordnung. 
          Änderungen gelten für neue Bracket-Generierungen.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Speichert...' : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
