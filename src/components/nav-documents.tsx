"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
}: {
  items: {
    title: string
    url: string
    icon: any
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dokumente</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isExactMatch = pathname === item.url
          const isPrefixMatch = item.url !== "#" && item.url !== "/" && item.url !== "/dashboard" && pathname.startsWith(item.url + "/")
          const isActive = isExactMatch || isPrefixMatch

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
