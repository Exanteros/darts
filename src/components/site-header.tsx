import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LayoutDashboard } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-gradient-to-r from-background to-muted/20 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-muted px-2 py-1">
            <LayoutDashboard className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className="text-sm font-medium">Admin</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="icon" className="hidden sm:flex h-9 w-9">
            <a
              href="#"
              title="Quack! 🦆"
              className="dark:text-foreground text-2xl flex items-center justify-center"
            >
              🦆
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
