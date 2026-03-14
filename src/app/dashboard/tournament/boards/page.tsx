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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function TournamentBoardsPage() {
  const { isAdmin, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
  const [boards, setBoards] = useState<DartBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBoard, setSavingBoard] = useState(false);
  const [updatingBoard, setUpdatingBoard] = useState(false);
  const [newBoardDialog, setNewBoardDialog] = useState(false);
  const [editBoardDialog, setEditBoardDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<DartBoard | null>(null);
  const [newBoard, setNewBoard] = useState({ name: '', location: '' });
  const [validationErrors, setValidationErrors] = useState({ name: false, location: false });
  const { toast } = useToast();

  const canManageTournaments = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.games?.create === true || permissions.bracket?.edit === true;
  });

  useEffect(() => {
    if (isAuthenticated && canManageTournaments) {
      fetchBoards();
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

  if (!isAuthenticated || (!isAdmin && !canManageTournaments)) {
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dartscheiben-Verwaltung</h1>
                    <p className="text-muted-foreground">
                      Verwalten Sie Ihre Dartscheiben
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Dartscheiben-Verwaltung */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Dartscheiben ({boards.length})</CardTitle>
                        <Dialog open={newBoardDialog} onOpenChange={setNewBoardDialog}>
                          <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
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