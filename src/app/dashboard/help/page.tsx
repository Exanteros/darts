"use client";

import { useUserCheck } from "@/hooks/useUserCheck";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconBook, IconMail, IconQuestionMark } from "@tabler/icons-react";

type QuickStep = {
  title: string;
  description: string;
};

type HelpQuestion = {
  question: string;
  answer: string;
  bullets?: string[];
};

type HelpSection = {
  title: string;
  questions: HelpQuestion[];
};

type TroubleshootingItem = {
  title: string;
  checks: string[];
};

const QUICK_START_STEPS: QuickStep[] = [
  {
    title: "Turnier einrichten",
    description:
      "Name, Datum, Spielerzahl und Spielmodus in der Turnier-Verwaltung festlegen.",
  },
  {
    title: "Scheiben konfigurieren",
    description:
      "Scheiben mit Standort anlegen und eine Hauptscheibe für das Shootout bestimmen.",
  },
  {
    title: "Spieler registrieren",
    description:
      "Spieler über /register anmelden lassen oder manuell in der Spieler-Verwaltung hinzufügen.",
  },
  {
    title: "Shootout durchführen",
    description:
      "Turnier-Status auf SHOOTOUT setzen, Punkte erfassen und Setzliste erstellen.",
  },
  {
    title: "Bracket starten",
    description:
      "Bracket generieren, Spiele Scheiben zuweisen und den Turnierbetrieb live starten.",
  },
];

const HELP_SECTIONS: HelpSection[] = [
  {
    title: "Turnier-Verwaltung",
    questions: [
      {
        question: "Welche Status nutze ich wann?",
        answer: "Der Status steuert den Ablauf von Anmeldung bis Turnierende.",
        bullets: [
          "UPCOMING: Vorbereitung",
          "REGISTRATION_OPEN: Anmeldung offen",
          "SHOOTOUT: Qualifikation läuft",
          "ACTIVE: Bracket-Spiele laufen",
          "FINISHED: Turnier abgeschlossen",
        ],
      },
      {
        question: "Kann ich Einstellungen während des Turniers ändern?",
        answer:
          "Ja, technische Felder sind flexibel. Strukturänderungen wie Spielerzahl sollten nur vor Start erfolgen.",
      },
      {
        question: "Wie starte ich schnell ein neues Event?",
        answer:
          "Altes Turnier abschließen, neues Turnier anlegen, Scheiben prüfen und dann Registrierung öffnen.",
      },
    ],
  },
  {
    title: "Scheiben & Live-Betrieb",
    questions: [
      {
        question: "Welche URLs braucht mein Setup?",
        answer: "Die wichtigsten Einstiegspunkte für Betrieb und Anzeige:",
        bullets: [
          "/note/scheibe/[CODE] für Tablet-Eingabe",
          "/display/scheibe/[CODE] für TV/Beamer",
          "/dashboard/live für Gesamtüberblick",
          "/obs für Streaming-Overlay",
        ],
      },
      {
        question: "Wie funktioniert Echtzeit-Sync?",
        answer:
          "Eingaben werden per WebSocket direkt an alle verbundenen Displays und Live-Ansichten verteilt.",
      },
      {
        question: "Was tun bei Verbindungsabbrüchen?",
        answer:
          "Seite neu laden, Netzwerk prüfen und sicherstellen, dass der WebSocket-Server erreichbar ist.",
      },
    ],
  },
  {
    title: "Spieler & Shootout",
    questions: [
      {
        question: "Was ist der Unterschied zwischen registriert und bezahlt?",
        answer:
          "Registriert bedeutet angemeldet, bezahlt bedeutet Startgeld bestätigt und spielbereit.",
      },
      {
        question: "Wie läuft das Shootout korrekt ab?",
        answer: "Jeder Spieler wirft drei Darts auf der Hauptscheibe, danach erfolgt die Setzliste.",
      },
      {
        question: "Kann ich falsch erfasste Würfe korrigieren?",
        answer:
          "Ja, über die Turnier- bzw. Shootout-Ansicht lassen sich Einträge nachträglich anpassen.",
      },
    ],
  },
];

const TROUBLESHOOTING: TroubleshootingItem[] = [
  {
    title: "Display aktualisiert nicht",
    checks: [
      "WebSocket-Server läuft (Port 3001)",
      "Browser-Reload durchführen",
      "Netzwerk/Firewall prüfen",
      "Browser-Konsole auf Fehler kontrollieren",
    ],
  },
  {
    title: "Spieler kann sich nicht anmelden",
    checks: [
      "Status ist REGISTRATION_OPEN",
      "Maximale Spielerzahl nicht erreicht",
      "E-Mail nicht bereits verwendet",
      "Mail-Versand korrekt konfiguriert",
    ],
  },
  {
    title: "OBS zeigt kein Bild",
    checks: [
      "OBS Browser-Quelle auf /obs gesetzt",
      "Seite bei Szenenwechsel neu laden",
      "Hardware-Beschleunigung testweise deaktivieren",
      "URL im Browser lokal testen",
    ],
  },
];

export default function HelpPage() {
  const { isLoading, isAuthenticated } = useUserCheck();

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Wird geladen...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hilfe & Support</h1>
                    <p className="text-muted-foreground">Schnelle Antworten für Turnierbetrieb und Live-Setup</p>
                  </div>
                  <Badge variant="secondary">Dokumentation</Badge>
                </div>

                <div className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schnellstart in 5 Schritten</CardTitle>
                      <CardDescription>Direkter Ablauf für ein stabiles Turnier-Setup</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {QUICK_START_STEPS.map((step, index) => (
                        <div key={step.title}>
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold">{step.title}</h3>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          {index < QUICK_START_STEPS.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {HELP_SECTIONS.map((section) => (
                    <Card key={section.title}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconQuestionMark className="h-4 w-4" />
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.questions.map((item, index) => (
                          <div key={item.question}>
                            <h3 className="mb-1 font-semibold">{item.question}</h3>
                            <p className="text-sm text-muted-foreground">{item.answer}</p>
                            {item.bullets && (
                              <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-muted-foreground">
                                {item.bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                            {index < section.questions.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Troubleshooting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {TROUBLESHOOTING.map((item, index) => (
                        <div key={item.title}>
                          <h3 className="mb-1 font-semibold text-destructive">{item.title}</h3>
                          <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                            {item.checks.map((check) => (
                              <li key={check}>{check}</li>
                            ))}
                          </ul>
                          {index < TROUBLESHOOTING.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconMail className="h-4 w-4" />
                          Kontakt
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="mb-1 text-sm font-medium">Support</p>
                          <a href="mailto:support@pudo-dartmasters.de" className="text-sm text-muted-foreground hover:underline">
                            support@pudo-dartmasters.de
                          </a>
                        </div>
                        <Separator />
                        <div>
                          <p className="mb-1 text-sm font-medium">Hinweis</p>
                          <p className="text-sm text-muted-foreground">
                            Für Live-Events empfiehlt sich ein kurzer Technik-Check vor Turnierstart.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconBook className="h-4 w-4" />
                          System-Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="mb-1 text-sm font-medium">Version</p>
                          <Badge variant="outline">v2</Badge>
                        </div>
                        <Separator />
                        <div>
                          <p className="mb-1 text-sm font-medium">Stack</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary">Next.js</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">Prisma</Badge>
                            <Badge variant="secondary">WebSocket</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
