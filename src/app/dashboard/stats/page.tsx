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
import { Users, Trophy, Target, TrendingUp, Zap, Activity, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatsChart } from "@/components/stats-chart";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        setLastUpdated(new Date());
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
        className="font-sans"
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
        className="font-sans"
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

  const progressPercentage = stats && stats.totalGames > 0
    ? Math.round((stats.finishedGames / stats.totalGames) * 100)
    : 0;

  const roundProgress = stats && stats.maxRounds > 0
    ? Math.round((stats.currentRound / stats.maxRounds) * 100)
    : 0;

  return (
    <SidebarProvider
      className="font-sans"
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
                     Updated: {lastUpdated ? lastUpdated.toLocaleTimeString("de-DE") : "--:--"}
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
                    <Progress className="mt-3 h-1" value={progressPercentage} />
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

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Spieler Aktiv</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activePlayers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalPlayers} gemeldet, {stats?.withdrawnPlayers} abgemeldet
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trefferquote</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.accuracyRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.missedThrows} Fehlwürfe von {stats?.totalThrows} Aufnahmen
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Würfe / Spiel</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.avgThrowsPerGame}</div>
                    <p className="text-xs text-muted-foreground">
                      Durchschnitt bei beendeten Spielen
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rundenfortschritt</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.currentRound}/{stats?.maxRounds}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aktuelle Bracket-Runde
                    </p>
                    <Progress className="mt-3 h-1" value={roundProgress} />
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

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Würfe pro Spieler</CardTitle>
                    <CardDescription>Wer war am häufigsten an der Scheibe</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      {stats?.charts?.mostThrows && stats.charts.mostThrows.length > 0 ? (
                        <StatsChart
                          data={stats.charts.mostThrows}
                          type="bar"
                          color="hsl(var(--chart-4))"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Keine Daten verfügbar
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Checkout Champions</CardTitle>
                    <CardDescription>Meiste Checkouts im Turnier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      {stats?.charts?.checkoutChamp && stats.charts.checkoutChamp.length > 0 ? (
                        <StatsChart
                          data={stats.charts.checkoutChamp}
                          type="line"
                          color="hsl(var(--chart-5))"
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

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                    <CardDescription>Zuletzt abgeschlossene Spiele</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      {stats?.recentGames && stats.recentGames.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Spiel</TableHead>
                              <TableHead>Gewinner</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                              <TableHead className="text-right">Uhrzeit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.recentGames.map((game) => (
                              <TableRow key={game.id}>
                                <TableCell className="font-medium">
                                  {game.player1Name} vs {game.player2Name}
                                </TableCell>
                                <TableCell>{game.winnerName || "-"}</TableCell>
                                <TableCell className="text-right">
                                  {game.player1Score} : {game.player2Score}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {new Date(game.finishedAt).toLocaleTimeString("de-DE")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Noch keine abgeschlossenen Spiele
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Luck Index</CardTitle>
                    <CardDescription>Siegquote-basierter Momentum-Wert</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[240px]">
                      {stats?.charts?.luckIndex && stats.charts.luckIndex.length > 0 ? (
                        <StatsChart
                          data={stats.charts.luckIndex}
                          type="bar"
                          color="hsl(var(--chart-1))"
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
