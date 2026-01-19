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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
  Settings,
  MoreHorizontal,
  Plus
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
  WAITING_LIST?: number;
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
  const [tournamentFilter, setTournamentFilter] = useState<string>(''); // Default empty, wait for load
  const [availableTournaments, setAvailableTournaments] = useState<{id: string, name: string}[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [waitingListCandidates, setWaitingListCandidates] = useState<Player[]>([]);
  const [selectedPromotePlayerId, setSelectedPromotePlayerId] = useState<string>('none');
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTournament, setCurrentTournament] = useState<{maxPlayers: number, name: string} | null>(null);
  const { toast } = useToast();

  const handleCreatePlayer = async () => {
    if (!newPlayerName || !newPlayerEmail || !currentTournament) {
      toast({
        title: "Fehler",
        description: "Bitte Name und E-Mail ausfüllen.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPlayerName,
          email: newPlayerEmail,
          tournamentId: tournamentFilter
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Erfolg",
          description: "Spieler wurde angelegt und hinzugefügt."
        });
        setAddPlayerDialogOpen(false);
        setIsCreatingNew(false);
        setNewPlayerName('');
        setNewPlayerEmail('');
        fetchPlayers();
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Fehler beim Anlegen",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler",
        variant: "destructive"
      });
    }
  };


  // Berechne Stats für Header (unabhängig von Pagination)
  const activeStatsCount = (stats.REGISTERED || 0) + (stats.CONFIRMED || 0) + (stats.ACTIVE || 0) + (stats.ELIMINATED || 0);
  const waitingStatsCount = stats.WAITING_LIST || 0;

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
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/admin/tournaments');
        const data = await response.json();
        // API returns { tournaments: [...] } on success
        if (data.tournaments && Array.isArray(data.tournaments)) {
          setAvailableTournaments(data.tournaments);
          if (data.tournaments.length > 0 && !tournamentFilter) {
            setTournamentFilter(data.tournaments[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };

    if (isAuthenticated) {
      fetchTournaments();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && canViewPlayers && tournamentFilter) {
      fetchPlayers();
    }
  }, [isAuthenticated, canViewPlayers, searchTerm, statusFilter, tournamentFilter, currentPage]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      if (!tournamentFilter) return; // Wait for tournament selection

      // Increased limit when tournament filter is active to show "Full View" including gaps
      const limit = '100'; // Always 100 since we force tournament selection now
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('tournamentId', tournamentFilter);

      const response = await fetch(`/api/admin/players?${params}`);
      const data = await response.json();

      if (data.success) {
        setPlayers(data.players);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setCurrentTournament(data.tournament || null);
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

  const handleDeleteRequest = async (player: Player) => {
    setPlayerToDelete(player);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (promotePlayerId?: string) => {
    if (!playerToDelete) return;
    
    try {
      let url = `/api/admin/players?playerId=${playerToDelete.id}`;
      if (promotePlayerId && promotePlayerId !== 'none') {
        url += `&promotePlayerId=${promotePlayerId}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Erfolg',
          description: data.message || 'Spieler wurde entfernt'
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
    } finally {
      setDeleteDialogOpen(false);
      setPromoteDialogOpen(false);
      setPlayerToDelete(null);
      setWaitingListCandidates([]);
      setSelectedPromotePlayerId('none');
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
                            <SelectValue placeholder="Turnier wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTournaments.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
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
                                  {(() => {
                                    const renderRow = (player: Player) => (
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
                                          <div className="text-sm text-muted-foreground">
                                            {new Date(player.registeredAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center justify-end gap-2">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPlayer(player);
                                                    setEditDialogOpen(true);
                                                  }}
                                                >
                                                  <Edit className="h-4 w-4 mr-2" />
                                                  Bearbeiten
                                                </DropdownMenuItem>

                                                <DropdownMenuSub>
                                                  <DropdownMenuSubTrigger>
                                                    <Activity className="h-4 w-4 mr-2" />
                                                    Status ändern
                                                  </DropdownMenuSubTrigger>
                                                  <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'REGISTERED')}>
                                                        Registriert
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'CONFIRMED')}>
                                                        Bestätigt
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'ACTIVE')}>
                                                        Aktiv
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'WAITING_LIST')}>
                                                        Warteliste
                                                      </DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'ELIMINATED')}>
                                                        Ausgeschieden
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => updatePlayerStatus(player.id, 'WITHDRAWN')}>
                                                        Zurückgezogen
                                                      </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                  </DropdownMenuPortal>
                                                </DropdownMenuSub>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteDialogOpen(true);
                                                    setPlayerToDelete(player);
                                                  }}
                                                  className="text-red-600"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Löschen
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );

                                    if (!currentTournament) return players.map(renderRow);

                                    const activePlayers = players.filter(p => !['WAITING_LIST', 'WITHDRAWN'].includes(p.status));
                                    const waitingPlayers = players.filter(p => p.status === 'WAITING_LIST');
                                    const max = currentTournament.maxPlayers;
                                    const rows = [];

                                    // 1. WARTELISTE (Minimalistisch)
                                    if (waitingPlayers.length > 0) {
                                       rows.push(
                                        <TableRow key="header-waiting" className="bg-orange-50/50 hover:bg-orange-50">
                                          <TableCell colSpan={7} className="py-2 px-6 border-b border-orange-100">
                                            <div className="flex items-center gap-2">
                                              <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                                              <span className="font-semibold text-sm text-orange-900">Warteliste</span>
                                              <span className="text-xs text-orange-700/70">({waitingPlayers.length} wartend)</span>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                      
                                      waitingPlayers.forEach(p => rows.push(renderRow(p)));
                                      
                                      // Kleiner Spacer statt riesiger Divider
                                      rows.push(
                                        <TableRow key="spacer-waiting-active" className="h-4 border-0">
                                            <TableCell colSpan={7} className="p-0 border-0"></TableCell>
                                        </TableRow>
                                      );
                                    }

                                    // 2. HAUPTFELD HEADER (Minimalistisch)
                                    rows.push(
                                        <TableRow key="header-active" className="bg-muted/30 hover:bg-muted/40">
                                          <TableCell colSpan={7} className="py-2 px-6 border-y">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                  <span className="font-semibold text-sm">Turnierfeld</span>
                                                  <span className="text-xs text-muted-foreground">({activePlayers.length} / {max} belegt)</span>
                                                </div>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                    );

                                    // 3. Platzhalter (Schlanker)
                                    if (waitingPlayers.length > 0 && activePlayers.length < max) {
                                      const slotsToFill = max - activePlayers.length;
                                      for (let i = 0; i < slotsToFill; i++) {
                                        rows.push(
                                          <TableRow key={`placeholder-${i}`} className="bg-yellow-50/30 border-dashed border-b border-yellow-200">
                                            <TableCell colSpan={7} className="py-2 px-6">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-yellow-700/80">
                                                    <span className="text-sm italic">Offener Platz #{activePlayers.length + 1 + i}</span>
                                                </div>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm"
                                                  className="h-7 text-xs text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100"
                                                  onClick={() => setAddPlayerDialogOpen(true)}
                                                >
                                                  <Plus className="mr-1 h-3 w-3" />
                                                  Nachrücken
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      }
                                    }

                                    // 5. Aktive Spieler
                                    activePlayers.forEach(p => rows.push(renderRow(p)));

                                    return rows;
                                  })()}
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
            {/* Simple Delete Dialog */}
            {playerToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl z-50">
                  <h3 className="text-lg font-semibold mb-4 text-black">Spieler entfernen</h3>
                  <p className="mb-4 text-black">
                    Sind Sie sicher, dass Sie <strong>{playerToDelete.playerName}</strong> entfernen möchten?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setPlayerToDelete(null);
                      }}
                    >
                      Abbrechen
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        confirmDelete();
                        setDeleteDialogOpen(false);
                        setPlayerToDelete(null);
                      }}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Promote Dialog */}
            <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Spieler entfernen & Nachrücker wählen</DialogTitle>
                  <div className="text-sm text-muted-foreground mt-2">
                    Sie entfernen <strong>{playerToDelete?.playerName}</strong>.
                    Es befinden sich <strong>{waitingListCandidates.length}</strong> Spieler auf der Warteliste.
                  </div>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Nachrücker auswählen (Optional)</Label>
                    <Select value={selectedPromotePlayerId} onValueChange={setSelectedPromotePlayerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie einen Nachrücker..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Niemanden nachrücken lassen --</SelectItem>
                        {waitingListCandidates.map(candidate => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.playerName} ({new Date(candidate.registeredAt).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Der ausgewählte Spieler erhält automatisch den Status "Bestätigt".
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => confirmDelete(selectedPromotePlayerId)}
                  >
                    {selectedPromotePlayerId !== 'none' ? 'Entfernen & Nachrücken' : 'Nur Entfernen'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={addPlayerDialogOpen} onOpenChange={(open) => {
              setAddPlayerDialogOpen(open);
              if (!open) setIsCreatingNew(false); // Reset on close
            }}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{isCreatingNew ? 'Neuen Spieler anlegen' : 'Spieler hinzufügen'}</DialogTitle>
                </DialogHeader>
                
                {isCreatingNew ? (
                  <div className="py-4 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input 
                            value={newPlayerName} 
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Max Mustermann"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-Mail</Label>
                          <Input 
                            value={newPlayerEmail} 
                            onChange={(e) => setNewPlayerEmail(e.target.value)} 
                            placeholder="max@beispiel.de"
                            type="email"
                          />
                        </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreatingNew(false)}>Zurück</Button>
                        <Button onClick={handleCreatePlayer}>Spieler anlegen</Button>
                     </div>
                  </div>
                ) : (
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Aus Warteliste nachrücken lassen</Label>
                      <Select onValueChange={(val) => {
                        updatePlayerStatus(val, 'CONFIRMED');
                        setAddPlayerDialogOpen(false);
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Kandidat aus Warteliste wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {players.filter(p => p.status === 'WAITING_LIST').length > 0 ? (
                             players.filter(p => p.status === 'WAITING_LIST').map(candidate => (
                              <SelectItem key={candidate.id} value={candidate.id}>
                                {candidate.playerName} ({new Date(candidate.registeredAt).toLocaleDateString()})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">Keine Spieler auf der Warteliste</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Oder neuen Spieler erstellen</span>
                      </div>
                    </div>

                    <Button className="w-full h-12" variant="outline" onClick={() => setIsCreatingNew(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Neuen Spieler manuell anlegen
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

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
