"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Trophy } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Tournament {
  id: string;
  name: string;
}

export function TournamentSwitcher() {
  const { isMobile } = useSidebar()
  const [tournaments, setTournaments] = React.useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = React.useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      try {
        const [tournamentsRes, activeRes] = await Promise.all([
          fetch('/api/tournaments'),
          fetch('/api/tournament/active')
        ])

        if (tournamentsRes.ok) {
          const fetchedTournaments = await tournamentsRes.json()
          setTournaments(fetchedTournaments)

          let selected = null
          if (activeRes.ok) {
            const activeData = await activeRes.json()
            if (activeData.activeTournamentId) {
              selected = fetchedTournaments.find((t: Tournament) => t.id === activeData.activeTournamentId)
            }
          }
          
          if (!selected && fetchedTournaments.length > 0) {
            selected = fetchedTournaments[0]
            await fetch('/api/tournament/active', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tournamentId: selected.id })
            })
          }
          
          setActiveTournament(selected)
        }
      } catch (error) {
        console.error("Failed to load tournaments", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSelect = async (tournament: Tournament) => {
    setActiveTournament(tournament)
    try {
      await fetch('/api/tournament/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: tournament.id })
      })
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading || !activeTournament) {
    return (
       <SidebarMenu>
         <SidebarMenuItem>
           <SidebarMenuButton size="lg" className="animate-pulse">
             <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted" />
             <div className="flex-1 space-y-1">
               <div className="h-4 bg-muted rounded w-3/4"></div>
               <div className="h-3 bg-muted rounded w-1/2"></div>
             </div>
           </SidebarMenuButton>
         </SidebarMenuItem>
       </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeTournament.name}</span>
                <span className="truncate text-xs">Turnier</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Turniere
            </DropdownMenuLabel>
            {tournaments.map((tournament) => (
              <DropdownMenuItem
                key={tournament.id}
                onClick={() => handleSelect(tournament)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Trophy className="size-4 shrink-0" />
                </div>
                <span className="font-medium">{tournament.name}</span>
                {activeTournament.id === tournament.id && (
                  <span className="ml-auto text-xs text-primary font-semibold">Aktiv</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
