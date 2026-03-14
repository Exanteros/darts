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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
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

export default function TournamentPaymentsPage() {
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

  const disconnectStripe = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/stripe/disconnect', { method: 'POST' });
      if(!res.ok) throw new Error("Disconnect failed");
      
      setSettings(prev => ({ 
        ...prev, 
        stripeConnected: false, 
        stripeAccountId: undefined, 
        stripeEnabled: false 
      }));
      toast({ title: "Verbindung getrennt", description: "Stripe-Verbindung wurde aufgehoben." });
    } catch(e) {
      toast({ title: "Fehler", description: "Konnte Verbindung nicht trennen.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveStripeSettings = async (updated: Partial<TournamentSettings>) => {
    setSaving(true);
    try {
      const payload = {
        id: 'default',
        stripeEnabled: updated.stripeEnabled ?? settings.stripeEnabled,
        stripePublishableKey: updated.stripePublishableKey ?? settings.stripePublishableKey,
        stripeSecretKey: updated.stripeSecretKey ?? settings.stripeSecretKey,
        stripeWebhookSecret: updated.stripeWebhookSecret ?? settings.stripeWebhookSecret,
      };

      const res = await fetch('/api/admin/tournament/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Failed to save stripe settings', res.status, body);
        toast({ title: 'Fehler', description: body.error || 'Konnte Stripe-Einstellungen nicht speichern.', variant: 'destructive' });
        return;
      }

      // Refresh settings from server to ensure persisted state
      await fetchSettings();
    } catch (e) {
      console.error('SaveStripeSettings error', e);
      toast({ title: 'Fehler', description: 'Konnte Stripe-Einstellungen nicht speichern.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if(params.get('success') === 'stripe_connected') {
       toast({ title: "Erfolg", description: "Stripe-Konto erfolgreich verbunden!" });
       window.history.replaceState({}, '', window.location.pathname);
    }
    if(params.get('error') === 'stripe_connect_failed') {
       toast({ title: "Fehler", description: "Verbindung zu Stripe fehlgeschlagen.", variant: "destructive" });
    }
  }, []);

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
                    <h1 className="text-3xl font-bold tracking-tight">Stripe-Zahlungen</h1>
                    <p className="text-muted-foreground">
                      Konfigurieren Sie Stripe für die Zahlungsabwicklung bei Turnier-Anmeldungen
                    </p>
                  </div>
                </div>

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
                        onCheckedChange={async (checked) => {
                          setSettings(prev => ({ ...prev, stripeEnabled: checked }));
                          await saveStripeSettings({ ...settings, stripeEnabled: checked });
                        }}
                      />
                      <Label htmlFor="stripeEnabled">Stripe-Zahlungen aktivieren</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                        <Input
                          id="stripePublishableKey"
                          placeholder="pk_test_xxx"
                          value={settings.stripePublishableKey || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="stripeSecretKey">Secret Key</Label>
                        <Input
                          id="stripeSecretKey"
                          type="password"
                          placeholder="sk_test_xxx"
                          value={settings.stripeSecretKey || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
                        <Input
                          id="stripeWebhookSecret"
                          type="password"
                          placeholder="whsec_xxx"
                          value={settings.stripeWebhookSecret || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                        />
                      </div>

                      <div className="sm:col-span-2 flex gap-2 mt-1">
                        <Button size="sm" onClick={() => saveStripeSettings({
                          stripePublishableKey: settings.stripePublishableKey,
                          stripeSecretKey: settings.stripeSecretKey,
                          stripeWebhookSecret: settings.stripeWebhookSecret,
                        })} disabled={saving}>
                          Stripe-Keys speichern
                        </Button>
                      </div>
                    </div>

                    {settings.stripeConnected ? (
                       <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle2 className="h-6 w-6" />
                             </div>
                             <div>
                                <h4 className="font-semibold text-green-900">Verbunden</h4>
                                <p className="text-sm text-green-700">Online-Zahlungen aktiv via <span className="font-mono">{settings.stripeAccountId}</span></p>
                             </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={disconnectStripe} disabled={saving} className="text-slate-500 hover:text-red-600 hover:bg-red-50">
                             Trennen
                          </Button>
                       </div>
                    ) : (
                       <div className="flex flex-col items-start gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                                <svg viewBox="0 0 32 32" className="h-6 w-6" fill="#635BFF"><path d="M11.6 24.3c-.6 0-1.1-.5-1.1-1.1V12.1c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1v11.1c0 .6-.5 1.1-1.1 1.1zM20.4 24.3c-.6 0-1.1-.5-1.1-1.1V7.7c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1v15.5c0 .6-.5 1.1-1.1 1.1zM7.2 24.3c-.6 0-1.1-.5-1.1-1.1v-6.7c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1v6.7c0 .6-.5 1.1-1.1 1.1zM24.8 24.3c-.6 0-1.1-.5-1.1-1.1V14.3c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1v8.9c0 .6-.5 1.1-1.1 1.1zM16 24.3c-.6 0-1.1-.5-1.1-1.1V10c0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1z" /></svg>
                             </div>
                             <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Zahlungen einrichten</h4>
                                <p className="text-sm text-muted-foreground">
                                  Verbinden Sie Ihr Stripe-Konto, um Startgebühren direkt online zu empfangen.
                                </p>
                             </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => window.location.href = '/api/admin/stripe/connect'}
                            className="w-full sm:w-auto"
                          >
                             Mit Stripe verbinden
                          </Button>
                       </div>
                    )}
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