"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconUser, IconMail, IconShield, IconClock } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function AccountPage() {
  const { isAdmin, isLoading, isAuthenticated, user } = useUserCheck();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [adminSecret, setAdminSecret] = useState('');
  const [promoting, setPromoting] = useState(false);

  // New Admin Creation State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Gespeichert",
          description: "Ihre Account-Daten wurden aktualisiert.",
        });
        // Session neu laden
        window.location.reload();
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Die Account-Daten konnten nicht gespeichert werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Account-Daten konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async () => {
    if (!adminSecret) return;
    
    setPromoting(true);
    try {
      const response = await fetch('/api/user/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: adminSecret })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Erfolg!",
          description: "Sie sind nun Administrator. Seite wird neu geladen...",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Admin-Promotion fehlgeschlagen",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler",
        variant: "destructive"
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
        toast({ title: "Fehler", description: "Email und Passwort sind erforderlich", variant: "destructive" });
        return;
    }

    setCreatingAdmin(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail, password: newAdminPassword })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Neuer Administrator wurde erstellt.",
        });
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Erstellen",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler",
        variant: "destructive"
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">Wird geladen...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
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
              <div className="px-4 lg:px-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account</h1>
                    <p className="text-muted-foreground">
                      Verwalten Sie Ihre Account-Einstellungen
                    </p>
                  </div>
                  <Badge variant="outline">
                    {isAdmin ? 'Administrator' : 'Benutzer'}
                  </Badge>
                </div>

                <div className="space-y-6 mt-6">

                  {/* Account Cards */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconUser className="h-4 w-4" />
                          Persönliche Informationen
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ihr Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-Mail</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ihre@email.de"
                          />
                        </div>
                        <Button 
                          onClick={handleSave} 
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? 'Wird gespeichert...' : 'Speichern'}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconShield className="h-4 w-4" />
                          Account-Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <IconMail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">E-Mail</span>
                          </div>
                          <span className="text-sm font-medium">{user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <IconShield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Rolle</span>
                          </div>
                          <Badge variant="outline">
                            {isAdmin ? 'Administrator' : 'Benutzer'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <IconClock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Mitglied seit</span>
                          </div>
                          <span className="text-sm font-medium">
                            N/A
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Security Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sicherheit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Dieser Account verwendet Magic Link-Authentifizierung. 
                          Sie erhalten einen Login-Link per E-Mail, wenn Sie sich anmelden möchten.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Admin Promotion Zone */}
                  {!isAdmin && (
                    <Card className="border-yellow-500/50 bg-yellow-500/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                          <IconShield className="h-5 w-5" />
                          Admin Access
                        </CardTitle>
                        <CardDescription>
                          Entwickler-Bereich: Admin-Rechte anfordern
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Admin Secret Code</Label>
                          <div className="flex gap-2">
                            <Input 
                              type="password" 
                              placeholder="Code eingeben..." 
                              value={adminSecret}
                              onChange={(e) => setAdminSecret(e.target.value)}
                            />
                            <Button 
                              onClick={handlePromote}
                              disabled={promoting || !adminSecret}
                              variant="outline"
                              className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                            >
                              {promoting ? '...' : 'Upgrade'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Nur für autorisiertes Personal. Missbrauch wird protokolliert.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Create New Admin Section (Only for Admins) */}
                  {isAdmin && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <IconUser className="h-5 w-5" />
                           Neuen Admin anlegen
                        </CardTitle>
                        <CardDescription>
                          Erstellen Sie einen neuen Benutzer mit vollen Administrator-Rechten.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="newAdminName">Name (Optional)</Label>
                            <Input 
                              id="newAdminName"
                              placeholder="Vorname Nachname" 
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newAdminEmail">E-Mail *</Label>
                            <Input 
                              id="newAdminEmail"
                              type="email"
                              placeholder="admin@hallo.de" 
                              value={newAdminEmail}
                              onChange={(e) => setNewAdminEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="newAdminPassword">Passwort *</Label>
                            <Input 
                              id="newAdminPassword"
                              type="password"
                              placeholder="Sicheres Passwort" 
                              value={newAdminPassword}
                              onChange={(e) => setNewAdminPassword(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button 
                             onClick={handleCreateAdmin} 
                             disabled={creatingAdmin || !newAdminEmail || !newAdminPassword}
                          >
                            {creatingAdmin ? 'Erstelle...' : 'Admin erstellen'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
