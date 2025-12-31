"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { PlayerStatisticsCard } from '@/components/player-statistics-card';
import { BulkOperations } from '@/components/bulk-operations';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  X,
  Trophy,
  Target,
  Calendar,
  Mail,
  User,
  Activity,
  Settings
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface Player {
  id: string;
  playerName: string;
  status: string;
  paid: boolean;
  seed?: number;
  registeredAt: string;
  // Darts-spezifische Statistiken
  average?: number;
  firstNineAvg?: number;
  highFinish?: number;
  oneEighties?: number;
  checkoutRate?: number;
  doubleRate?: number;
  bestLeg?: number;
  totalPoints?: number;
  legsPlayed?: number;
  legsWon?: number;
  matchesPlayed?: number;
  matchesWon?: number;
  currentRank?: number;
  prizeMoney?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  tournament: {
    id: string;
    name: string;
    status: string;
  };
  _count: {
    gamesAsPlayer1: number;
    gamesAsPlayer2: number;
    throws: number;
  };
}

interface PlayerStats {
  total: number;
  REGISTERED?: number;
  CONFIRMED?: number;
  ACTIVE?: number;
  ELIMINATED?: number;
  WITHDRAWN?: number;
}

export default function PlayersPage() {
  const { isAdmin, hasTournamentAccess, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Prüfe Berechtigung für Spieler-Verwaltung
  const canViewPlayers = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.players?.view === true;
  });

  const canEditPlayers = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.players?.edit === true;
  });

  const canCreatePlayers = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.players?.create === true;
  });

  const canDeletePlayers = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.players?.delete === true;
  });

  useEffect(() => {
    if (isAuthenticated && canViewPlayers) {
      fetchPlayers();
    }
  }, [isAuthenticated, canViewPlayers, searchTerm, statusFilter, tournamentFilter, currentPage]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/players?${params}`);
      const data = await response.json();

      if (data.success) {
        setPlayers(data.players);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Laden der Spieler',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Laden der Spieler',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStatus = async (playerId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/players', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId,
          updates: { status }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Erfolg',
          description: 'Spielerstatus wurde aktualisiert'
        });
        fetchPlayers();
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Aktualisieren',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Aktualisieren',
        variant: 'destructive'
      });
    }
  };

  const updatePaymentStatus = async (playerId: string, paid: boolean) => {
    try {
      const updates: any = { paid };
      // Wenn bezahlt, setze Status automatisch auf ACTIVE
      if (paid) {
        updates.status = 'ACTIVE';
      }

      const response = await fetch('/api/admin/players', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId,
          updates
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Erfolg',
          description: `Zahlungsstatus wurde ${paid ? 'als bezahlt' : 'als unbezahlt'} markiert`
        });
        fetchPlayers();
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Aktualisieren',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Aktualisieren',
        variant: 'destructive'
      });
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      const response = await fetch(`/api/admin/players?playerId=${playerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Erfolg',
          description: 'Spieler wurde aus dem Turnier entfernt'
        });
        fetchPlayers();
      } else {
        toast({
          title: 'Fehler',
          description: data.error || 'Fehler beim Entfernen',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Fehler',
        description: 'Netzwerkfehler beim Entfernen',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      REGISTERED: { label: 'Registriert', variant: 'secondary' as const },
      CONFIRMED: { label: 'Bestätigt', variant: 'default' as const },
      ACTIVE: { label: 'Aktiv', variant: 'default' as const },
      ELIMINATED: { label: 'Ausgeschieden', variant: 'destructive' as const },
      WITHDRAWN: { label: 'Zurückgezogen', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Spielername',
      'Benutzername',
      'E-Mail',
      'Turnier',
      'Status',
      'Bezahlt',
      'Average',
      '180s',
      'High Finish',
      'Checkout %',
      'Total Points',
      'Legs Played',
      'Legs Won',
      'Matches Played',
      'Matches Won',
      'Prize Money',
      'Registriert am'
    ];

    const csvData = players.map(player => [
      player.playerName,
      player.user.name,
      player.user.email,
      player.tournament.name,
      player.status,
      player.paid ? 'Ja' : 'Nein',
      player.average || '',
      player.oneEighties || 0,
      player.highFinish || '',
      player.checkoutRate || '',
      player.totalPoints || 0,
      player.legsPlayed || 0,
      player.legsWon || 0,
      player.matchesPlayed || 0,
      player.matchesWon || 0,
      player.prizeMoney || 0,
      new Date(player.registeredAt).toLocaleDateString('de-DE')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `spieler-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Zeige Spielerverwaltung für berechtigte Benutzer
  if (isAuthenticated && canViewPlayers) {
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
                {/* Header */}
                <div className="px-4 lg:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Spielerverwaltung</h1>
                      <p className="text-muted-foreground">
                        Verwalten Sie alle Turnierspieler und deren Status
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <BulkOperations 
                        players={players} 
                        onUpdate={fetchPlayers} 
                        totalCount={stats.total}
                        filters={{ 
                          search: searchTerm, 
                          status: statusFilter !== 'all' ? statusFilter : '', 
                          tournamentId: tournamentFilter !== 'all' ? tournamentFilter : '' 
                        }}
                      />
                      <Button variant="outline" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Statistiken */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bestätigt</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.CONFIRMED || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.ACTIVE || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Warteliste</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.WAITING_LIST || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ausgeschieden</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.ELIMINATED || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Zurückgezogen</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.WITHDRAWN || 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Filter und Suche */}
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Filter & Suche</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Suche nach Name, Email oder Spielername..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Status filtern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Status</SelectItem>
                            <SelectItem value="REGISTERED">Registriert</SelectItem>
                            <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
                            <SelectItem value="WAITING_LIST">Warteliste</SelectItem>
                            <SelectItem value="ACTIVE">Aktiv</SelectItem>
                            <SelectItem value="ELIMINATED">Ausgeschieden</SelectItem>
                            <SelectItem value="WITHDRAWN">Zurückgezogen</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                          <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Turnier filtern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Turniere</SelectItem>
                            {/* Hier würden die verfügbaren Turniere geladen */}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Min. Average"
                            type="number"
                            step="0.1"
                            className="w-24"
                          />
                          <Input
                            placeholder="Min. 180s"
                            type="number"
                            className="w-20"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Spieler-Tabelle */}
                <div className="px-4 lg:px-6">
                  <Tabs defaultValue="players" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger value="players">Spieler verwalten</TabsTrigger>
                    </TabsList>

                    <TabsContent value="players" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Spieler ({stats.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-2">Lade Spieler...</span>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Spieler</TableHead>
                                    <TableHead>Turnier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Zahlung</TableHead>
                                    <TableHead>Spiele</TableHead>
                                    <TableHead>Registriert</TableHead>
                                    <TableHead>Aktionen</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {players.map((player) => (
                                    <TableRow
                                      key={player.id}
                                      className="hover:bg-muted/50 transition-colors"
                                    >
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">{player.playerName}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {player.user.name} ({player.user.email})
                                          </div>
                                          {player.seed && (
                                            <div className="text-sm text-muted-foreground">
                                              Seed: {player.seed}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">{player.tournament.name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {player.tournament.status}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(player.status)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            checked={player.paid}
                                            onCheckedChange={(checked) =>
                                              updatePaymentStatus(player.id, checked as boolean)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {player.paid ? (
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <DollarSign className="h-4 w-4 text-red-600" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">
                                          {player._count.gamesAsPlayer1 + player._count.gamesAsPlayer2} Spiele
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {player._count.throws} Würfe
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">
                                          {new Date(player.registeredAt).toLocaleDateString('de-DE')}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedPlayer(player);
                                              setEditDialogOpen(true);
                                            }}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Select
                                            value={player.status}
                                            onValueChange={(value) => updatePlayerStatus(player.id, value)}
                                          >
                                            <SelectTrigger
                                              className="w-32"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="REGISTERED">Registriert</SelectItem>
                                              <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
                                              <SelectItem value="WAITING_LIST">Warteliste</SelectItem>
                                              <SelectItem value="ACTIVE">Aktiv</SelectItem>
                                              <SelectItem value="ELIMINATED">Ausgeschieden</SelectItem>
                                              <SelectItem value="WITHDRAWN">Zurückgezogen</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Spieler entfernen</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Sind Sie sicher, dass Sie {player.playerName} aus dem Turnier entfernen möchten?
                                                  Diese Aktion kann nicht rückgängig gemacht werden.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => deletePlayer(player.id)}
                                                  className="bg-red-600 hover:bg-red-700"
                                                >
                                                  Entfernen
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Paginierung */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm text-muted-foreground">
                                Seite {currentPage} von {totalPages}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Vorherige
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                  disabled={currentPage === totalPages}
                                >
                                  Nächste
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                  </Tabs>
                </div>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Spieler bearbeiten</DialogTitle>
                    </DialogHeader>
                    {selectedPlayer && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="playerName">Spielername</Label>
                          <Input
                            id="playerName"
                            value={selectedPlayer.playerName}
                            onChange={(e) => setSelectedPlayer({
                              ...selectedPlayer,
                              playerName: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="seed">Seed-Position</Label>
                          <Input
                            id="seed"
                            type="number"
                            value={selectedPlayer.seed || ''}
                            onChange={(e) => setSelectedPlayer({
                              ...selectedPlayer,
                              seed: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button onClick={() => {
                            // Hier würde die Update-Logik implementiert
                            setEditDialogOpen(false);
                          }}>
                            Speichern
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Slide-out Stats Panel - Entfernt */}

            {/* Overlay für Panel */}
            {false && (
              <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => {}}
              />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Für nicht-authentifizierte oder normale Benutzer wird die Weiterleitung über die Layout-Komponente erfolgen
  return null;
}
