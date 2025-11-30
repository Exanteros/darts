"use client";

import { IconTrendingDown, IconTrendingUp, IconUsers, IconTrophy, IconTarget, IconActivity } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const [stats, setStats] = useState({
    registeredPlayers: 0,
    maxPlayers: 64,
    activeBoards: 0,
    totalTournaments: 0,
    activeGames: 0,
    currentRound: 0,
    tournamentStatus: 'Anmeldung',
    tournamentPhase: 'Bereit',
    remainingPlayers: 0,
    nextPhase: 'Wartet auf Anmeldungen',
    tournamentName: 'Lade Turnier...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/dashboard/stats?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();

      if (data.success) {
        console.log('📊 SectionCards Stats geladen:', data.stats);
        setStats(data.stats);
      } else {
        console.error('Error fetching section stats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching section stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @5xl/main:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardDescription className="text-gray-600">Angemeldete Spieler</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-3xl">
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @5xl/main:grid-cols-4">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardDescription className="text-gray-600">Angemeldete Spieler</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-3xl">
            {stats.registeredPlayers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`border-gray-300 ${stats.registeredPlayers >= stats.maxPlayers ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
              <IconUsers className="text-gray-600" />
              {stats.registeredPlayers >= stats.maxPlayers ? 'Vollständig' : 'Verfügbar'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {stats.registeredPlayers >= stats.maxPlayers
              ? `Alle ${stats.maxPlayers} Plätze belegt`
              : `${stats.maxPlayers - stats.registeredPlayers} Plätze verfügbar`
            } <IconUsers className="size-4 text-gray-600" />
          </div>
          <div className="text-gray-600">
            {stats.tournamentName}
          </div>
        </CardFooter>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardDescription className="text-gray-600">Aktive Scheiben</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-3xl">
            {stats.activeBoards}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              <IconActivity className="text-gray-600" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {stats.activeBoards} Scheiben im Betrieb <IconActivity className="size-4 text-gray-600" />
          </div>
          <div className="text-gray-600">
            {stats.activeBoards > 0 ? 'Scheibe 1: Broadcast-Qualität' : 'Keine aktiven Scheiben'}
          </div>
        </CardFooter>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardDescription className="text-gray-600">Laufende Spiele</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-3xl">
            {stats.activeGames}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              <IconTrophy className="text-gray-600" />
              {stats.currentRound ? `Runde ${stats.currentRound}` : 'Keine Runde'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {stats.activeGames} Spiele aktiv <IconTrophy className="size-4 text-gray-600" />
          </div>
          <div className="text-gray-600">
            {stats.activeGames > 0 ? 'First to 2 Legs' : 'Keine aktiven Spiele'}
          </div>
        </CardFooter>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardDescription className="text-gray-600">Turnier-Status</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-gray-900 @[250px]/card:text-3xl">
            {stats.tournamentStatus || 'Anmeldung'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              <IconTarget className="text-gray-600" />
              {stats.tournamentPhase || 'Bereit'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {stats.remainingPlayers || stats.registeredPlayers} Spieler verbleibend <IconTarget className="size-4 text-gray-600" />
          </div>
          <div className="text-gray-600">
            {stats.nextPhase || 'Wartet auf Anmeldungen'}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
