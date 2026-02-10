"use client"

import Link from "next/link"
import { 
  Palette, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy,
  Smartphone,
  Monitor
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Mock Data for Themes
const themes = [
  {
    id: "default-theme",
    name: "Standard Turnier",
    description: "Das klassische Layout für Darts Turniere. Übersichtlich und funktional.",
    lastModified: "Vor 2 Tagen",
    status: "active",
    colors: ["#2563eb", "#ffffff", "#000000"]
  },
  {
    id: "dark-neon",
    name: "Dark Neon",
    description: "Ein dunkles Theme mit hohen Kontrasten, perfekt für Beamer und Screens.",
    lastModified: "Vor 5 Std.",
    status: "draft",
    colors: ["#111111", "#10b981", "#ffffff"]
  },
  {
    id: "summer-cup",
    name: "Sommer Pokal 2025",
    description: "Helles, freundliches Design für Sommer-Events.",
    lastModified: "Vor 1 Woche",
    status: "draft",
    colors: ["#f59e0b", "#fff7ed", "#1e293b"]
  }
]

export default function ThemeSelectionPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="container mx-auto py-10 space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Theme Gestaltung</h1>
                <p className="text-muted-foreground mt-2">
                  Wähle ein Design für deine Turnier-Seite oder erstelle ein neues.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Neues Theme erstellen
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {themes.map((theme) => (
                <Card key={theme.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all">
                  {/* Preview Area Mockup */}
                  <div className="h-40 bg-muted/30 relative flex items-center justify-center border-b">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                        <Palette className="w-20 h-20" />
                    </div>
                    
                    {/* Color Swatches */}
                    <div className="flex gap-2 z-10 p-4 bg-background/80 backdrop-blur-sm rounded-full shadow-sm">
                      {theme.colors.map(c => (
                        <div key={c} className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>

                      {theme.status === "active" && (
                        <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                          Aktiv
                        </Badge>
                      )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{theme.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {theme.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplizieren
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> Desktop
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> Mobile
                      </span>
                      <span className="ml-auto">
                        Geändert: {theme.lastModified}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/10 p-4">
                    <Button asChild className="w-full gap-2" variant={theme.status === 'active' ? 'default' : 'secondary'}>
                      <Link href={`/dashboard/${theme.id}/editor`}>
                        <Edit className="h-4 w-4" />
                        Editor öffnen
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Create New Card */}
              <Button variant="outline" className="h-full min-h-[300px] flex flex-col gap-4 border-dashed border-2 hover:border-primary hover:bg-muted/10">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">Neues Theme</div>
                  <div className="text-sm text-muted-foreground">Starte mit einer leeren Vorlage</div>
                </div>
              </Button>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
