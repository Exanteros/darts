"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  IconTrophy,
  IconUsers,
  IconChartBar,
  IconDashboard,
  IconSettings,
  IconActivity,
  IconCalendar,
  IconTarget,
  IconHelp,
  IconSearch,
  IconShield,
  IconListDetails,
  IconMail,
} from "@tabler/icons-react"
import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavClouds } from "@/components/nav-clouds"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { TournamentSwitcher } from "@/components/tournament-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface Board {
  id: string;
  name: string;
  accessCode: string;
}

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/admin/tournament/settings');
        if (response.ok) {
          const settings = await response.json();
          setMainLogo(settings.mainLogo || '');
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  if (mainLogo) {
    return (
      <img
        src={mainLogo}
        alt="Turnier Logo"
        className="h-12 w-auto object-contain"
      />
    );
  }

  // Fallback
  return <IconTrophy className="!size-6" />;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const response = await fetch('/api/boards');
        if (response.ok) {
          const boardsData = await response.json();
          setBoards(boardsData);
        }
      } catch (error) {
        console.error('Error loading boards:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUser({
              name: data.user.name || data.user.email,
              email: data.user.email,
              role: data.user.role
            });
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  const data = {
    user: {
      name: currentUser?.name || "FW Puschendorf",
      email: currentUser?.email || "admin@fw-puschendorf.de",
      avatar: "/LogoFW-Pudo2013-.png",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Turnier-Verwaltung",
        url: "/dashboard/tournament",
        icon: IconTrophy,
        iconColor: "text-amber-600",
      },
      {
        title: "Turnierbaum",
        url: "/dashboard/tournament/bracket",
        icon: IconListDetails,
      },
      {
        title: "Live-Überwachung",
        url: "/dashboard/live",
        icon: IconActivity,
      },
      {
        title: "Spieler-Verwaltung",
        url: "/dashboard/players",
        icon: IconUsers,
        iconColor: "text-blue-600",
      },
      {
        title: "Statistiken",
        url: "/dashboard/stats",
        icon: IconChartBar,
      },
      {
        title: "E-Mail Verwaltung",
        url: "/dashboard/mail",
        icon: IconMail,
        iconColor: "text-green-600",
      },
    ],
    navClouds: [
      {
        title: "Scheiben-Verwaltung",
        icon: IconShield,
        isActive: true,
        url: "#",
        items: loading ? [
          {
            title: "Lade Scheiben...",
            url: "#",
          },
        ] : boards.map(board => ({
          title: `${board.name} (Broadcast)`,
          url: `/display/scheibe/${board.accessCode}`,
        })),
      },
      {
        title: "Eingabe-Interfaces",
        icon: IconListDetails,
        url: "#",
        items: loading ? [
          {
            title: "Lade Scheiben...",
            url: "#",
          },
        ] : boards.map(board => ({
          title: `${board.name} Eingabe`,
          url: `/note/scheibe/${board.accessCode}`,
        })),
      },
    ],
    navSecondary: [
      {
        title: "Suche",
        url: "/dashboard/search",
        icon: IconSearch,
      },
      {
        title: "Benutzerverwaltung",
        url: "/dashboard/access",
        icon: IconShield,
      },
      {
        title: "Einstellungen",
        url: "/dashboard/settings",
        icon: IconSettings,
      },
      {
        title: "Hilfe",
        url: "/dashboard/help",
        icon: IconHelp,
      },
    ],
    documents: [],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex justify-center py-2 group-data-[collapsible=icon]:hidden">
          <DynamicLogo />
        </div>
        <TournamentSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavClouds items={data.navClouds} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
