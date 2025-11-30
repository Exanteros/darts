"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { TournamentOnboarding } from "@/components/tournament-onboarding"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

interface TournamentData {
  id: string | number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  scheibe?: string;
  spieler1?: string;
  spieler2?: string;
  status_detail?: string;
  isCurrent?: boolean;
}

export default function Page() {
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
  const [dashboardData, setDashboardData] = useState<TournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchDashboardData();
    }
    
    const handleUpdate = () => {
      if (isAuthenticated && isAdmin) {
        fetchDashboardData();
      }
    };
    
    window.addEventListener('tournament-updated', handleUpdate);
    return () => window.removeEventListener('tournament-updated', handleUpdate);
  }, [isAuthenticated, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      // Check if tournament exists
      const settingsResponse = await fetch('/api/admin/tournament/settings');
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        
        // If no tournament name is set, show onboarding
        if (!settings.name || settings.name.trim() === '') {
          setShowOnboarding(true);
          setLoading(false);
          return;
        }
      }

      const timestamp = Date.now();
      const response = await fetch(`/api/dashboard/data?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();

      if (data.success) {
        console.log('📊 Dashboard-Daten geladen:', data.data);
        setDashboardData(data.data);
      } else {
        console.error('Error fetching dashboard data:', data.message);
        setDashboardData([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData([]);
    } finally {
      setLoading(false);
    }
  };

  // Zeige Ladezustand während der Authentifizierung
  if (isLoading) {
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
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Überprüfe Berechtigung...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Zeige Admin-Dashboard nur für Admins
  if (isAuthenticated && isAdmin) {
    if (loading) {
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
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Lade Dashboard...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      );
    }

    // Show onboarding if no tournament exists
    if (showOnboarding) {
      return <TournamentOnboarding onComplete={() => {
        setShowOnboarding(false);
        fetchDashboardData();
      }} />;
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
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={dashboardData} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Für nicht-authentifizierte oder normale Benutzer wird die Weiterleitung über die Layout-Komponente erfolgen
  return null;
}