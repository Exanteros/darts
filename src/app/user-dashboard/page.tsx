"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, Trophy, Calendar, Target, User, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";

/* ======================== LOGO COMPONENT ======================== */

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/admin/tournament/settings');
        if (response.ok) {
          const settings = await response.json();
          setMainLogo(settings.mainLogo || '');
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  if (mainLogo) {
    return (
      <img
        src={mainLogo}
        alt="Turnier Logo"
        className="h-12 w-auto object-contain"
      />
    );
  }

  // Fallback
  return (
    <div className="flex items-center gap-2">
      <Target className="h-8 w-8 text-primary" />
      <span className="font-bold text-xl">Darts Masters</span>
    </div>
  );
}

/* ======================== HEADER ======================== */

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/user/stats">Statistiken</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/user-dashboard">Dashboard</a>
          </Button>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="hidden sm:inline-flex" asChild>
            <a href="/login">Anmelden</a>
          </Button>
          <Button size="sm" asChild>
            <a href="/tournament/register">Jetzt anmelden</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ======================== FOOTER ======================== */

function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Darts Masters</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professionelles Darts-Turnier<br />
              Puschendorf 2025
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Turnier</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/tournament/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Anmeldung
                </a>
              </li>
              <li>
                <a href="/user/stats" className="text-muted-foreground hover:text-foreground transition-colors">
                  Statistiken
                </a>
              </li>
              <li>
                <a href="/user-dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Anmelden
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2">Live-Scoring</Badge>
              <Badge variant="outline" className="mr-2">5+ Scheiben</Badge>
              <Badge variant="outline">Fair Play</Badge>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Darts Masters Puschendorf. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-4">
            <a href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a>
            <a href="/impressum" className="hover:text-foreground transition-colors">Impressum</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface UserTournament {
  id: string;
  name: string;
  status: string;
  tournamentStatus: string;
  startDate: string;
  playerName: string;
  paid: boolean;
  paymentStatus: string;
  paymentMethod?: string;
  registeredAt: string;
  entryFee: number;
  // Statistiken
  average?: number;
  firstNineAvg?: number;
  highFinish?: number;
  oneEighties?: number;
  checkoutRate?: number;
  matchesPlayed?: number;
  matchesWon?: number;
  currentRank?: number;
  prizeMoney?: number;
}

interface UserStats {
  registeredTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPaid: number;
}

export default function UserDashboard() {
  const [tournaments, setTournaments] = useState<UserTournament[]>([]);
  const [stats, setStats] = useState<UserStats>({
    registeredTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalPaid: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const fetchUserData = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/user/dashboard?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();

      if (data.success) {
        console.log('👤 User-Daten geladen:', data);
        setTournaments(data.tournaments || []);
        setStats(data.stats || {
          registeredTournaments: 0,
          activeTournaments: 0,
          completedTournaments: 0,
          totalPaid: 0
        });
      } else {
        console.error('Error fetching user data:', data.message);
        setTournaments([]);
        setStats({
          registeredTournaments: 0,
          activeTournaments: 0,
          completedTournaments: 0,
          totalPaid: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setTournaments([]);
      setStats({
        registeredTournaments: 0,
        activeTournaments: 0,
        completedTournaments: 0,
        totalPaid: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-foreground/20 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Lade Dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <User className="h-10 w-10" />
              Mein Dashboard
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Verwalte deine Turnier-Anmeldungen und verfolge deinen Fortschritt
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  Angemeldete Turniere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.registeredTournaments}</div>
                <p className="text-sm text-muted-foreground mt-2">Aktive Registrierungen</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  Aktive Turniere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeTournaments}</div>
                <p className="text-sm text-muted-foreground mt-2">Laufende Turniere</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Abgeschlossene
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completedTournaments}</div>
                <p className="text-sm text-muted-foreground mt-2">Beendete Turniere</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Gesamt bezahlt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(stats.totalPaid)}</div>
                <p className="text-sm text-muted-foreground mt-2">Startgebühren</p>
              </CardContent>
            </Card>
          </div>

          {/* Meine Turniere */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Meine Turniere</h2>
              <Link href="/tournament/register">
                <Button>
                  <Trophy className="h-4 w-4 mr-2" />
                  Neues Turnier finden
                </Button>
              </Link>
            </div>

            {tournaments.length === 0 ? (
              <Card className="border shadow-sm">
                <CardContent className="text-center py-20">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                  <h3 className="text-lg font-medium mb-3">Noch keine Turniere</h3>
                  <p className="text-muted-foreground mb-8">Melde dich für dein erstes Darts-Turnier an!</p>
                  <Link href="/tournament/register">
                    <Button>Turniere durchsuchen</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{tournament.name}</CardTitle>
                        <Badge variant={
                          tournament.status === 'ACTIVE' ? 'default' :
                          tournament.status === 'CONFIRMED' ? 'secondary' :
                          tournament.status === 'ELIMINATED' ? 'destructive' :
                          tournament.status === 'WITHDRAWN' ? 'outline' :
                          'default'
                        }>
                          {tournament.status === 'REGISTERED' && 'Angemeldet'}
                          {tournament.status === 'CONFIRMED' && 'Bestätigt'}
                          {tournament.status === 'ACTIVE' && 'Aktiv'}
                          {tournament.status === 'ELIMINATED' && 'Ausgeschieden'}
                          {tournament.status === 'WITHDRAWN' && 'Zurückgezogen'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(tournament.startDate).toLocaleDateString('de-DE')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {tournament.playerName}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Zahlung:</span>
                          <Badge variant={tournament.paid ? 'default' : 'outline'} className="text-xs">
                            {tournament.paid ? 'Bezahlt' : 'Ausstehend'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Startgeld:</span>
                          <span className="text-sm font-semibold">
                            €{tournament.entryFee?.toFixed(2) || '0.00'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Registriert:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(tournament.registeredAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>

                        {/* Spieler-Statistiken (wenn vorhanden) */}
                        {(tournament.matchesPlayed !== undefined && tournament.matchesPlayed > 0) && (
                          <>
                            <Separator className="my-2" />
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Spiele:</span>
                                <span className="font-medium">{tournament.matchesWon || 0}/{tournament.matchesPlayed || 0}</span>
                              </div>
                              {tournament.average && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Average:</span>
                                  <span className="font-medium">{tournament.average.toFixed(2)}</span>
                                </div>
                              )}
                              {tournament.currentRank && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Rang:</span>
                                  <Badge variant="secondary" className="text-xs">#{tournament.currentRank}</Badge>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        <Separator className="my-4" />

                        <div className="flex gap-3 pt-2">
                          <Link href={`/tournament/${tournament.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              Details
                            </Button>
                          </Link>
                          {!tournament.paid && (
                            <Button size="sm" className="flex-1">
                              Jetzt bezahlen
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Konto verwalten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Aktualisiere deine Profil-Informationen und Einstellungen.
                </p>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Zum Profil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  Neue Turniere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Entdecke neue Darts-Turniere in deiner Region.
                </p>
                <Link href="/tournament/register">
                  <Button className="w-full">Turniere finden</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  Eigene Statistiken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Analysiere deine Leistung und verfolge deinen Fortschritt.
                </p>
                <Link href="/user/stats">
                  <Button variant="outline" className="w-full">
                    Statistiken ansehen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
