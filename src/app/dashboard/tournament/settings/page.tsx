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
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';

interface TournamentSettings {
  id?: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED' | 'WAITLIST';
  maxPlayers: number;
  entryFee: number;
  gameMode: '501' | '301' | 'cricket';
  checkoutMode: 'DOUBLE_OUT' | 'SINGLE_OUT' | 'MASTER_OUT';
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeConnected?: boolean;
  stripeAccountId?: string;
  mainLogo: string;
  sponsorLogos: string[];
  location: string;
  street: string;
}

export default function TournamentSettingsPage() {
  const { isAdmin, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
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
    checkoutMode: 'DOUBLE_OUT',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    mainLogo: '',
    sponsorLogos: [],
    location: '',
    street: ''
  });
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const canManageTournaments = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.games?.create === true || permissions.bracket?.edit === true;
  });

  useEffect(() => {
    if (isAuthenticated && canManageTournaments) {
      fetchSettings();
    }
  }, [isAuthenticated, canManageTournaments]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/tournament/settings');
      if (response.ok) {
        const data = await response.json();
        setInitialStatus(data.status || 'UPCOMING');
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
          checkoutMode: data.checkoutMode || 'DOUBLE_OUT',
          stripeEnabled: data.stripeEnabled || false,
          stripePublishableKey: data.stripePublishableKey || '',
          stripeSecretKey: data.stripeSecretKey || '',
          stripeWebhookSecret: data.stripeWebhookSecret || '',
          mainLogo: data.mainLogo || '',
          sponsorLogos: data.sponsorLogos && typeof data.sponsorLogos === 'string' ? JSON.parse(data.sponsorLogos) : [],
          location: data.location || '',
          street: data.street || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
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
      case 'WAITLIST':
        return <Badge variant="secondary">Warteschlange</Badge>;
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

  const [shootoutStatus, setShootoutStatus] = useState<{ totalPlayers: number; playersWithShootout: number; allCompleted: boolean } | null>(null);

  useEffect(() => {
    const fetchShootoutStatus = async () => {
      try {
        const response = await fetch('/api/admin/tournament/shootout-status');
        if (response.ok) {
          const data = await response.json();
          setShootoutStatus(data);
        }
      } catch (error) {
        console.error('Error fetching shootout status:', error);
      }
    };

    if (settings.status === 'SHOOTOUT' || settings.status === 'REGISTRATION_CLOSED') {
      fetchShootoutStatus();
    }
  }, [settings.status]);

  const handleStatusChange = (value: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED' | 'WAITLIST') => {
    if (initialStatus !== 'ACTIVE' && value === 'ACTIVE') {
      toast({
        title: "Status-Wechsel nicht erlaubt",
        description: "Der Status 'Aktiv' wird automatisch durch das System gesetzt, sobald das Shootout/die Anmeldung abgeschlossen und das Bracket generiert wurde.",
        variant: "destructive",
      });
      return;
    }
    setSettings(prev => ({ ...prev, status: value }));
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
                    <h1 className="text-3xl font-bold tracking-tight">Turnier-Einstellungen</h1>
                    <p className="text-muted-foreground">
                      Basis-Konfiguration für das Turnier
                    </p>
                  </div>
                </div>

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
                          placeholder="z.B. Dart Masters Puschendorf 2025"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tournamentStatus">Status</Label>
                        <Select
                          value={settings.status}
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPCOMING">Bevorstehend</SelectItem>
                            <SelectItem value="REGISTRATION_OPEN">Anmeldung offen</SelectItem>
                            <SelectItem value="REGISTRATION_CLOSED">Anmeldung geschlossen</SelectItem>
                            <SelectItem value="ACTIVE" disabled={initialStatus !== 'ACTIVE'}>Aktiv</SelectItem>
                            <SelectItem value="FINISHED">Abgeschlossen</SelectItem>
                            <SelectItem value="WAITLIST">Warteschlange</SelectItem>
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
                        <Label htmlFor="location">Veranstaltungsort</Label>
                        <Input
                          id="location"
                          value={settings.location}
                          onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="z.B. Sportheim Puschendorf"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street">Straße & Hausnummer</Label>
                        <Input
                          id="street"
                          value={settings.street}
                          onChange={(e) => setSettings(prev => ({ ...prev, street: e.target.value }))}
                          placeholder="z.B. Waldstraße 1"
                        />
                      </div>
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
                      <div className="space-y-2">
                        <Label htmlFor="checkoutMode">Checkout-Modus</Label>
                        <Select
                          value={settings.checkoutMode}
                          onValueChange={(value: 'DOUBLE_OUT' | 'SINGLE_OUT' | 'MASTER_OUT') =>
                            setSettings(prev => ({ ...prev, checkoutMode: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOUBLE_OUT">Double Out</SelectItem>
                            <SelectItem value="SINGLE_OUT">Single Out</SelectItem>
                            <SelectItem value="MASTER_OUT">Master Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Aktueller Status:</span>
                        {getTournamentStatusBadge(settings.status)}
                      </div>
                      <LoadingButton onClick={updateSettings} loading={saving} loadingText="Speichere..." className="w-full sm:w-auto">
                        Turnier-Einstellungen speichern
                      </LoadingButton>
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