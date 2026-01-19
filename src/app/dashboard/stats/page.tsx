"use client";

import { useEffect, useState } from "react";
import { useTournamentAccess } from "@/hooks/useTournamentAccess";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Target, TrendingUp, Calendar, Award, Zap, BarChart3, Activity, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatsChart } from "@/components/stats-chart";
import { Separator } from "@/components/ui/separator";

interface ChartData {
  name: string;
  value: number;
  label: string;
}

interface TournamentStats {
  totalPlayers: number;
  activePlayers: number;
  withdrawnPlayers: number;
  totalGames: number;
  finishedGames: number;
  activeGames: number;
  waitingGames: number;
  totalThrows: number;
  averageScore: number;
  highestScore: number;
  totalCheckouts: number;
  currentRound: number;
  maxRounds: number;
  tournamentName: string;
  tournamentStatus: string;
  startDate: string;
  missedThrows: number;
  accuracyRate: number;
  avgThrowsPerGame: number;
  topPlayers: Array<{
    name: string;
    wins: number;
    averageScore: number;
    checkouts: number;
  }>;
  recentGames: Array<{
    id: string;
    player1Name: string;
    player2Name: string;
    winnerName: string;
    player1Score: number;
    player2Score: number;
    finishedAt: string;
  }>;
  charts: {
    throwIntensity: ChartData[];
    luckIndex: ChartData[];
    wasteChart: ChartData[];
    nerveFactor: ChartData[];
    mostThrows: ChartData[];
    checkoutChamp: ChartData[];
  };
}

export default function StatsPage() {
  const { isAdmin, hasTournamentAccess, tournamentAccess, isLoading: authLoading, isAuthenticated } = useTournamentAccess();
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Prüfe Berechtigung für Statistiken
  const canViewStats = isAdmin || tournamentAccess.some(access => {
    try {
      const permissions = JSON.parse(access.permissions || "{}");
      return permissions.dashboard?.viewStats === true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isAuthenticated && canViewStats) {
      fetchStats();
      
      // Refresh every 10 seconds
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, canViewStats]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats/detailed");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
         console.error("Failed to fetch stats:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Zeige Ladezustand während der Authentifizierung oder beim ersten Laden
  if (authLoading || (loading && !stats)) {
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
          <div className="flex flex-1 flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Lade Statistiken...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Für nicht authentifizierte oder nicht berechtigte Benutzer
  if (!isAuthenticated && !authLoading) {
     return null;
  }
  
  // Wenn keine Daten vorhanden sind (aber geladen wurde)
  if (!stats && !loading) {
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
           <div className="flex flex-1 flex-col items-center justify-center h-full p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Keine Daten verfügbar</CardTitle>
                <CardDescription className="text-center">
                  Es konnten keine Statistiken für das aktuelle Turnier geladen werden.
                </CardDescription>
              </CardHeader>
            </Card>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-1">
             {/* Header */}
             <div className="flex items-center justify-between pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {stats?.tournamentName || "Turnier Statistiken"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Live-Auswertung und Analysen aller Spiele
                  </p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mr-4">
                      <Activity className="h-3 w-3" />
                      Updated: Just now
                   </div>
                   <Badge variant={stats?.tournamentStatus === "LIVE" ? "destructive" : "secondary"} className="text-sm px-3 py-1">
                      {stats?.tournamentStatus || "OFFLINE"}
                   </Badge>
                </div>
             </div>

             {/* Top Metriken */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Spiele Gesamt</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalGames}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.finishedGames} beendet, {stats?.activeGames} aktiv
                    </p>
                    <div className="h-[4px] w-full bg-secondary mt-3 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${((stats && stats.totalGames > 0) ? (stats.finishedGames / stats.totalGames * 100) : 0)}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Highscore</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.highestScore}</div>
                    <p className="text-xs text-muted-foreground">
                      Höchster geworfener Score
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ø Average</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.averageScore.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      Punkte pro Aufnahme (3 Darts)
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Checkouts</CardTitle>
                     <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCheckouts}</div>
                    <p className="text-xs text-muted-foreground">
                      Erfolgreiche Finishes
                    </p>
                  </CardContent>
                </Card>
             </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Wurf Intensität</CardTitle>
                    <CardDescription>
                      Anzahl der Würfe über den Turnierverlauf
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                     <div className="h-[240px] w-full">
                        {stats?.charts?.throwIntensity && stats.charts.throwIntensity.length > 0 ? (
                           <StatsChart 
                              data={stats.charts.throwIntensity} 
                              type="area" 
                              color="hsl(var(--primary))" 
                           />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Keine Daten verfügbar
                          </div>
                        )}
                     </div>
                  </CardContent>
                </Card>

                {/* Top Players List */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Top Spieler</CardTitle>
                    <CardDescription>
                      Beste Performance im Turnier
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                       {stats?.topPlayers && stats.topPlayers.length > 0 ? (
                         stats.topPlayers.slice(0, 5).map((player, i) => (
                          <div key={userAvatarKey(player.name)} className="flex items-center">
                             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {i + 1}
                             </div>
                             <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{player.name}</p>
                                <p className="text-xs text-muted-foreground">
                                   AVG: {player.averageScore.toFixed(1)}
                                </p>
                             </div>
                             <div className="ml-auto font-medium">
                                +{player.wins} Wins
                             </div>
                          </div>
                       ))
                       ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Noch keine Spielerdaten
                        </div>
                       )}
                    </div>
                  </CardContent>
                </Card>
             </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2">
                   <CardHeader>
                      <CardTitle>Trefferverteilung</CardTitle>
                      <CardDescription>Häufigkeit der getroffenen Felder</CardDescription>
                   </CardHeader>
                   <CardContent>
                      <div className="h-[200px]">
                         {stats?.charts?.wasteChart && stats.charts.wasteChart.length > 0 ? (
                            <StatsChart
                               data={stats.charts.wasteChart}
                               type="bar"
                               color="hsl(var(--chart-2))"
                            />
                         ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Keine Daten verfügbar
                            </div>
                         )}
                      </div>
                   </CardContent>
                </Card>

                <Card className="col-span-2">
                   <CardHeader>
                      <CardTitle>Nervenstärke</CardTitle>
                      <CardDescription>Average in entscheidenden Momenten</CardDescription>
                   </CardHeader>
                   <CardContent>
                      <div className="h-[200px]">
                         {stats?.charts?.nerveFactor && stats.charts.nerveFactor.length > 0 ? (
                            <StatsChart
                               data={stats.charts.nerveFactor}
                               type="line"
                               color="hsl(var(--chart-3))"
                            />
                         ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Keine Daten verfügbar
                            </div>
                         )}
                      </div>
                   </CardContent>
                </Card>
             </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function userAvatarKey(name: string) {
   return name.toLowerCase().replace(/\s/g, "-");
}
