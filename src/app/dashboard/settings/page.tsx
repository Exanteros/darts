"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';

interface TournamentSettings {
  id?: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  maxPlayers: number;
  entryFee: number;
}

interface BoardSettings {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  priority: number;
  legSettings: {
    legsPerGame: number;
  };
}

interface SystemSettings {
  id: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxConcurrentGames: number;
  autoSaveInterval: number;
  logLevel: string;
  websocketTimeout: number;
  cacheTimeout: number;
  maxConnections: number;
  monitoringInterval: number;
}

export default function SettingsPage() {
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
    const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings>({
    id: undefined,
    name: '',
    description: '',
    startDate: undefined,
    endDate: undefined,
    status: 'UPCOMING',
    maxPlayers: 64,
    entryFee: 0
  });
  const [boards, setBoards] = useState<BoardSettings[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: 'default',
    maintenanceMode: false,
    allowRegistration: true,
    maxConcurrentGames: 8,
    autoSaveInterval: 30,
    logLevel: 'info',
    websocketTimeout: 30000,
    cacheTimeout: 3600,
    maxConnections: 100,
    monitoringInterval: 60
  });
  
  // Broadcasting Settings
  const [obsUrl, setObsUrl] = useState('ws://localhost:4455');
  const [obsPassword, setObsPassword] = useState('');
  const [displayRefresh, setDisplayRefresh] = useState(1000);
  const [transitionDuration, setTransitionDuration] = useState(500);
  const [overlayWidth, setOverlayWidth] = useState(1920);
  const [overlayHeight, setOverlayHeight] = useState(1080);
  const [fontSize, setFontSize] = useState(48);
  
  // Statistics Settings
  const [dataRetention, setDataRetention] = useState(365);
  const [exportCsv, setExportCsv] = useState(true);
  const [exportJson, setExportJson] = useState(true);
  const [exportPdf, setExportPdf] = useState(false);
  const [backupInterval, setBackupInterval] = useState(24);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSettings();
      fetchBoards();
      fetchSystemSettings();
      loadBroadcastingSettings();
    }
  }, [isAuthenticated, isAdmin]);

  const loadBroadcastingSettings = async () => {
    try {
      const response = await fetch('/api/admin/broadcasting');
      if (response.ok) {
        const data = await response.json();
        setObsUrl(data.obsUrl || 'ws://localhost:4455');
        setObsPassword(data.obsPassword || '');
        setDisplayRefresh(data.displayRefresh || 1000);
        setTransitionDuration(data.transitionDuration || 500);
        setOverlayWidth(data.overlayWidth || 1920);
        setOverlayHeight(data.overlayHeight || 1080);
        setFontSize(data.fontSize || 48);
      }
    } catch (error) {
      console.error('Error loading broadcasting settings:', error);
    }
  };

  const saveBroadcastingSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/broadcasting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obsUrl,
          obsPassword,
          displayRefresh,
          transitionDuration,
          overlayWidth,
          overlayHeight,
          fontSize,
        }),
      });

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "Broadcasting-Einstellungen wurden aktualisiert.",
        });
      } else {
        toast({
          title: "Fehler beim Speichern",
          description: "Die Broadcasting-Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Verbindungsfehler beim Speichern.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveStatisticsSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: "Gespeichert",
        description: "Statistik-Einstellungen wurden lokal gespeichert.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSystemSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings),
      });

      if (response.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: "System-Einstellungen wurden aktualisiert.",
        });
        await fetchSystemSettings();
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/tournament/settings');
      if (response.ok) {
        const data = await response.json();
        setTournamentSettings({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: data.status || 'UPCOMING',
          maxPlayers: data.maxPlayers || 64,
          entryFee: data.entryFee || 0
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/admin/boards');
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/system/settings');
      if (response.ok) {
        const data = await response.json();
        setSystemSettings({
          id: data.id || 'default',
          maintenanceMode: data.maintenanceMode || false,
          allowRegistration: data.allowRegistration || true,
          maxConcurrentGames: data.maxConcurrentGames || 8,
          autoSaveInterval: data.autoSaveInterval || 30,
          logLevel: data.logLevel || 'info',
          websocketTimeout: data.websocketTimeout || 30000,
          cacheTimeout: data.cacheTimeout || 3600,
          maxConnections: data.maxConnections || 100,
          monitoringInterval: data.monitoringInterval || 60
        });
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  const saveTournamentSettings = async () => {
    try {
      const payload = {
        ...tournamentSettings,
        startDate: tournamentSettings.startDate?.toISOString().split('T')[0],
        endDate: tournamentSettings.endDate?.toISOString().split('T')[0],
      };

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
    }
  };



  const updateBoardSettings = async (boardId: string, updatedBoard: BoardSettings) => {
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
          description: "Scheiben-Einstellungen wurden aktualisiert.",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Aktualisieren der Scheibe.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Aktualisieren.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge variant="secondary">Bevorstehend</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Aktiv</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Abgeschlossen</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Abgebrochen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
                    <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
                    <p className="text-muted-foreground">
                      Verwalten Sie alle Turnier- und System-Einstellungen
                    </p>
                  </div>
                </div>

                <div className="space-y-6 mt-6">
                  {/* System-Einstellungen */}
                  <Card>
                    <CardHeader>
                      <CardTitle>System-Einstellungen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Performance & Zuverlässigkeit</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="websocketTimeout">WebSocket Timeout (ms)</Label>
                            <Input
                              id="websocketTimeout"
                              type="number"
                              value={systemSettings.websocketTimeout}
                              onChange={(e) => setSystemSettings(prev => ({ ...prev, websocketTimeout: parseInt(e.target.value) || 30000 }))}
                              placeholder="30000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cacheTimeout">Cache Timeout (sek)</Label>
                            <Input
                              id="cacheTimeout"
                              type="number"
                              value={systemSettings.cacheTimeout}
                              onChange={(e) => setSystemSettings(prev => ({ ...prev, cacheTimeout: parseInt(e.target.value) || 3600 }))}
                              placeholder="3600"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxConnections">Maximale Verbindungen</Label>
                          <Input
                            id="maxConnections"
                            type="number"
                            value={systemSettings.maxConnections}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maxConnections: parseInt(e.target.value) || 100 }))}
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Logging & Monitoring</h3>

                        <div className="space-y-2">
                          <Label htmlFor="logLevel">Log-Level</Label>
                          <Select 
                            value={systemSettings.logLevel} 
                            onValueChange={(value) => setSystemSettings(prev => ({ ...prev, logLevel: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="error">Nur Fehler</SelectItem>
                              <SelectItem value="warn">Warnungen</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="debug">Debug</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="monitoringInterval">Monitoring-Intervall (sek)</Label>
                          <Input
                            id="monitoringInterval"
                            type="number"
                            value={systemSettings.monitoringInterval}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, monitoringInterval: parseInt(e.target.value) || 60 }))}
                            placeholder="60"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={saveSystemSettings} disabled={saving}>
                          {saving ? 'Wird gespeichert...' : 'System-Einstellungen speichern'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistiken-Einstellungen */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistiken & Export</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="dataRetention">Datenaufbewahrung (Tage)</Label>
                          <Input
                            id="dataRetention"
                            type="number"
                            defaultValue="365"
                            placeholder="365"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Export-Formate</Label>
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="exportCsv" defaultChecked />
                              <Label htmlFor="exportCsv">CSV</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="exportJson" defaultChecked />
                              <Label htmlFor="exportJson">JSON</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="exportPdf" />
                              <Label htmlFor="exportPdf">PDF</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="backupInterval">Automatisches Backup (Stunden)</Label>
                          <Input
                            id="backupInterval"
                            type="number"
                            defaultValue="24"
                            placeholder="24"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={saveStatisticsSettings} disabled={saving}>
                          {saving ? 'Wird gespeichert...' : 'Statistik-Einstellungen speichern'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Broadcasting-Einstellungen */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Broadcasting & Anzeige</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="obsUrl">OBS WebSocket URL</Label>
                          <Input
                            id="obsUrl"
                            defaultValue="ws://localhost:4455"
                            placeholder="ws://localhost:4455"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="obsPassword">OBS WebSocket Passwort</Label>
                          <Input
                            id="obsPassword"
                            type="password"
                            placeholder="Optional"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="displayRefresh">Anzeige-Aktualisierung (ms)</Label>
                          <Input
                            id="displayRefresh"
                            type="number"
                            defaultValue="1000"
                            placeholder="1000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transitionDuration">Übergangsdauer (ms)</Label>
                          <Input
                            id="transitionDuration"
                            type="number"
                            defaultValue="500"
                            placeholder="500"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Overlay-Konfiguration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="overlayWidth">Overlay Breite (px)</Label>
                            <Input
                              id="overlayWidth"
                              type="number"
                              defaultValue="1920"
                              placeholder="1920"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="overlayHeight">Overlay Höhe (px)</Label>
                            <Input
                              id="overlayHeight"
                              type="number"
                              defaultValue="1080"
                              placeholder="1080"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fontSize">Schriftgröße (px)</Label>
                          <Input
                            id="fontSize"
                            type="number"
                            defaultValue="48"
                            placeholder="48"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={saveBroadcastingSettings} disabled={saving}>
                          {saving ? 'Wird gespeichert...' : 'Broadcasting-Einstellungen speichern'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Turnierbaum-Einstellungen */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Turnierbaum & Scheiben-Zuordnung</CardTitle>
                        <Button asChild variant="outline">
                          <a href="/dashboard/tournament">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Konfigurieren
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Setzlisten-Algorithmus</Label>
                            <div className="p-3 bg-gray-50 rounded-md">
                              <p className="font-medium">Standard (1vs64, 2vs63, ...)</p>
                              <p className="text-sm text-muted-foreground">Ausgewogene Paarungen nach Setzposition</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Mindest-Pausenzeit</Label>
                            <div className="p-3 bg-gray-50 rounded-md">
                              <p className="font-medium">10 Minuten</p>
                              <p className="text-sm text-muted-foreground">Zwischen den Spielen</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Haupt-Scheibe Priorität</Label>
                            <div className="p-3 bg-gray-50 rounded-md">
                              <p className="font-medium">Finale & Halbfinale</p>
                              <p className="text-sm text-muted-foreground">Wichtige Spiele auf bester Scheibe</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Automatische Zuordnung</Label>
                            <div className="p-3 bg-gray-50 rounded-md">
                              <p className="font-medium">Aktiviert</p>
                              <p className="text-sm text-muted-foreground">Spiele werden automatisch zugeordnet</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium text-blue-900">Turnierbaum-Konfiguration</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Die detaillierte Konfiguration des Turnierbaums, Setzlisten-Algorithmus und
                                Scheiben-Zuordnung erfolgt in der Turnier-Verwaltung für eine optimale Übersicht.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
