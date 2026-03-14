"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: any
    isActive?: boolean
    items?: {
      title: string
      url: string
      exact?: boolean
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Hauptmenü</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Exactly match the URL or check if it's a prefix ONLY IF it's not the base /dashboard route
          const isExactMatch = pathname === item.url
          const isPrefixMatch = item.url !== "/dashboard" && item.url !== "/" && pathname.startsWith(item.url + "/")
          const isActive = isExactMatch || isPrefixMatch
          
          // Check if any child is actively selected, to avoid double-highlighting parent
          const hasActiveChild = item.items?.some(subItem => {
             const isSubExactMatch = pathname === subItem.url
             const isSubPrefixMatch = !subItem.exact && subItem.url !== "/dashboard" && subItem.url !== "/" && pathname.startsWith(subItem.url + "/")
             return isSubExactMatch || isSubPrefixMatch
          })

          // Only show parent as active if it matches AND no child is claiming the active state
          // If it has children, we prioritize the children's active state
          const isButtonActive = item.items?.length ? (isExactMatch && !hasActiveChild) : isActive

          return (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive || isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isButtonActive}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubExactMatch = pathname === subItem.url
                          const isSubPrefixMatch = !subItem.exact && subItem.url !== "/dashboard" && subItem.url !== "/" && pathname.startsWith(subItem.url + "/")
                          const isSubActive = isSubExactMatch || isSubPrefixMatch
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
