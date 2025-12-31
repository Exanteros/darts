"use client";

import { useEffect, useState } from "react";
import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Edit2, Shield, Clock, Mail, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TournamentPermissions, ROLE_PERMISSIONS, mergePermissions } from "@/lib/permissions";

interface AccessGrant {
  id: string;
  tournamentId: string;
  userId: string;
  role: string;
  grantedAt: string;
  grantedBy: string | null;
  expiresAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

export default function TournamentAccessPage() {
  const { isAdmin, hasTournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("VIEWER");
  const [newUserExpires, setNewUserExpires] = useState("");
  const [customPermissions, setCustomPermissions] = useState<Partial<TournamentPermissions>>(
    ROLE_PERMISSIONS.VIEWER
  );
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchAccessGrants();
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/admin/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
        if (data.tournaments?.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(data.tournaments[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchAccessGrants = async () => {
    if (!selectedTournamentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tournament/access?tournamentId=${selectedTournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setAccessGrants(data.accessGrants || []);
      }
    } catch (error) {
      console.error('Error fetching access grants:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAccessGrant = async () => {
    if (!selectedTournamentId || !newUserEmail || !newUserRole) return;

    const permissions = useCustomPermissions 
      ? JSON.stringify(customPermissions)
      : JSON.stringify(ROLE_PERMISSIONS[newUserRole as keyof typeof ROLE_PERMISSIONS] || {});

    try {
      const response = await fetch('/api/admin/tournament/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          userEmail: newUserEmail,
          role: newUserRole,
          expiresAt: newUserExpires || null,
          permissions
        })
      });

      if (response.ok) {
        setDialogOpen(false);
        setNewUserEmail("");
        setNewUserRole("VIEWER");
        setNewUserExpires("");
        setCustomPermissions(ROLE_PERMISSIONS.VIEWER);
        setUseCustomPermissions(false);
        fetchAccessGrants();
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('Error adding access grant:', error);
      alert('Fehler beim Hinzufügen');
    }
  };

  const deleteAccessGrant = async (accessId: string) => {
    if (!confirm('Zugriff wirklich entfernen?')) return;

    try {
      const response = await fetch(`/api/admin/tournament/access?id=${accessId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAccessGrants();
      }
    } catch (error) {
      console.error('Error deleting access grant:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'MANAGER': return 'secondary';
      case 'OPERATOR': return 'outline';
      case 'VIEWER': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Manager';
      case 'OPERATOR': return 'Operator';
      case 'VIEWER': return 'Zuschauer';
      default: return role;
    }
  };

  const handleRoleChange = (role: string) => {
    setNewUserRole(role);
    const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    if (rolePermissions) {
      setCustomPermissions(rolePermissions);
    }
  };

  const updatePermission = (category: keyof TournamentPermissions, action: string, value: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [action]: value
      }
    }));
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  // Loading state
  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-muted-foreground">Überprüfe Berechtigung...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Authentication check
  if (!isAuthenticated || (!isAdmin && !hasTournamentAccess)) {
    return null;
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
              <div className="px-4 lg:px-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
                    <p className="text-muted-foreground mt-2">
                      Verwalte Zugriffsberechtigungen für Turniere
                    </p>
                  </div>
                </div>

                {/* Tournament Selection */}
                <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Turnier auswählen
          </CardTitle>
          <CardDescription>
            Wähle ein Turnier aus, um die Zugriffsberechtigungen zu verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger>
              <SelectValue placeholder="Turnier auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Access Grants List */}
      {selectedTournamentId && (
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Berechtigte Benutzer
                </CardTitle>
                <CardDescription>
                  {selectedTournament?.name}
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Benutzer hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Benutzer hinzufügen</DialogTitle>
                    <DialogDescription>
                      Füge einen Benutzer mit spezifischen Rechten hinzu
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rolle</Label>
                      <Select value={newUserRole} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">Zuschauer (nur Ansicht)</SelectItem>
                          <SelectItem value="OPERATOR">Operator (Scheiben & Spiele)</SelectItem>
                          <SelectItem value="MANAGER">Manager (fast alles)</SelectItem>
                          <SelectItem value="ADMIN">Administrator (voller Zugriff)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expires">Ablaufdatum (optional)</Label>
                      <Input
                        id="expires"
                        type="datetime-local"
                        value={newUserExpires}
                        onChange={(e) => setNewUserExpires(e.target.value)}
                      />
                    </div>

                    {/* Custom Permissions Toggle */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Checkbox 
                        id="customPerms"
                        checked={useCustomPermissions}
                        onCheckedChange={(checked) => setUseCustomPermissions(checked as boolean)}
                      />
                      <Label 
                        htmlFor="customPerms" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Benutzerdefinierte Berechtigungen
                      </Label>
                    </div>

                    {/* Granular Permissions Accordion */}
                    {useCustomPermissions && (
                      <div className="max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-muted/30">
                        <Accordion type="multiple" className="w-full">
                          {/* Dashboard */}
                          <AccordionItem value="dashboard">
                            <AccordionTrigger className="text-sm font-medium">
                              Dashboard & Übersicht
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="dashboard-view"
                                    checked={customPermissions.dashboard?.view}
                                    onCheckedChange={(checked) => updatePermission('dashboard', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="dashboard-view" className="text-sm cursor-pointer">Dashboard ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="dashboard-viewStats"
                                    checked={customPermissions.dashboard?.viewStats}
                                    onCheckedChange={(checked) => updatePermission('dashboard', 'viewStats', checked as boolean)}
                                  />
                                  <Label htmlFor="dashboard-viewStats" className="text-sm cursor-pointer">Statistiken einsehen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Players */}
                          <AccordionItem value="players">
                            <AccordionTrigger className="text-sm font-medium">
                              Spieler-Verwaltung
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="players-view"
                                    checked={customPermissions.players?.view}
                                    onCheckedChange={(checked) => updatePermission('players', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="players-view" className="text-sm cursor-pointer">Spielerliste ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="players-create"
                                    checked={customPermissions.players?.create}
                                    onCheckedChange={(checked) => updatePermission('players', 'create', checked as boolean)}
                                  />
                                  <Label htmlFor="players-create" className="text-sm cursor-pointer">Spieler hinzufügen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="players-edit"
                                    checked={customPermissions.players?.edit}
                                    onCheckedChange={(checked) => updatePermission('players', 'edit', checked as boolean)}
                                  />
                                  <Label htmlFor="players-edit" className="text-sm cursor-pointer">Spieler bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="players-delete"
                                    checked={customPermissions.players?.delete}
                                    onCheckedChange={(checked) => updatePermission('players', 'delete', checked as boolean)}
                                  />
                                  <Label htmlFor="players-delete" className="text-sm cursor-pointer">Spieler löschen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="players-viewStats"
                                    checked={customPermissions.players?.viewStats}
                                    onCheckedChange={(checked) => updatePermission('players', 'viewStats', checked as boolean)}
                                  />
                                  <Label htmlFor="players-viewStats" className="text-sm cursor-pointer">Spieler-Statistiken einsehen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Games */}
                          <AccordionItem value="games">
                            <AccordionTrigger className="text-sm font-medium">
                              Spiele-Verwaltung
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-view"
                                    checked={customPermissions.games?.view}
                                    onCheckedChange={(checked) => updatePermission('games', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="games-view" className="text-sm cursor-pointer">Spiele ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-create"
                                    checked={customPermissions.games?.create}
                                    onCheckedChange={(checked) => updatePermission('games', 'create', checked as boolean)}
                                  />
                                  <Label htmlFor="games-create" className="text-sm cursor-pointer">Neue Spiele erstellen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-start"
                                    checked={customPermissions.games?.start}
                                    onCheckedChange={(checked) => updatePermission('games', 'start', checked as boolean)}
                                  />
                                  <Label htmlFor="games-start" className="text-sm cursor-pointer">Spiele starten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-edit"
                                    checked={customPermissions.games?.edit}
                                    onCheckedChange={(checked) => updatePermission('games', 'edit', checked as boolean)}
                                  />
                                  <Label htmlFor="games-edit" className="text-sm cursor-pointer">Spielstände bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-finish"
                                    checked={customPermissions.games?.finish}
                                    onCheckedChange={(checked) => updatePermission('games', 'finish', checked as boolean)}
                                  />
                                  <Label htmlFor="games-finish" className="text-sm cursor-pointer">Spiele beenden</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="games-assignBoards"
                                    checked={customPermissions.games?.assignBoards}
                                    onCheckedChange={(checked) => updatePermission('games', 'assignBoards', checked as boolean)}
                                  />
                                  <Label htmlFor="games-assignBoards" className="text-sm cursor-pointer">Scheiben zuweisen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Bracket */}
                          <AccordionItem value="bracket">
                            <AccordionTrigger className="text-sm font-medium">
                              Bracket/Turnierbaum
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="bracket-view"
                                    checked={customPermissions.bracket?.view}
                                    onCheckedChange={(checked) => updatePermission('bracket', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="bracket-view" className="text-sm cursor-pointer">Turnierbaum ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="bracket-edit"
                                    checked={customPermissions.bracket?.edit}
                                    onCheckedChange={(checked) => updatePermission('bracket', 'edit', checked as boolean)}
                                  />
                                  <Label htmlFor="bracket-edit" className="text-sm cursor-pointer">Turnierbaum bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="bracket-advance"
                                    checked={customPermissions.bracket?.advance}
                                    onCheckedChange={(checked) => updatePermission('bracket', 'advance', checked as boolean)}
                                  />
                                  <Label htmlFor="bracket-advance" className="text-sm cursor-pointer">Spieler vorrücken</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="bracket-resetRounds"
                                    checked={customPermissions.bracket?.resetRounds}
                                    onCheckedChange={(checked) => updatePermission('bracket', 'resetRounds', checked as boolean)}
                                  />
                                  <Label htmlFor="bracket-resetRounds" className="text-sm cursor-pointer">Runden zurücksetzen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Shootout */}
                          <AccordionItem value="shootout">
                            <AccordionTrigger className="text-sm font-medium">
                              Shootout
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="shootout-view"
                                    checked={customPermissions.shootout?.view}
                                    onCheckedChange={(checked) => updatePermission('shootout', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="shootout-view" className="text-sm cursor-pointer">Shootout-Status ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="shootout-manage"
                                    checked={customPermissions.shootout?.manage}
                                    onCheckedChange={(checked) => updatePermission('shootout', 'manage', checked as boolean)}
                                  />
                                  <Label htmlFor="shootout-manage" className="text-sm cursor-pointer">Shootout durchführen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="shootout-selectPlayer"
                                    checked={customPermissions.shootout?.selectPlayer}
                                    onCheckedChange={(checked) => updatePermission('shootout', 'selectPlayer', checked as boolean)}
                                  />
                                  <Label htmlFor="shootout-selectPlayer" className="text-sm cursor-pointer">Spieler auswählen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="shootout-enterScores"
                                    checked={customPermissions.shootout?.enterScores}
                                    onCheckedChange={(checked) => updatePermission('shootout', 'enterScores', checked as boolean)}
                                  />
                                  <Label htmlFor="shootout-enterScores" className="text-sm cursor-pointer">Ergebnisse eingeben</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="shootout-finish"
                                    checked={customPermissions.shootout?.finish}
                                    onCheckedChange={(checked) => updatePermission('shootout', 'finish', checked as boolean)}
                                  />
                                  <Label htmlFor="shootout-finish" className="text-sm cursor-pointer">Shootout beenden</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Boards */}
                          <AccordionItem value="boards">
                            <AccordionTrigger className="text-sm font-medium">
                              Scheiben-Verwaltung
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="boards-view"
                                    checked={customPermissions.boards?.view}
                                    onCheckedChange={(checked) => updatePermission('boards', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="boards-view" className="text-sm cursor-pointer">Scheiben ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="boards-create"
                                    checked={customPermissions.boards?.create}
                                    onCheckedChange={(checked) => updatePermission('boards', 'create', checked as boolean)}
                                  />
                                  <Label htmlFor="boards-create" className="text-sm cursor-pointer">Neue Scheiben erstellen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="boards-edit"
                                    checked={customPermissions.boards?.edit}
                                    onCheckedChange={(checked) => updatePermission('boards', 'edit', checked as boolean)}
                                  />
                                  <Label htmlFor="boards-edit" className="text-sm cursor-pointer">Scheiben bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="boards-delete"
                                    checked={customPermissions.boards?.delete}
                                    onCheckedChange={(checked) => updatePermission('boards', 'delete', checked as boolean)}
                                  />
                                  <Label htmlFor="boards-delete" className="text-sm cursor-pointer">Scheiben löschen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="boards-setMain"
                                    checked={customPermissions.boards?.setMain}
                                    onCheckedChange={(checked) => updatePermission('boards', 'setMain', checked as boolean)}
                                  />
                                  <Label htmlFor="boards-setMain" className="text-sm cursor-pointer">Hauptscheibe festlegen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Settings */}
                          <AccordionItem value="settings">
                            <AccordionTrigger className="text-sm font-medium">
                              Einstellungen
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="settings-viewGeneral"
                                    checked={customPermissions.settings?.viewGeneral}
                                    onCheckedChange={(checked) => updatePermission('settings', 'viewGeneral', checked as boolean)}
                                  />
                                  <Label htmlFor="settings-viewGeneral" className="text-sm cursor-pointer">Allgemeine Einstellungen ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="settings-editGeneral"
                                    checked={customPermissions.settings?.editGeneral}
                                    onCheckedChange={(checked) => updatePermission('settings', 'editGeneral', checked as boolean)}
                                  />
                                  <Label htmlFor="settings-editGeneral" className="text-sm cursor-pointer">Allgemeine Einstellungen bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="settings-viewBracket"
                                    checked={customPermissions.settings?.viewBracket}
                                    onCheckedChange={(checked) => updatePermission('settings', 'viewBracket', checked as boolean)}
                                  />
                                  <Label htmlFor="settings-viewBracket" className="text-sm cursor-pointer">Bracket-Einstellungen ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="settings-editBracket"
                                    checked={customPermissions.settings?.editBracket}
                                    onCheckedChange={(checked) => updatePermission('settings', 'editBracket', checked as boolean)}
                                  />
                                  <Label htmlFor="settings-editBracket" className="text-sm cursor-pointer">Bracket-Einstellungen bearbeiten</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="settings-manageLogo"
                                    checked={customPermissions.settings?.manageLogo}
                                    onCheckedChange={(checked) => updatePermission('settings', 'manageLogo', checked as boolean)}
                                  />
                                  <Label htmlFor="settings-manageLogo" className="text-sm cursor-pointer">Logo verwalten</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Mail */}
                          <AccordionItem value="mail">
                            <AccordionTrigger className="text-sm font-medium">
                              Mail-Verwaltung
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="mail-view"
                                    checked={customPermissions.mail?.view}
                                    onCheckedChange={(checked) => updatePermission('mail', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="mail-view" className="text-sm cursor-pointer">Mail-Templates ansehen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="mail-send"
                                    checked={customPermissions.mail?.send}
                                    onCheckedChange={(checked) => updatePermission('mail', 'send', checked as boolean)}
                                  />
                                  <Label htmlFor="mail-send" className="text-sm cursor-pointer">Mails versenden</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="mail-editTemplates"
                                    checked={customPermissions.mail?.editTemplates}
                                    onCheckedChange={(checked) => updatePermission('mail', 'editTemplates', checked as boolean)}
                                  />
                                  <Label htmlFor="mail-editTemplates" className="text-sm cursor-pointer">Templates bearbeiten</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Live */}
                          <AccordionItem value="live">
                            <AccordionTrigger className="text-sm font-medium">
                              Live-Überwachung
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="live-view"
                                    checked={customPermissions.live?.view}
                                    onCheckedChange={(checked) => updatePermission('live', 'view', checked as boolean)}
                                  />
                                  <Label htmlFor="live-view" className="text-sm cursor-pointer">Live-Ansicht nutzen</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="live-control"
                                    checked={customPermissions.live?.control}
                                    onCheckedChange={(checked) => updatePermission('live', 'control', checked as boolean)}
                                  />
                                  <Label htmlFor="live-control" className="text-sm cursor-pointer">Live-Steuerung</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Search */}
                          <AccordionItem value="search">
                            <AccordionTrigger className="text-sm font-medium">
                              Suche
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="search-use"
                                    checked={customPermissions.search?.use}
                                    onCheckedChange={(checked) => updatePermission('search', 'use', checked as boolean)}
                                  />
                                  <Label htmlFor="search-use" className="text-sm cursor-pointer">Suchfunktion nutzen</Label>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    <Button onClick={addAccessGrant} className="w-full">
                      Hinzufügen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Lade...</p>
            ) : accessGrants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Benutzer mit Zugriff. Füge Benutzer hinzu, um ihnen Zugriff zu gewähren.
              </p>
            ) : (
              <div className="space-y-3">
                {accessGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{grant.user.email}</span>
                          {grant.user.name && (
                            <span className="text-sm text-muted-foreground">
                              ({grant.user.name})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant={getRoleBadgeVariant(grant.role)}>
                            {getRoleLabel(grant.role)}
                          </Badge>
                          {grant.expiresAt && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Läuft ab: {new Date(grant.expiresAt).toLocaleDateString('de-DE')}
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground">
                            Hinzugefügt: {new Date(grant.grantedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccessGrant(grant.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

                {/* Role Explanation */}
                <Card className="border shadow-sm bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Rollen-Erklärung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">VIEWER</Badge>
                      <p className="text-muted-foreground">Kann nur Turnierdaten ansehen, keine Änderungen</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">OPERATOR</Badge>
                      <p className="text-muted-foreground">Kann Scheiben verwalten, Spiele starten, Shootout durchführen</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary">MANAGER</Badge>
                      <p className="text-muted-foreground">Kann fast alles verwalten außer Benutzerzugriffe</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="default">ADMIN</Badge>
                      <p className="text-muted-foreground">Voller Zugriff inkl. Benutzerverwaltung</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
