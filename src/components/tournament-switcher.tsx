"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Trophy } from "lucide-react"

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

export function TournamentSwitcher() {
  const { isMobile } = useSidebar()
  const [activeTournament, setActiveTournament] = React.useState({
    name: "Darts Masters 2024",
    logo: Trophy,
    plan: "Pro",
  })

  const tournaments = [
    {
      name: "Darts Masters 2024",
      logo: Trophy,
      plan: "Pro",
    },
    {
      name: "Vereinsmeisterschaft",
      logo: Trophy,
      plan: "Free",
    },
  ]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 rounded-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-slate-900 text-white">
                <activeTournament.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-slate-900">
                  {activeTournament.name}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {activeTournament.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-sm border-slate-200 bg-white shadow-sm"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Turniere
            </DropdownMenuLabel>
            {tournaments.map((tournament, index) => (
              <DropdownMenuItem
                key={tournament.name}
                onClick={() => setActiveTournament(tournament)}
                className="gap-2 p-2 rounded-sm focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border border-slate-200 bg-white">
                  <tournament.logo className="size-4 shrink-0 text-slate-900" />
                </div>
                <span className="text-slate-900">{tournament.name}</span>
                <DropdownMenuShortcut className="text-slate-400">⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem className="gap-2 p-2 rounded-sm focus:bg-slate-100 focus:text-slate-900 cursor-pointer">
              <div className="flex size-6 items-center justify-center rounded-sm border border-slate-200 bg-slate-50">
                <Plus className="size-4 text-slate-500" />
              </div>
              <div className="font-medium text-slate-600">Neues Turnier</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
