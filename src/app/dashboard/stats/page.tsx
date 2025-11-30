"use client";

import { useEffect, useState } from "react";
import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Target, TrendingUp, Calendar, Award, Zap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatsChart } from "@/components/stats-chart";

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
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchStats();
      
      // Refresh every 10 seconds
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats/detailed');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  // Zeige Admin-Statistiken nur für Admins
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

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
            <p className="mt-4 text-gray-600">Lade Statistiken...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!stats) {
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
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Keine Statistiken verfügbar</p>
              </CardContent>
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{stats.tournamentName}</h1>
                    <p className="text-sm text-muted-foreground">Statistiken</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stats.tournamentStatus}
                  </Badge>
                </div>

                {/* Metriken */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-normal text-muted-foreground">Trefferquote</CardTitle>
                        <div className="text-2xl font-semibold mt-1">{stats.accuracyRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.missedThrows} / {stats.totalThrows} Fehlwürfe
                        </p>
                      </div>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {stats.charts.wasteChart.length > 0 && (
                        <div className="h-[80px]">
                          <StatsChart
                            data={stats.charts.wasteChart}
                            type="bar"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-normal text-muted-foreground">Wurf-Verteilung</CardTitle>
                        <div className="text-2xl font-semibold mt-1">{stats.totalThrows}</div>
                        <p className="text-xs text-muted-foreground">
                          Nach Uhrzeit
                        </p>
                      </div>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {stats.charts.throwIntensity.length > 0 && (
                        <div className="h-[80px]">
                          <StatsChart
                            data={stats.charts.throwIntensity}
                            type="area"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-normal text-muted-foreground">Siegquote</CardTitle>
                        <div className="text-2xl font-semibold mt-1">
                          {stats.topPlayers.length > 0 ? Math.round((stats.topPlayers[0].wins / Math.max(stats.finishedGames, 1)) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Führender Spieler
                        </p>
                      </div>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {stats.charts.luckIndex.length > 0 && (
                        <div className="h-[80px]">
                          <StatsChart
                            data={stats.charts.luckIndex}
                            type="bar"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-normal text-muted-foreground">Durchschnittliche Spieldauer</CardTitle>
                        <div className="text-2xl font-semibold mt-1">{stats.avgThrowsPerGame}</div>
                        <p className="text-xs text-muted-foreground">
                          Würfe pro Spiel
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {stats.charts.nerveFactor.length > 0 && (
                        <div className="h-[80px]">
                          <StatsChart
                            data={stats.charts.nerveFactor}
                            type="line"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detaillierte Analyse */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Wurf-Aktivität
                      </CardTitle>
                      <CardDescription className="text-xs">Anzahl Würfe pro Spieler</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.charts.mostThrows.length > 0 && (
                        <div className="h-[200px]">
                          <StatsChart
                            data={stats.charts.mostThrows}
                            type="bar"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Checkout-Erfolge
                      </CardTitle>
                      <CardDescription className="text-xs">Erfolgreiche Finishes pro Spieler</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.charts.checkoutChamp.length > 0 && (
                        <div className="h-[200px]">
                          <StatsChart
                            data={stats.charts.checkoutChamp}
                            type="area"
                            color="hsl(var(--primary))"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Zusammenfassung */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Leistungsübersicht
                    </CardTitle>
                    <CardDescription className="text-xs">Kennzahlen im Überblick</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-semibold">{stats.highestScore}</div>
                        <p className="text-xs text-muted-foreground mt-1">Höchster Einzelwurf</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-semibold">{stats.averageScore.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Durchschnittspunkte</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-semibold">{stats.totalCheckouts}</div>
                        <p className="text-xs text-muted-foreground mt-1">Erfolgreiche Checkouts</p>
                      </div>
                    </div>
                    {stats.topPlayers.length > 0 && (
                      <div className="mt-6 p-4 border rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Führende Spieler</p>
                        <div className="space-y-2">
                          {stats.topPlayers.slice(0, 3).map((player, index) => (
                            <div key={player.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                                <span>{player.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{player.wins} Siege</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Übersicht */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Trophy className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-semibold">{stats.totalGames}</div>
                        <p className="text-xs text-muted-foreground">Spiele gesamt</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-semibold">{stats.totalPlayers}</div>
                        <p className="text-xs text-muted-foreground">Teilnehmer</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-semibold">{stats.totalThrows.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Würfe gesamt</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-2xl font-semibold">{stats.finishedGames}</div>
                        <p className="text-xs text-muted-foreground">Abgeschlossen</p>
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
