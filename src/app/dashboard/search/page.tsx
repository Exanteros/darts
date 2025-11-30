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
import { Badge } from "@/components/ui/badge"
import { IconSearch, IconUser, IconTarget, IconTrophy, IconChartBar } from "@tabler/icons-react"
import { useState } from "react"

interface SearchResult {
  type: 'player' | 'game' | 'tournament' | 'stat';
  title: string;
  description: string;
  url: string;
}

export default function SearchPage() {
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <IconUser className="h-4 w-4" />;
      case 'game':
        return <IconTarget className="h-4 w-4" />;
      case 'tournament':
        return <IconTrophy className="h-4 w-4" />;
      case 'stat':
        return <IconChartBar className="h-4 w-4" />;
      default:
        return <IconSearch className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      player: 'Spieler',
      game: 'Spiel',
      tournament: 'Turnier',
      stat: 'Statistik'
    };
    return labels[type as keyof typeof labels] || type;
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
                    <h1 className="text-3xl font-bold tracking-tight">Suche</h1>
                    <p className="text-muted-foreground">
                      Durchsuchen Sie Spieler, Spiele und Statistiken
                    </p>
                  </div>
                </div>

                <div className="space-y-6 mt-6">
                  {/* Search Input */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Suchbegriff eingeben</CardTitle>
                      <CardDescription>
                        Suchen Sie nach Spielern, Spielen, Turnieren oder Statistiken
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Suchen..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results */}
                  {searching && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Suche läuft...</p>
                    </div>
                  )}

                  {!searching && searchQuery && results.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          Keine Ergebnisse für "{searchQuery}" gefunden
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!searching && results.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">
                        {results.length} Ergebnis{results.length !== 1 ? 'se' : ''} gefunden
                      </h2>
                      <div className="space-y-2">
                        {results.map((result, index) => (
                          <Card key={index} className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <a href={result.url} className="block">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(result.type)}
                                    <CardTitle className="text-base">{result.title}</CardTitle>
                                  </div>
                                  <Badge variant="outline">
                                    {getTypeBadge(result.type)}
                                  </Badge>
                                </div>
                                <CardDescription className="mt-1">
                                  {result.description}
                                </CardDescription>
                              </CardHeader>
                            </a>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {!searchQuery && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Schnellzugriff</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <a href="/dashboard/players" className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <IconUser className="h-4 w-4" />
                            <span className="font-medium">Alle Spieler</span>
                          </div>
                        </a>
                        <a href="/dashboard/stats" className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <IconChartBar className="h-4 w-4" />
                            <span className="font-medium">Statistiken</span>
                          </div>
                        </a>
                        <a href="/dashboard/tournament" className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <IconTrophy className="h-4 w-4" />
                            <span className="font-medium">Turnier-Verwaltung</span>
                          </div>
                        </a>
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
