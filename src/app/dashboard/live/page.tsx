"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTarget, IconUsers, IconTrophy, IconClock } from '@tabler/icons-react';

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
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard/tournament/bracket');
      if (response.ok) {
        const data = await response.json();
        setBoards(data.boards || []);
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

  if (!isAuthenticated || !isAdmin) {
    return null; // Redirect handled by useUserCheck or layout
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
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live Überwachung</h1>
              <p className="text-muted-foreground">
                Echtzeit-Status aller aktiven Boards und Spiele.
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </Badge>
          </div>

          {loading && boards.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => {
                const games = board.games || [];
                const activeGame = games.find(g => g.status === 'ACTIVE');
                const nextGame = games.find(g => g.status === 'WAITING');

                return (
                  <Card key={board.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">{board.name}</CardTitle>
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
