"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import DynamicLogo from "@/components/DynamicLogo";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  showBackButton?: boolean;
  title?: string;
  description?: string;
}

export function PageHeader({ showBackButton = false, title, description }: PageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigationLinks = [
    { href: "/", label: "Startseite" },
    { href: "/rules", label: "Regeln" },
    { href: "/faq", label: "FAQ" },
    { href: "/tournament/champions", label: "Champions" },
    { href: "/anfahrt", label: "Anfahrt" },
    { href: "/contact", label: "Kontakt" },
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
    { href: "/agb", label: "AGB" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <DynamicLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className={cn(
              "text-slate-600 hover:text-slate-900",
              isActive("/") && "text-slate-900 font-semibold"
            )}>
              <Link href="/">Startseite</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(
              "text-slate-600 hover:text-slate-900",
              isActive("/rules") && "text-slate-900 font-semibold"
            )}>
              <Link href="/rules">Regeln</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(
              "text-slate-600 hover:text-slate-900",
              isActive("/tournament/champions") && "text-slate-900 font-semibold"
            )}>
              <Link href="/tournament/champions">Champions</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className={cn(
              "text-slate-600 hover:text-slate-900",
              isActive("/contact") && "text-slate-900 font-semibold"
            )}>
              <Link href="/contact">Kontakt</Link>
            </Button>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/tournament/register">Registrieren</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-900">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive(link.href)
                          ? "text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-slate-200 pt-4 mt-2 flex flex-col gap-2">
                    <Button className="w-full" asChild>
                      <Link href="/tournament/register" onClick={() => setIsOpen(false)}>
                        Registrieren
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Login
                      </Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Optional: Title and Description Section */}
      {(title || description) && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            {title && <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>}
            {description && <p className="text-lg text-slate-600">{description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
