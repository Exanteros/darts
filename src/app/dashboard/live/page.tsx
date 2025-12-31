"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTarget, IconUsers, IconTrophy, IconClock, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface Player {
  id: string;
  playerName: string;
}

interface Game {
  id: string;
  round: number;
  player1?: Player;
  player2?: Player;
  player1Legs: number;
  player2Legs: number;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
}

interface Board {
  id: string;
  name: string;
  games: Game[];
}

export default function LivePage() {
  const { isAdmin, hasTournamentAccess, tournamentAccess, isLoading, isAuthenticated, canViewLive } = useTournamentAccess();
  const [boards, setBoards] = useState<Board[]>([]);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && canViewLive) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, canViewLive]);

  const fetchData = async () => {
    try {
      console.log('Fetching live data...');
      const response = await fetch('/api/dashboard/tournament/bracket');
      if (response.ok) {
        const data = await response.json();
        console.log('Live data received:', data);
        setBoards(data.boards || []);
        setTournamentName(data.tournament?.name || '');
      } else {
        console.error('Failed to fetch live data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAuthenticated || !canViewLive) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-red-600">Zugriff verweigert</h1>
            <p className="text-muted-foreground">Sie haben keine Berechtigung für die Live-Ansicht.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Auth: {isAuthenticated ? 'Ja' : 'Nein'}, Live-Recht: {canViewLive ? 'Ja' : 'Nein'}
            </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live Überwachung</h1>
              <p className="text-muted-foreground">
                {tournamentName ? `${tournamentName}: ` : ''}Echtzeit-Status aller aktiven Boards und Spiele.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Badge variant="outline" className="gap-1 h-9 px-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </Badge>
            </div>
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40 mb-4">
            <p>Boards Count: {boards.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Can View: {canViewLive ? 'Yes' : 'No'}</p>
          </div>

          {loading && boards.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : boards.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <div className="flex flex-col items-center justify-center gap-2">
                <IconTarget className="h-12 w-12 opacity-20" />
                <h3 className="text-lg font-medium">Keine aktiven Boards</h3>
                <p className="text-sm">Es wurden keine aktiven Dartscheiben gefunden.</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-red-500 p-2">
              {boards.map((board, index) => {
                console.log(`Rendering board ${index}:`, board);
                const games = board.games || [];
                const activeGame = games.find(g => g.status === 'ACTIVE');
                const nextGame = games.find(g => g.status === 'WAITING');

                return (
                  <Card key={board.id || index} className="flex flex-col border-2 border-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">{board.name || 'Unbenannt'}</CardTitle>
                        {activeGame ? (
                          <Badge variant="default" className="bg-green-600">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary">Frei</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {activeGame ? `Runde ${activeGame.round}` : "Wartet auf Zuweisung"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-2">
                      {activeGame ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                            <div className="flex flex-col items-center flex-1">
                              <span className="font-bold text-lg truncate w-full text-center">
                                {activeGame.player1?.playerName || "TBD"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 font-mono text-2xl font-bold">
                              <span>{activeGame.player1Legs}</span>
                              <span className="text-muted-foreground">:</span>
                              <span>{activeGame.player2Legs}</span>
                            </div>
                            <div className="flex flex-col items-center flex-1">
                              <span className="font-bold text-lg truncate w-full text-center">
                                {activeGame.player2?.playerName || "TBD"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-muted-foreground bg-muted/20 rounded-lg border-dashed border-2">
                          <IconTarget className="h-8 w-8 mb-2 opacity-50" />
                          <span>Kein aktives Spiel</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 border-t bg-muted/10">
                      {nextGame ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                          <IconClock className="h-4 w-4" />
                          <span className="font-medium">Nächstes:</span>
                          <span className="truncate">
                            {nextGame.player1?.playerName || "TBD"} vs. {nextGame.player2?.playerName || "TBD"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconClock className="h-4 w-4" />
                          <span>Keine weiteren Spiele in der Warteschlange</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
