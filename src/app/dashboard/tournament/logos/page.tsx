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
import { Separator } from '@/components/ui/separator';
import { LogoUpload, SponsorLogosUpload } from '@/components/LogoUpload';
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

export default function TournamentLogosPage() {
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
          description: "Die Logo-Einstellungen wurden erfolgreich gespeichert.",
        });
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
                    <h1 className="text-3xl font-bold tracking-tight">Logo-Verwaltung</h1>
                    <p className="text-muted-foreground">
                      Laden Sie Logos für Turnier-Bildschirme und Sponsoren hoch
                    </p>
                  </div>
                </div>

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

                    <div className="flex sm:justify-end pt-4">
                      <LoadingButton onClick={updateSettings} loading={saving} loadingText="Speichere..." className="w-full sm:w-auto">
                        Logo-Einstellungen speichern
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