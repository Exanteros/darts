"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Target, TrendingUp, Award, Zap, 
  Crosshair, Hash, Trophy, Percent, Crown, Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface PlayerStats {
  playerId: string;
  playerName: string;
  tournaments: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  average: number;
  firstNineAvg: number;
  highFinish: number;
  oneEighties: number;
  checkoutRate: number;
  doubleRate: number;
  bestLeg: number;
  totalPoints: number;
  currentRank: number | null;
  prizeMoney: number;
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
  hidden: { opacity: 0, y: 15 },
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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </Link>
        <div className="flex items-center gap-4">
           <Link href="/user">
             <Button variant="ghost" size="sm" className="text-slate-600">
               <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
             </Button>
           </Link>
        </div>
      </div>
    </header>
  );
}

function StatBox({ title, value, subtext, icon: Icon, mono = false, trend }: any) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </span>
          {trend && (
             <Badge variant="secondary" className="bg-green-50 text-green-700 text-[10px] px-1.5 h-5 border-green-100">
               {trend}
             </Badge>
          )}
        </div>
        <div className={cn("text-3xl font-bold text-slate-900 tracking-tight", mono && "font-mono")}>
          {value}
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, label, valueLabel, colorClass = "bg-slate-900" }: { value: number, label: string, valueLabel: string, colorClass?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-mono font-bold text-slate-900">{valueLabel}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1 }}
          className={cn("h-full rounded-full", colorClass)} 
        />
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */

export default function UserStatisticsPage() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/statistics', { headers: { 'Cache-Control': 'no-cache' } });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Keine Statistiken verfügbar');
      }
    } catch (err) {
      setError('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Analysiere Daten...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 top-0 -z-10 h-[400px] w-[400px] bg-blue-50 opacity-50 blur-[100px]" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">
              <TrendingUp className="h-3 w-3 mr-1" /> Analytics
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-2">
            Performance
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Detaillierte Analyse deiner Wurfleistung, Checkouts und Turnier-Ergebnisse.
          </p>
        </motion.div>

        {error ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center">
             <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-900">Keine Daten vorhanden</h3>
             <p className="text-slate-500 mb-6">{error}</p>
             <Button asChild className="bg-slate-900 text-white"><Link href="/tournament/register">Zum ersten Turnier anmelden</Link></Button>
          </Card>
        ) : stats && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            
            {/* Player Identity Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-800 to-black text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                        {stats.playerName.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900">{stats.playerName}</h2>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {stats.tournaments} Turniere</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {stats.gamesPlayed} Spiele</span>
                        </div>
                     </div>
                  </div>
                  {stats.currentRank && (
                     <div className="text-center sm:text-right px-6 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Rangliste</div>
                        <div className="text-3xl font-bold text-slate-900 flex items-center justify-center sm:justify-end gap-1">
                          <span className="text-blue-500">#</span>{stats.currentRank}
                        </div>
                     </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={itemVariants}>
                <StatBox 
                  title="3-Dart Average" 
                  value={stats.average?.toFixed(2) || '-'} 
                  subtext="Punkte pro Aufnahme"
                  icon={TrendingUp}
                  mono={true}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatBox 
                  title="Win Rate" 
                  value={`${stats.winRate.toFixed(1)}%`} 
                  subtext={`${stats.gamesWon} Siege / ${stats.gamesPlayed} Spiele`}
                  icon={Award}
                  trend={stats.winRate > 50 ? "Positiv" : undefined}
                  mono={true}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatBox 
                  title="180er" 
                  value={stats.oneEighties || 0} 
                  subtext="Maximum Scores"
                  icon={Zap}
                  mono={true}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatBox 
                  title="High Finish" 
                  value={stats.highFinish || 0} 
                  subtext="Höchster Checkout"
                  icon={Crown}
                  mono={true}
                />
              </motion.div>
            </div>

            {/* Detail Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left: Scoring & Power */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="h-full border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" /> Scoring Power
                    </CardTitle>
                    <CardDescription>Deine Leistung in der Score-Phase des Spiels.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">First 9 Average</p>
                          <p className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
                            {stats.firstNineAvg?.toFixed(2) || '-'}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">Der Average deiner ersten 9 Darts pro Leg.</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Bestes Leg</p>
                          <p className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
                            {stats.bestLeg || '-'} <span className="text-lg text-slate-400 font-sans font-normal">Darts</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-2">Dein schnellstes gewonnenes Leg.</p>
                        </div>
                     </div>

                     <Separator />

                     <div>
                        <div className="flex justify-between items-end mb-4">
                           <div>
                              <p className="text-sm font-medium text-slate-900">Total Points Scored</p>
                              <p className="text-2xl font-mono font-bold text-slate-900">
                                {stats.totalPoints?.toLocaleString('de-DE') || 0}
                              </p>
                           </div>
                           <Badge variant="outline">Lifetime</Badge>
                        </div>
                        {/* Placeholder for a chart visualization if we had one */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                           <div className="h-full bg-slate-800 w-full opacity-10"></div>
                        </div>
                     </div>

                  </CardContent>
                </Card>
              </motion.div>

              {/* Right: Finishing */}
              <motion.div variants={itemVariants}>
                <Card className="h-full border-slate-200 shadow-sm bg-slate-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Crosshair className="h-5 w-5 text-red-500" /> Finishing
                    </CardTitle>
                    <CardDescription>Checkout & Doppel-Quoten</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <ProgressBar 
                      label="Checkout Rate" 
                      value={stats.checkoutRate || 0} 
                      valueLabel={`${stats.checkoutRate?.toFixed(1) || 0}%`}
                      colorClass="bg-blue-600"
                    />

                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </motion.div>
        )}
      </main>

      {/* Simplified Footer for clean look */}
      <footer className="border-t border-slate-100 bg-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
           <Link href="/user-dashboard" className="text-sm text-slate-400 hover:text-slate-900 transition-colors">
              Zurück zur Übersicht
           </Link>
        </div>
      </footer>
    </div>
  );
}