"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TournamentSwitcher() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [tournaments, setTournaments] = React.useState<{ id: string; name: string }[]>([])
  const [activeTournament, setActiveTournament] = React.useState<{ id: string; name: string } | null>(null)
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchTournaments()
    
    const handleUpdate = () => fetchTournaments();
    window.addEventListener('tournament-updated', handleUpdate);
    return () => window.removeEventListener('tournament-updated', handleUpdate);
  }, [])

  async function fetchTournaments() {
    try {
      // Fetch all tournaments
      const response = await fetch('/api/dashboard/data')
      const data = await response.json()
      
      if (data.success) {
        const formattedTournaments = data.data.map((t: { id: string; header: string; isCurrent: boolean }) => ({
          id: t.id,
          name: t.header,
          isCurrent: t.isCurrent
        }))
        setTournaments(formattedTournaments)

        // Fetch active tournament from cookie API
        const activeResponse = await fetch('/api/tournament/active')
        const activeData = await activeResponse.json()
        
        if (activeData.activeTournamentId) {
          const active = formattedTournaments.find((t: { id: string; name: string; isCurrent: boolean }) => t.id === activeData.activeTournamentId)
          if (active) {
            setActiveTournament(active)
          } else if (formattedTournaments.length > 0) {
             // Fallback if cookie is invalid
             setActiveTournament(formattedTournaments[0])
          }
        } else if (formattedTournaments.length > 0) {
          // Default to first one (latest)
          setActiveTournament(formattedTournaments[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch tournaments", error)
    }
  }

  async function setActive(tournament: { id: string; name: string }) {
    try {
      await fetch('/api/tournament/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: tournament.id })
      })
      setActiveTournament(tournament)
      window.location.reload() // Reload to apply changes everywhere
    } catch (error) {
      console.error("Failed to set active tournament", error)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const maxPlayers = formData.get("maxPlayers") as string

    try {
      const response = await fetch("/api/tournament", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          maxPlayers,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Erstellen")
      }

      const data = await response.json()
      
      // Set as active tournament
      if (data.tournament && data.tournament.id) {
        await fetch('/api/tournament/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tournamentId: data.tournament.id })
        })
      }

      toast.success("Turnier erstellt")
      setOpen(false)
      window.dispatchEvent(new Event('tournament-updated'))
      window.location.reload()
    } catch (error) {
      toast.error("Fehler beim Erstellen des Turniers")
    } finally {
      setLoading(false)
    }
  }

  if (!activeTournament) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="font-bold text-lg">{activeTournament.name.substring(0, 1)}</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTournament.name}
                </span>
                <span className="truncate text-xs">Aktives Turnier</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
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
                onClick={() => setActive(tournament)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <span className="font-bold text-xs">{tournament.name.substring(0, 1)}</span>
                </div>
                {tournament.name}
                {activeTournament.id === tournament.id && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => setOpen(true)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Turnier erstellen</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turnier erstellen</DialogTitle>
            <DialogDescription>
              Geben Sie die Details für das neue Turnier ein.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Turniername</Label>
              <Input id="name" name="name" required placeholder="z.B. Weihnachtsturnier 2025" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxPlayers">Maximale Spielerzahl</Label>
              <Input id="maxPlayers" name="maxPlayers" type="number" defaultValue="64" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Erstelle..." : "Turnier erstellen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
