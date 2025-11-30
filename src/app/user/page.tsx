"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Trophy, Calendar, Target, User, Settings, 
  TrendingUp, CreditCard, ChevronRight, ArrowUpRight, 
  Loader2, LogOut, LayoutDashboard 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

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
  average?: number;
  currentRank?: number;
  matchesPlayed?: number;
  matchesWon?: number;
}

interface UserStats {
  registeredTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPaid: number;
}

/* ================= ANIMATION VARIANTS ================= */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4 } 
  }
};

/* ================= COMPONENTS ================= */

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/public/logo')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setMainLogo(data.mainLogo || ''))
      .catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-2 group">
      <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
        {mainLogo ? (
          <img src={mainLogo} alt="Logo" className="h-5 w-5 object-contain" />
        ) : (
          <Target className="h-4 w-4 text-white" />
        )}
      </div>
      <span className="font-bold tracking-tight text-lg text-slate-900">Darts Masters</span>
    </div>
  );
}

function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/user/stats" className="hover:text-slate-900 transition-colors">Statistiken</Link>
          <Link href="/user" className="text-slate-900">Dashboard</Link>
          <Link href="/profile" className="hover:text-slate-900 transition-colors">Einstellungen</Link>
        </nav>

        <div className="flex items-center gap-3">
           <Button 
             variant="ghost" 
             size="sm" 
             className="hidden sm:inline-flex text-slate-600 hover:text-red-600 hover:bg-red-50"
             onClick={handleLogout}
           >
             <LogOut className="h-4 w-4 mr-2" /> Logout
           </Button>
           <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full" asChild>
            <Link href="/tournament/register">Neues Turnier</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ title, value, subtext, icon: Icon, delay }: any) {
  return (
    <motion.div variants={itemVariants} className="h-full">
      <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200/60 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300">
        
        {/* Decorative Background Blob */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 group-hover:bg-blue-50/50 transition-colors duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
             <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
               <Icon className="h-5 w-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
             </div>
          </div>
          
          <div className="mt-auto">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {value}
            </div>
            <div className="font-bold text-sm text-slate-700 mb-1">
              {title}
            </div>
            <div className="text-xs text-slate-400 font-medium leading-relaxed">
              {subtext}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= MAIN PAGE ================= */

export default function UserDashboard() {
  const [tournaments, setTournaments] = useState<UserTournament[]>([]);
  const [user, setUser] = useState<{ name: string | null, email: string } | null>(null);
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

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/dashboard?t=${Date.now()}`);
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTournaments(data.tournaments || []);
        setUser(data.user || null);
        setStats(data.stats || { registeredTournaments: 0, activeTournaments: 0, completedTournaments: 0, totalPaid: 0 });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      REGISTERED: "bg-blue-50 text-blue-700 border-blue-200",
      CONFIRMED: "bg-green-50 text-green-700 border-green-200",
      ACTIVE: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
      ELIMINATED: "bg-slate-100 text-slate-500 border-slate-200",
      WITHDRAWN: "bg-red-50 text-red-700 border-red-200"
    };
    
    const labels: Record<string, string> = {
      REGISTERED: "Registriert",
      CONFIRMED: "Bestätigt",
      ACTIVE: "Läuft gerade",
      ELIMINATED: "Ausgeschieden",
      WITHDRAWN: "Zurückgezogen"
    };

    return (
      <Badge variant="outline" className={cn("font-medium border", styles[status] || styles.REGISTERED)}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Lade Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute top-0 right-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-blue-50 opacity-40 blur-[80px]" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12 max-w-7xl mx-auto"
        >
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.div variants={itemVariants}>
                <Badge variant="outline" className="mb-4 bg-slate-50 text-slate-600 border-slate-200">
                  <User className="mr-1 h-3 w-3" /> Spielerbereich
                </Badge>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Willkommen zurück{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </motion.h1>
              <motion.p variants={itemVariants} className="mt-2 text-lg text-slate-500 max-w-2xl">
                Angemeldet als <span className="font-medium text-slate-900">{user?.email}</span> <br /> Hier ist der Überblick über deine Turniere.
              </motion.p>
            </div>
            <motion.div variants={itemVariants}>
               <div className="text-right hidden md:block">
                 <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Nächstes Event</p>
                 <p className="text-sm font-bold text-slate-900">Februar 2025</p>
               </div>
            </motion.div>
          </div>

          <Separator className="opacity-50" />

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Registriert" 
              value={stats.registeredTournaments} 
              subtext="Ausstehende & kommende Events"
              icon={Calendar} 
            />
            <StatCard 
              title="Aktive Turniere" 
              value={stats.activeTournaments} 
              subtext="Derzeit laufende Wettbewerbe"
              icon={Target} 
            />
            <StatCard 
              title="Gespielt" 
              value={stats.completedTournaments} 
              subtext="Erfolgreich abgeschlossene Events"
              icon={Trophy} 
            />
            <StatCard 
              title="Investiert" 
              value={formatCurrency(stats.totalPaid)} 
              subtext="Gezahlte Startgebühren"
              icon={CreditCard} 
            />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Tournament List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Deine Turniere</h2>
                <Link href="/tournament/register" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center hover:underline">
                  Alle ansehen <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </div>

              {tournaments.length === 0 ? (
                <motion.div variants={itemVariants}>
                  <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-12 w-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                        <LayoutDashboard className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">Keine Turniere gefunden</h3>
                      <p className="text-slate-500 mb-6 max-w-sm">
                        Du bist noch für keine Turniere angemeldet. Starte jetzt durch!
                      </p>
                      <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800" asChild>
                        <Link href="/tournament/register">Jetzt anmelden</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <motion.div key={tournament.id} variants={itemVariants}>
                      <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        {/* Status Indicator Line */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
                          tournament.status === 'ACTIVE' ? "bg-blue-500" : 
                          tournament.status === 'CONFIRMED' ? "bg-emerald-500" : "bg-slate-300"
                        )} />

                        <div className="p-4 sm:p-5 sm:pl-6 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                          
                          {/* Top Row (Mobile) / Left Side (Desktop): Date + Info */}
                          <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
                            {/* Date Block */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 rounded-xl h-14 w-14 sm:h-16 sm:w-16 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {new Date(tournament.startDate).toLocaleString('de-DE', { month: 'short' }).replace('.', '')}
                              </span>
                              <span className="text-lg sm:text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                                {new Date(tournament.startDate).getDate()}
                              </span>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between sm:justify-start gap-3">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                  {tournament.name}
                                </h3>
                                <div className="sm:hidden">
                                  {getStatusBadge(tournament.status)}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-medium text-slate-700">{tournament.playerName}</span>
                                </div>
                                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{tournament.entryFee === 0 ? 'Kostenlos' : `${tournament.entryFee}€ Startgeld`}</span>
                                </div>
                                <div className="hidden sm:block">
                                  {getStatusBadge(tournament.status)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions & Status */}
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                            {!tournament.paid && tournament.entryFee > 0 && (
                              <>
                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium w-full sm:w-auto justify-center sm:justify-start">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Zahlung offen
                                </div>
                                <Button size="sm" className="w-full sm:w-auto bg-slate-900 text-white hover:bg-black shadow-md shadow-slate-900/10 h-9 px-5" asChild>
                                  <Link href={`/tournament/${tournament.id}/pay`}>
                                    Jetzt bezahlen
                                  </Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Quick Actions & Profile */}
            <div className="space-y-6">
              
              <motion.div variants={itemVariants}>
                <Card className="border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      Statistik Center
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Analysiere deine Average-Entwicklung und Checkout-Quoten.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-200" asChild>
                      <Link href="/user/stats">Details ansehen</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-slate-200 shadow-sm">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base font-bold text-slate-900">Schnellzugriff</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-2">
                     <Link href="/profile" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 rounded-md text-slate-600 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                              <Settings className="h-4 w-4" />
                           </div>
                           <span className="font-medium text-slate-700 group-hover:text-slate-900">Profil bearbeiten</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                     </Link>

                     <Link href="/tournament/register" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 rounded-md text-slate-600 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                              <Target className="h-4 w-4" />
                           </div>
                           <span className="font-medium text-slate-700 group-hover:text-slate-900">Turniere finden</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                     </Link>
                   </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>

        </motion.div>
      </main>

      {/* Footer Reuse */}
      <footer className="border-t border-slate-100 bg-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">© 2025 Darts Masters Puschendorf</p>
        </div>
      </footer>
    </div>
  );
}