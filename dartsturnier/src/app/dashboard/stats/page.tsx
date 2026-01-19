import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Trophy, Target, Calendar, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

async function getStats() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [
    tournamentCount,
    playerCount,
    totalGames,
    totalThrows,
    avgScoreResult,
    highestCheckoutResult,
    oneEightiesResult
  ] = await Promise.all([
    prisma.tournament.count(),
    prisma.user.count(),
    prisma.game.count({ where: { status: "FINISHED" } }),
    prisma.throw.count(),
    prisma.throw.aggregate({
      _avg: { score: true }
    }),
    prisma.tournamentPlayer.aggregate({
      _max: { highFinish: true }
    }),
    prisma.tournamentPlayer.aggregate({
      _sum: { oneEighties: true }
    })
  ]);
  
  // Calculate average score
  const avgScore = avgScoreResult._avg.score ? Math.round(avgScoreResult._avg.score * 3) : 0; // Avg per throw -> per turn (approx)

  // Get most active players
  const topPlayers = await prisma.tournamentPlayer.findMany({
      take: 5,
      orderBy: { matchesPlayed: "desc" },
      include: { user: true, tournament: true }
  });

  return {
    tournamentCount,
    playerCount,
    totalGames,
    totalThrows,
    avgScore, // 3-Dart Average approximation
    highestCheckout: highestCheckoutResult._max.highFinish || 0,
    oneEighties: oneEightiesResult._sum.oneEighties || 0,
    topPlayers
  };
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-6 p-6 transition-all animate-in fade-in">
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
         <p className="text-muted-foreground">Übersicht über alle Turniere und Spielerleistungen.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tournaments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turniere Gesamt</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tournamentCount}</div>
            <p className="text-xs text-muted-foreground">Veranstaltete Turniere</p>
          </CardContent>
        </Card>

        {/* Total Players */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrierte Spieler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.playerCount}</div>
            <p className="text-xs text-muted-foreground">Aktive Nutzerkonten</p>
          </CardContent>
        </Card>

        {/* Total Games */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Gespielte Matches</CardTitle>
             <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGames}</div>
            <p className="text-xs text-muted-foreground">Absolvierte Spiele</p>
          </CardContent>
        </Card>

        {/* Total Throws */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geworfene Darts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{stats.totalThrows.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">Registrierte Würfe</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Performance Stats */}
             <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                   <CardTitle>Leistungsübersicht</CardTitle>
                   <CardDescription>Gesamtstatistiken aller Spieler</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-3xl font-bold text-indigo-600">{stats.oneEighties}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">Total 180s</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-3xl font-bold text-emerald-600">{stats.highestCheckout}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">Höchstes Finish</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">~{stats.avgScore}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">Ø 3-Dart Score</div>
                    </div>
                </CardContent>
             </Card>

             {/* Top Players List */}
             <Card className="col-span-1">
                <CardHeader>
                   <CardTitle>Aktivste Spieler</CardTitle>
                   <CardDescription>Nach gespielten Matches</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {stats.topPlayers.length === 0 ? (
                          <div className="text-center text-sm text-muted-foreground py-4">Keine Daten verfügbar</div>
                      ) : (
                          stats.topPlayers.map((player, i) => (
                             <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-600">
                                      {i + 1}
                                   </div>
                                   <div className="space-y-0.5 overflow-hidden">
                                      <p className="text-sm font-medium leading-none truncate">{player.playerName}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{player.tournament.name}</p>
                                   </div>
                                </div>
                                <div className="font-bold text-sm shrink-0">{player.matchesPlayed} Matches</div>
                             </div>
                          ))
                      )}
                   </div>
                </CardContent>
             </Card>
       </div>
    </div>
  );
}
