"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { signOut } from "next-auth/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 rounded-sm transition-colors hover:bg-slate-50"
            >
              <Avatar className="h-8 w-8 rounded-sm border border-slate-200">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-sm bg-slate-100 text-slate-900 font-mono text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-slate-900">{user.name}</span>
                <span className="truncate text-xs text-slate-500">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-sm border-slate-200 bg-white shadow-sm"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-sm border border-slate-200">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-sm bg-slate-100 text-slate-900 font-mono text-xs">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-slate-900">{user.name}</span>
                  <span className="truncate text-xs text-slate-500">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-sm focus:bg-slate-100 focus:text-slate-900 cursor-pointer">
                <BadgeCheck className="mr-2 h-4 w-4 text-slate-500" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-sm focus:bg-slate-100 focus:text-slate-900 cursor-pointer">
                <Bell className="mr-2 h-4 w-4 text-slate-500" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-sm focus:bg-slate-100 focus:text-slate-900 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4 text-slate-500" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
