"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Settings, Image, CreditCard, Gamepad2, Target, ListTree, FileImage } from 'lucide-react';

export default function TournamentPage() {
  const { isAdmin, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();

  const canManageTournaments = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.games?.create === true || permissions.bracket?.edit === true;
  });

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

  const menuItems = [
    {
      title: "Einstellungen",
      description: "Titel, Datum, Modus, Status",
      href: "/dashboard/tournament/settings",
      icon: Settings
    },
    {
      title: "Turnierbaum",
      description: "Bracket-Größe, Setzliste",
      href: "/dashboard/tournament/bracket-config",
      icon: ListTree
    },
    {
      title: "Logos",
      description: "Hauptlogo und Sponsoren",
      href: "/dashboard/tournament/logos",
      icon: FileImage
    },
    {
      title: "Bilder",
      description: "Bildergalerie verwalten",
      href: "/dashboard/tournament/images",
      icon: Image
    },
    {
      title: "Zahlungen",
      description: "Zahlungsanbieter verbinden",
      href: "/dashboard/tournament/payments",
      icon: CreditCard
    },
    {
      title: "Simulator",
      description: "Spiele simulieren",
      href: "/dashboard/tournament/simulator",
      icon: Gamepad2
    },
    {
      title: "Dartscheiben",
      description: "Scheiben anlegen und zuweisen",
      href: "/dashboard/tournament/boards",
      icon: Target
    }
  ];

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
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Turnier-Verwaltung</h1>
                    <p className="text-muted-foreground">
                      Verwalten Sie alle Aspekte Ihres Turniers
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className="group flex flex-col gap-1 rounded-xl border bg-card p-6 shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold leading-none tracking-tight">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground pl-[3.25rem]">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}