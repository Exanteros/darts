"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { LogoUpload, SponsorLogosUpload } from '@/components/LogoUpload';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import { IconInfoCircle } from '@tabler/icons-react';

interface DartBoard {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  legSettings?: {
    legsPerGame: number;
  };
  currentGame?: {
    id: string;
    player1: string;
    player2: string;
    score1: number;
    score2: number;
  };
  accessCode: string;
  isMain?: boolean;
}

interface TournamentSettings {
  id?: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  maxPlayers: number;
  entryFee: number;
  gameMode: '501' | '301' | 'cricket';
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  mainLogo: string;
  sponsorLogos: string[];
}

function UploadedImagesList() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; imageUrl: string | null }>({ open: false, imageUrl: null });
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/uploaded-images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDeleteImage = async () => {
    if (!deleteDialog.imageUrl) return;

    try {
      const response = await fetch('/api/admin/uploaded-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: deleteDialog.imageUrl }),
      });

      if (response.ok) {
        toast({
          title: "Bild gelöscht",
          description: "Das Bild wurde erfolgreich gelöscht.",
        });
        fetchImages(); // Liste neu laden
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler beim Löschen",
          description: errorData.message || "Das Bild konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Fehler beim Löschen des Bildes.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, imageUrl: null });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Lade Bilder...</div>;
  }

  if (images.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Keine Bilder hochgeladen</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl}
              alt={`Hochgeladenes Bild ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xs text-center px-2">
                  {imageUrl.split('/').pop()}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialog({ open: true, imageUrl })}
                  className="h-6 px-2 text-xs"
                >
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, imageUrl: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bild löschen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Sind Sie sicher, dass Sie dieses Bild löschen möchten?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Datei: {deleteDialog.imageUrl?.split('/').pop()}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, imageUrl: null })}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TournamentPage() {
  const { isAdmin, hasTournamentAccess, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
  const [boards, setBoards] = useState<DartBoard[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>({
    id: undefined,
    name: '',
    description: '',
    startDate: undefined,
    endDate: undefined,
    status: 'UPCOMING',
    maxPlayers: 64,
    entryFee: 0,
    gameMode: '501',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    mainLogo: '',
    sponsorLogos: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBoard, setSavingBoard] = useState(false);
  const [updatingBoard, setUpdatingBoard] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [newBoardDialog, setNewBoardDialog] = useState(false);
  const [editBoardDialog, setEditBoardDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<DartBoard | null>(null);
  const [newBoard, setNewBoard] = useState({ name: '', location: '' });
  const [validationErrors, setValidationErrors] = useState({ name: false, location: false });
  const [bracketConfig, setBracketConfig] = useState({
    bracketFormat: 'single',
    seedingAlgorithm: 'standard',
    autoAssignBoards: true,
    mainBoardPriority: true,
    distributeEvenly: true,
    mainBoardPriorityLevel: 'finals',
    legsPerRound: {
      round1: 1,
      round2: 1,
      round3: 3,
      round4: 3,
      round5: 5,
      round6: 7
    }
  });
  const { toast } = useToast();

  // Prüfe Berechtigung für Turnier-Management
  const canManageTournaments = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.games?.create === true || permissions.bracket?.edit === true;
  });

  useEffect(() => {
    if (isAuthenticated && canManageTournaments) {
      fetchBoards();
      fetchSettings();
      fetchBracketConfig();
    }
  }, [isAuthenticated, canManageTournaments]);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/admin/boards');
      if (response.ok) {
        const data = await response.json();
        setBoards(data.boards || []);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/tournament/settings');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded settings:', data); // Debug log
        setSettings({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: data.status || 'UPCOMING',
          maxPlayers: data.maxPlayers || 64,
          entryFee: data.entryFee || 0,
          gameMode: data.gameMode || '501',
          stripeEnabled: data.stripeEnabled || false,
          stripePublishableKey: data.stripePublishableKey || '',
          stripeSecretKey: data.stripeSecretKey || '',
          stripeWebhookSecret: data.stripeWebhookSecret || '',
          mainLogo: data.mainLogo || '',
          sponsorLogos: data.sponsorLogos && typeof data.sponsorLogos === 'string' ? JSON.parse(data.sponsorLogos) : []
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchBracketConfig = async () => {
    try {
      const response = await fetch('/api/admin/tournament/bracket-config');
      if (response.ok) {
        const data = await response.json();
        setBracketConfig(data);
      }
    } catch (error) {
      console.error('Error fetching bracket config:', error);
    }
  };

  const getTournamentStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="secondary">Bevorstehend</Badge>;
      case 'REGISTRATION_OPEN':
        return <Badge variant="default">Anmeldung offen</Badge>;
      case 'REGISTRATION_CLOSED':
        return <Badge variant="outline">Anmeldung geschlossen</Badge>;
      case 'SHOOTOUT':
        return <Badge variant="destructive">Shootout</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Aktiv</Badge>;
      case 'FINISHED':
        return <Badge variant="outline">Abgeschlossen</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Abgebrochen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const createBoard = async () => {
    const errors = {
      name: !newBoard.name.trim(),
      location: !newBoard.location.trim()
    };

    setValidationErrors(errors);

    if (errors.name || errors.location) {
      toast({
        title: "Fehler",
        description: "Bitte alle Felder ausfüllen.",
        variant: "destructive",
      });
      return;
    }

    setSavingBoard(true);
    try {
      const response = await fetch('/api/admin/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoard.name,
          location: newBoard.location,
          legSettings: { legsPerGame: 2 }
        }),
      });

      if (response.ok) {
        const newBoardData = await response.json();
        setBoards(prev => [...prev, newBoardData]);
        setNewBoard({ name: '', location: '' });
        setValidationErrors({ name: false, location: false });
        setNewBoardDialog(false);
        toast({
          title: "Erfolgreich",
          description: "Neue Dartscheibe wurde erstellt.",
        });
      } else if (response.status === 401) {
        toast({
          title: "Authentifizierung erforderlich",
          description: "Sie müssen als Administrator angemeldet sein.",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        toast({
          title: "Fehler",
          description: errorData.error || `API-Fehler: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Erstellen der Dartscheibe.",
        variant: "destructive",
      });
    } finally {
      setSavingBoard(false);
    }
  };

  const setMainBoard = async (boardId: string) => {
    try {
      const response = await fetch(`/api/admin/boards/${boardId}/set-main`, {
        method: 'POST',
      });

      if (response.ok) {
        setBoards(prev => prev.map(board => ({
          ...board,
          isMain: board.id === boardId
        })));
        toast({
          title: "Erfolgreich",
          description: "Hauptscheibe wurde aktualisiert.",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Aktualisieren der Hauptscheibe.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler.",
        variant: "destructive",
      });
    }
  };

  const deleteBoard = async (boardId: string) => {
    if (!confirm('Möchten Sie diese Dartscheibe wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBoards(prev => prev.filter(board => board.id !== boardId));
        toast({
          title: "Erfolgreich",
          description: "Dartscheibe wurde gelöscht.",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen der Dartscheibe.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Löschen der Dartscheibe.",
        variant: "destructive",
      });
    }
  };

  const updateBoardSettings = async (boardId: string, updatedBoard: DartBoard) => {
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBoard),
      });

      if (response.ok) {
        setBoards(prev => prev.map(board =>
          board.id === boardId ? updatedBoard : board
        ));
        toast({
          title: "Erfolgreich",
          description: "Dartscheiben-Einstellungen wurden aktualisiert.",
        });
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        toast({
          title: "Fehler",
          description: `Fehler beim Aktualisieren der Einstellungen: ${errorData.error || 'Unbekannter Fehler'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Aktualisieren der Einstellungen.",
        variant: "destructive",
      });
    }
  };

  const updateBoard = async () => {
    if (!selectedBoard) return;

    setUpdatingBoard(true);
    try {
      await updateBoardSettings(selectedBoard.id, selectedBoard);
      setEditBoardDialog(false);
      setSelectedBoard(null);
    } catch (error) {
      console.error('Error updating board:', error);
    } finally {
      setUpdatingBoard(false);
    }
  };

  const updateSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        startDate: settings.startDate?.toISOString().split('T')[0],
        endDate: settings.endDate?.toISOString().split('T')[0],
      };

      console.log('Saving settings:', payload); // Debug log

      const response = await fetch('/api/admin/tournament/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "Die Turnier-Einstellungen wurden erfolgreich gespeichert.",
        });
        fetchSettings();
      } else {
        toast({
          title: "Fehler beim Speichern",
          description: "Die Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Verbindungsfehler beim Speichern der Einstellungen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getBoardStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Aktiv</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inaktiv</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Wartung</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Zugriff verweigert</h1>
              <p className="text-muted-foreground">Sie haben keine Berechtigung für diese Seite.</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Turnier-Verwaltung</h1>
                    <p className="text-muted-foreground">
                      Verwalten Sie Dartscheiben und Turnier-Einstellungen
                    </p>
                  </div>
                </div>

                <div className="space-y-6 mt-6">
                  {/* Turnier-Einstellungen */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Turnier-Einstellungen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tournamentName">Turnier-Name</Label>
                          <Input
                            id="tournamentName"
                            value={settings.name}
                            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="z.B. Darts Masters Puschendorf 2025"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tournamentStatus">Status</Label>
                          <Select
                            value={settings.status}
                            onValueChange={(value: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED') =>
                              setSettings(prev => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UPCOMING">Bevorstehend</SelectItem>
                              <SelectItem value="REGISTRATION_OPEN">Anmeldung offen</SelectItem>
                              <SelectItem value="REGISTRATION_CLOSED">Anmeldung geschlossen</SelectItem>
                              <SelectItem value="SHOOTOUT">Shootout</SelectItem>
                              <SelectItem value="ACTIVE">Aktiv</SelectItem>
                              <SelectItem value="FINISHED">Abgeschlossen</SelectItem>
                              <SelectItem value="CANCELLED">Abgebrochen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tournamentDescription">Beschreibung</Label>
                        <Textarea
                          id="tournamentDescription"
                          value={settings.description}
                          onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Beschreibung des Turniers..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Startdatum</Label>
                          <DatePicker
                            date={settings.startDate}
                            onDateChange={(date) => setSettings(prev => ({ ...prev, startDate: date }))}
                            placeholder="Startdatum auswählen..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Enddatum</Label>
                          <DatePicker
                            date={settings.endDate}
                            onDateChange={(date) => setSettings(prev => ({ ...prev, endDate: date }))}
                            placeholder="Enddatum auswählen..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxPlayers">Maximale Spielerzahl</Label>
                          <Input
                            id="maxPlayers"
                            type="number"
                            value={settings.maxPlayers}
                            onChange={(e) => setSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) || 64 }))}
                            min="1"
                            max="128"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entryFee">Startgebühr (€)</Label>
                          <Input
                            id="entryFee"
                            type="number"
                            step="0.01"
                            value={settings.entryFee}
                            onChange={(e) => setSettings(prev => ({ ...prev, entryFee: parseFloat(e.target.value) || 0 }))}
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gameMode">Spielmodus</Label>
                          <Select
                            value={settings.gameMode}
                            onValueChange={(value: '501' | '301' | 'cricket') =>
                              setSettings(prev => ({ ...prev, gameMode: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="501">501</SelectItem>
                              <SelectItem value="301">301</SelectItem>
                              <SelectItem value="cricket">Cricket</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Aktueller Status:</span>
                          {getTournamentStatusBadge(settings.status)}
                        </div>
                        <LoadingButton onClick={updateSettings} loading={saving} loadingText="Speichere...">
                          Turnier-Einstellungen speichern
                        </LoadingButton>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Turnierbaum-Konfiguration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Turnierbaum-Konfiguration</CardTitle>
                      <CardDescription>
                        Erweiterte Einstellungen für Turnierbaum, Setzlisten und Scheiben-Zuordnung
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Spalte 1: Turnier-Format & Setzliste */}
                        <div className="space-y-6">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base font-semibold">Turnier-Format</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Bracket-Format</Label>
                                <Select 
                                  value={bracketConfig.bracketFormat}
                                  onValueChange={(value) => setBracketConfig({...bracketConfig, bracketFormat: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="single">
                                      <div className="flex flex-col">
                                        <span>Single Elimination</span>
                                        <span className="text-xs text-muted-foreground">Verlust = Ausgeschieden</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="double">
                                      <div className="flex flex-col">
                                        <span>Double Elimination</span>
                                        <span className="text-xs text-muted-foreground">2 Verluste = Ausgeschieden</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="roundrobin">
                                      <div className="flex flex-col">
                                        <span>Gruppen + K.O.</span>
                                        <span className="text-xs text-muted-foreground">Gruppenphase dann K.O.-Runde</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm">Setzlisten-Algorithmus</Label>
                                <Select 
                                  value={bracketConfig.seedingAlgorithm}
                                  onValueChange={(value) => setBracketConfig({...bracketConfig, seedingAlgorithm: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="standard">
                                      <div className="flex flex-col">
                                        <span>Standard (1vs64, 2vs63, ...)</span>
                                        <span className="text-xs text-muted-foreground">Beste gegen Schlechteste</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="random">
                                      <div className="flex flex-col">
                                        <span>Zufällig</span>
                                        <span className="text-xs text-muted-foreground">Komplett zufällige Paarungen</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="grouped">
                                      <div className="flex flex-col">
                                        <span>Gruppiert (Top/Bottom)</span>
                                        <span className="text-xs text-muted-foreground">Starke vs Starke, Schwache vs Schwache</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base font-semibold">Scheiben-Zuordnung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">Automatisch zuordnen</Label>
                                    <p className="text-xs text-muted-foreground">Max. {boards.length} parallele Spiele</p>
                                  </div>
                                  <Switch 
                                    checked={bracketConfig.autoAssignBoards}
                                    onCheckedChange={(checked) => setBracketConfig({...bracketConfig, autoAssignBoards: checked})}
                                  />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">Finale auf Haupt-Scheibe</Label>
                                    <p className="text-xs text-muted-foreground">Wichtige Spiele priorisieren</p>
                                  </div>
                                  <Switch 
                                    checked={bracketConfig.mainBoardPriority}
                                    onCheckedChange={(checked) => setBracketConfig({...bracketConfig, mainBoardPriority: checked})}
                                  />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold">Gleichmäßig verteilen</Label>
                                    <p className="text-xs text-muted-foreground">Alle Scheiben nutzen</p>
                                  </div>
                                  <Switch 
                                    checked={bracketConfig.distributeEvenly}
                                    onCheckedChange={(checked) => setBracketConfig({...bracketConfig, distributeEvenly: checked})}
                                  />
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <Label className="text-sm">Haupt-Scheibe Priorität</Label>
                                <Select 
                                  value={bracketConfig.mainBoardPriorityLevel}
                                  onValueChange={(value) => setBracketConfig({...bracketConfig, mainBoardPriorityLevel: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">
                                      <div className="flex flex-col">
                                        <span>Alle Runden</span>
                                        <span className="text-xs text-muted-foreground">Jedes Spiel auf Haupt-Scheibe möglich</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="semifinals">
                                      <div className="flex flex-col">
                                        <span>Ab Halbfinale</span>
                                        <span className="text-xs text-muted-foreground">Halbfinale und Finale priorisiert</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="finals">
                                      <div className="flex flex-col">
                                        <span>Nur Finale</span>
                                        <span className="text-xs text-muted-foreground">Nur das Finale auf Haupt-Scheibe</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="none">
                                      <div className="flex flex-col">
                                        <span>Keine Priorität</span>
                                        <span className="text-xs text-muted-foreground">Gleichmäßige Verteilung auf alle Scheiben</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Spalte 2: Legs-Konfiguration */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-semibold">Legs-Konfiguration</CardTitle>
                              <Badge variant="outline" className="text-xs">Best of X</Badge>
                            </div>
                            <CardDescription className="text-xs">
                              Legs pro Runde festlegen
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="legs-round1" className="text-xs text-muted-foreground">Runde 1 (64)</Label>
                                <Input 
                                  id="legs-round1"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round1}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round1: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="legs-round2" className="text-xs text-muted-foreground">Runde 2 (32)</Label>
                                <Input 
                                  id="legs-round2"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round2}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round2: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="legs-round3" className="text-xs text-muted-foreground">Achtelfinale</Label>
                                <Input 
                                  id="legs-round3"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round3}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round3: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="legs-round4" className="text-xs text-muted-foreground">Viertelfinale</Label>
                                <Input 
                                  id="legs-round4"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round4}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round4: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="legs-round5" className="text-xs text-muted-foreground">Halbfinale</Label>
                                <Input 
                                  id="legs-round5"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round5}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round5: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="legs-round6" className="text-xs text-muted-foreground">Finale</Label>
                                <Input 
                                  id="legs-round6"
                                  type="number" 
                                  value={bracketConfig.legsPerRound.round6}
                                  onChange={(e) => setBracketConfig({
                                    ...bracketConfig,
                                    legsPerRound: {...bracketConfig.legsPerRound, round6: parseInt(e.target.value) || 1}
                                  })}
                                  min="1"
                                  max="11"
                                  className="h-9" 
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">Best of X:</span> Beispiel: Bei "3" muss ein Spieler 2 Legs gewinnen
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      {/* Info-Box */}
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-start gap-3">
                          <IconInfoCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Erweiterte Konfiguration</p>
                            <p className="text-xs text-muted-foreground">
                              Einstellungen beeinflussen automatische Turnierbaum-Generierung und Scheiben-Zuordnung. 
                              Änderungen gelten für neue Bracket-Generierungen.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={async (e) => {
                          const btn = e.currentTarget;
                          const originalText = btn.textContent;
                          btn.disabled = true;
                          btn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Speichere...';
                          
                          try {
                            const response = await fetch('/api/admin/tournament/bracket-config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(bracketConfig)
                            });
                            
                            if (response.ok) {
                              toast({
                                title: "Gespeichert",
                                description: "Turnierbaum-Konfiguration wurde erfolgreich gespeichert"
                              });
                            } else {
                              throw new Error('Fehler beim Speichern');
                            }
                          } catch (error) {
                            toast({
                              title: "Fehler",
                              description: "Turnierbaum-Konfiguration konnte nicht gespeichert werden",
                              variant: "destructive"
                            });
                          } finally {
                            btn.disabled = false;
                            btn.textContent = originalText || 'Turnierbaum-Einstellungen speichern';
                          }
                        }}>
                          Turnierbaum-Einstellungen speichern
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo-Verwaltung */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo-Verwaltung</CardTitle>
                      <CardDescription>
                        Laden Sie Logos für Turnier-Bildschirme und Sponsoren hoch
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <LogoUpload
                        label="Hauptlogo"
                        value={settings.mainLogo}
                        onChange={(url) => {
                          console.log('Main logo changed to:', url);
                          setSettings(prev => ({ ...prev, mainLogo: url }));
                        }}
                        type="mainLogo"
                      />

                      <Separator />

                      <SponsorLogosUpload
                        label="Sponsor-Logos"
                        values={settings.sponsorLogos}
                        onChange={(urls) => {
                          console.log('Sponsor logos changed to:', urls);
                          setSettings(prev => ({ ...prev, sponsorLogos: urls }));
                        }}
                      />

                      <div className="flex justify-end pt-4">
                        <LoadingButton onClick={updateSettings} loading={saving} loadingText="Speichere...">
                          Logo-Einstellungen speichern
                        </LoadingButton>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hochgeladene Bilder */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Hochgeladene Bilder</CardTitle>
                      <CardDescription>
                        Alle bereits hochgeladenen Bilder in der Galerie
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UploadedImagesList />
                    </CardContent>
                  </Card>

                  {/* Stripe-Zahlungen */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Stripe-Zahlungen</CardTitle>
                      <CardDescription>
                        Konfigurieren Sie Stripe für die Zahlungsabwicklung bei Turnier-Anmeldungen
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="stripeEnabled"
                          checked={settings.stripeEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, stripeEnabled: checked }))}
                        />
                        <Label htmlFor="stripeEnabled">Stripe-Zahlungen aktivieren</Label>
                      </div>

                      {settings.stripeEnabled && (
                        <div className="space-y-4 ml-6">
                          <div className="space-y-2">
                            <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                            <Input
                              id="stripePublishableKey"
                              type="password"
                              value={settings.stripePublishableKey || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                              placeholder="pk_test_..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                            <Input
                              id="stripeSecretKey"
                              type="password"
                              value={settings.stripeSecretKey || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                              placeholder="sk_test_..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
                            <Input
                              id="stripeWebhookSecret"
                              type="password"
                              value={settings.stripeWebhookSecret || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                              placeholder="whsec_..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <LoadingButton onClick={updateSettings} loading={saving} loadingText="Speichere...">
                          Stripe-Einstellungen speichern
                        </LoadingButton>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Dartscheiben-Verwaltung */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Dartscheiben-Verwaltung ({boards.length} Scheiben)</CardTitle>
                        <Dialog open={newBoardDialog} onOpenChange={setNewBoardDialog}>
                          <DialogTrigger asChild>
                            <Button>
                              Neue Scheibe
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Neue Dartscheibe anlegen</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="boardName">Name der Scheibe</Label>
                                <Input
                                  id="boardName"
                                  placeholder="z.B. Scheibe 1"
                                  value={newBoard.name}
                                  onChange={(e) => {
                                    setNewBoard(prev => ({ ...prev, name: e.target.value }));
                                    if (validationErrors.name) {
                                      setValidationErrors(prev => ({ ...prev, name: false }));
                                    }
                                  }}
                                  className={validationErrors.name ? "border-red-500 focus:border-red-500" : ""}
                                />
                                {validationErrors.name && (
                                  <p className="text-sm text-red-500">Dieses Feld ist erforderlich</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="boardLocation">Standort</Label>
                                <Input
                                  id="boardLocation"
                                  placeholder="z.B. Haupthalle"
                                  value={newBoard.location}
                                  onChange={(e) => {
                                    setNewBoard(prev => ({ ...prev, location: e.target.value }));
                                    if (validationErrors.location) {
                                      setValidationErrors(prev => ({ ...prev, location: false }));
                                    }
                                  }}
                                  className={validationErrors.location ? "border-red-500 focus:border-red-500" : ""}
                                />
                                {validationErrors.location && (
                                  <p className="text-sm text-red-500">Dieses Feld ist erforderlich</p>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setNewBoardDialog(false)} disabled={savingBoard}>
                                  Abbrechen
                                </Button>
                                <LoadingButton onClick={createBoard} loading={savingBoard} loadingText="Erstelle...">
                                  Erstellen
                                </LoadingButton>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Lade Dartscheiben...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {boards.map((board) => (
                            <Card key={board.id} className="relative">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg">
                                      {board.name}
                                    </CardTitle>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => setMainBoard(board.id)}
                                      title={board.isMain ? "Ist Hauptscheibe" : "Als Hauptscheibe festlegen"}
                                    >
                                      <Star 
                                        className={`h-4 w-4 ${board.isMain ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} 
                                      />
                                    </Button>
                                  </div>
                                  {getBoardStatusBadge(board.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{board.location}</p>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {/* Legs-Konfiguration Anzeige */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-semibold">Legs-Konfiguration</Label>
                                    <Badge variant="outline" className="text-xs">Best of X</Badge>
                                  </div>
                                  
                                  <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Runde 1 (64)</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round1} Leg{bracketConfig.legsPerRound.round1 > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Runde 2 (32)</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round2} Leg{bracketConfig.legsPerRound.round2 > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Achtelfinale</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round3} Leg{bracketConfig.legsPerRound.round3 > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Viertelfinale</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round4} Leg{bracketConfig.legsPerRound.round4 > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Halbfinale</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round5} Leg{bracketConfig.legsPerRound.round5 > 1 ? 's' : ''}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Finale</span>
                                        <span className="font-semibold">{bracketConfig.legsPerRound.round6} Leg{bracketConfig.legsPerRound.round6 > 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground">
                                    Einstellungen aus Turnierbaum-Konfiguration
                                  </p>
                                </div>

                                {/* Aktuelles Spiel */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Aktuelles Spiel</Label>
                                  {board.currentGame ? (
                                    <div className="p-3 bg-muted rounded-lg">
                                      <div className="text-sm font-medium">
                                        {board.currentGame.player1} vs {board.currentGame.player2}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {board.currentGame.score1} - {board.currentGame.score2}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                      <span className="text-sm text-muted-foreground">Kein aktives Spiel</span>
                                    </div>
                                  )}
                                </div>

                                {/* Access Code */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Access Code</Label>
                                  <div
                                    className="p-3 bg-muted/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted group"
                                    onClick={() => {
                                      navigator.clipboard.writeText(board.accessCode);
                                      toast({
                                        title: "Access Code kopiert",
                                        description: `Code ${board.accessCode} wurde in die Zwischenablage kopiert.`,
                                      });
                                    }}
                                    title="Klicken zum Kopieren"
                                  >
                                    <span className="text-sm font-mono font-medium select-none filter blur-sm group-hover:blur-none transition-all duration-200">
                                      {board.accessCode}
                                    </span>
                                  </div>
                                </div>

                                {/* Aktionen */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedBoard(board);
                                      setEditBoardDialog(true);
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteBoard(board.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    Löschen
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {boards.length === 0 && !loading && (
                        <Card className="p-8">
                          <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">Keine Dartscheiben vorhanden</h3>
                            <p className="text-muted-foreground mb-4">
                              Erstellen Sie Ihre erste Dartscheibe, um mit der Turnier-Verwaltung zu beginnen.
                            </p>
                            <Button onClick={() => setNewBoardDialog(true)}>
                              Erste Scheibe erstellen
                            </Button>
                          </div>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Edit Board Dialog */}
                <Dialog open={editBoardDialog} onOpenChange={setEditBoardDialog}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Dartscheibe bearbeiten</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Bearbeiten Sie die Einstellungen für diese Dartscheibe.
                      </p>
                    </DialogHeader>
                    {selectedBoard && (
                      <div className="space-y-6">
                        {/* Grunddaten */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editBoardName">Name der Scheibe</Label>
                            <Input
                              id="editBoardName"
                              value={selectedBoard.name}
                              onChange={(e) => setSelectedBoard(prev => prev ? { ...prev, name: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editBoardLocation">Standort</Label>
                            <Input
                              id="editBoardLocation"
                              value={selectedBoard.location}
                              onChange={(e) => setSelectedBoard(prev => prev ? { ...prev, location: e.target.value } : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editBoardStatus">Status</Label>
                            <Select
                              value={selectedBoard.status}
                              onValueChange={(value: 'active' | 'inactive' | 'maintenance') =>
                                setSelectedBoard(prev => prev ? { ...prev, status: value } : null)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Aktiv</SelectItem>
                                <SelectItem value="inactive">Inaktiv</SelectItem>
                                <SelectItem value="maintenance">Wartung</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Einfache Leg-Einstellungen */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Legs pro Spiel</Label>
                          <Select
                            value={(selectedBoard.legSettings?.legsPerGame || 2).toString()}
                            onValueChange={(value) => {
                              setSelectedBoard(prev => prev ? {
                                ...prev,
                                legSettings: {
                                  legsPerGame: parseInt(value)
                                }
                              } : null);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Leg</SelectItem>
                              <SelectItem value="2">2 Legs</SelectItem>
                              <SelectItem value="3">3 Legs</SelectItem>
                              <SelectItem value="4">4 Legs</SelectItem>
                              <SelectItem value="5">5 Legs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditBoardDialog(false)} disabled={updatingBoard}>
                            Abbrechen
                          </Button>
                          <LoadingButton onClick={updateBoard} loading={updatingBoard} loadingText="Speichere...">
                            Speichern
                          </LoadingButton>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
