"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconHelp, IconBook, IconMail, IconExternalLink, IconQuestionMark } from "@tabler/icons-react"

export default function HelpPage() {
  const { isAdmin, isLoading, isAuthenticated } = useUserCheck();

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-center h-64">
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hilfe & Support</h1>
                    <p className="text-muted-foreground">
                      Anleitungen und häufig gestellte Fragen
                    </p>
                  </div>
                </div>

                <div className="space-y-6 mt-6">
                  {/* Quick Start Guide */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🚀 Schnellstart-Anleitung</CardTitle>
                      <CardDescription>
                        So richten Sie Ihr Turnier in 5 Schritten ein
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                        <div>
                          <h3 className="font-semibold">Turnier-Einstellungen konfigurieren</h3>
                          <p className="text-sm text-muted-foreground">
                            Gehen Sie zu <code className="px-1 py-0.5 bg-muted rounded">Turnier-Verwaltung</code> und legen Sie Name, Datum, 
                            Spielerzahl und Spielmodus (501/301) fest.
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                        <div>
                          <h3 className="font-semibold">Dartscheiben hinzufügen</h3>
                          <p className="text-sm text-muted-foreground">
                            Erstellen Sie Scheiben mit Namen und Standort. Jede Scheibe erhält einen eindeutigen Access-Code.
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                        <div>
                          <h3 className="font-semibold">Spieler registrieren</h3>
                          <p className="text-sm text-muted-foreground">
                            Spieler können sich selbst über <code className="px-1 py-0.5 bg-muted rounded">/register</code> anmelden oder 
                            Sie fügen sie manuell über die Spieler-Verwaltung hinzu.
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                        <div>
                          <h3 className="font-semibold">Shootout durchführen</h3>
                          <p className="text-sm text-muted-foreground">
                            Status auf <Badge variant="outline">SHOOTOUT</Badge> setzen. Spieler werfen 3 Darts an der Hauptscheibe. 
                            Die Top 32/64 (je nach Einstellung) kommen ins Bracket.
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">5</div>
                        <div>
                          <h3 className="font-semibold">Turnier starten</h3>
                          <p className="text-sm text-muted-foreground">
                            Generieren Sie den Bracket aus den Shootout-Ergebnissen, weisen Sie Spiele den Scheiben zu und 
                            starten Sie das Turnier!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ Sections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Turnier-Verwaltung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Wie erstelle ich ein neues Turnier?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Navigieren Sie zu <strong>Turnier-Verwaltung</strong> im Menü.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><strong>Name:</strong> z.B. "Dart Masters Puschendorf 2025"</li>
                          <li><strong>Beschreibung:</strong> Optionale Details zum Turnier</li>
                          <li><strong>Start-/Enddatum:</strong> Zeitraum des Turniers</li>
                          <li><strong>Max. Spielerzahl:</strong> 16, 32, 64 oder 128</li>
                          <li><strong>Startgeld:</strong> Betrag in Euro (0 für kostenfrei)</li>
                          <li><strong>Spielmodus:</strong> 501 (Standard) oder 301</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was bedeuten die Turnier-Status?</h3>
                        <div className="space-y-2 ml-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">UPCOMING</Badge>
                            <span className="text-sm text-muted-foreground">Turnier angekündigt, Anmeldung noch nicht offen</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">REGISTRATION_OPEN</Badge>
                            <span className="text-sm text-muted-foreground">Spieler können sich anmelden</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">REGISTRATION_CLOSED</Badge>
                            <span className="text-sm text-muted-foreground">Anmeldung beendet, noch kein Shootout</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">SHOOTOUT</Badge>
                            <span className="text-sm text-muted-foreground">Shootout läuft, Spieler werfen ihre 3 Darts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">ACTIVE</Badge>
                            <span className="text-sm text-muted-foreground">Turnier läuft, Spiele werden gespielt</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">FINISHED</Badge>
                            <span className="text-sm text-muted-foreground">Turnier abgeschlossen</span>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie ändere ich Turnier-Einstellungen?</h3>
                        <p className="text-sm text-muted-foreground">
                          Alle Einstellungen können jederzeit über die Turnier-Verwaltung geändert werden. 
                          Änderungen werden sofort gespeichert. <strong>Achtung:</strong> Einige Änderungen 
                          (wie Spielerzahl) sollten nicht während eines laufenden Turniers vorgenommen werden.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Scheiben-Verwaltung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Wie erstelle ich eine neue Dartscheibe?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          In der Turnier-Verwaltung unter "Dartscheiben-Verwaltung":
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Klicken Sie auf "Neue Scheibe hinzufügen"</li>
                          <li>Geben Sie einen Namen ein (z.B. "Scheibe 1")</li>
                          <li>Geben Sie den Standort an (z.B. "Hauptraum links")</li>
                          <li>Die Scheibe erhält automatisch einen 5-stelligen Access-Code</li>
                          <li>Status wird automatisch auf "Aktiv" gesetzt</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was ist eine Hauptscheibe?</h3>
                        <p className="text-sm text-muted-foreground">
                          Die Hauptscheibe (markiert mit ⭐) wird für das Shootout verwendet. 
                          Nur an dieser Scheibe können Spieler ihre 3 Shootout-Würfe abgeben. 
                          Sie können die Hauptscheibe über den "Als Hauptscheibe markieren" Button ändern.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie greife ich auf die Scheiben-Interfaces zu?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Jede Scheibe hat mehrere URLs:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><strong>Eingabe-Interface:</strong> <code className="px-1 py-0.5 bg-muted rounded">/note/scheibe/[CODE]</code> - Für iPad/Tablet zur Wurf-Eingabe</li>
                          <li><strong>Display/Broadcast:</strong> <code className="px-1 py-0.5 bg-muted rounded">/display/scheibe/[CODE]</code> - Für Beamer/TV-Anzeige</li>
                          <li><strong>OBS Integration:</strong> <code className="px-1 py-0.5 bg-muted rounded">/obs</code> - Für Livestreaming</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie funktioniert die Echtzeit-Synchronisation?</h3>
                        <p className="text-sm text-muted-foreground">
                          Alle Scheiben-Displays werden in Echtzeit über WebSocket (Port 3001) aktualisiert. 
                          Wenn Sie einen Wurf auf dem iPad eingeben, erscheint er sofort auf allen verbundenen Displays, 
                          in der Live-Überwachung und im OBS-Overlay.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Spieler-Verwaltung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Wie können sich Spieler registrieren?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Es gibt zwei Wege:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
                          <li>
                            <strong>Selbst-Registrierung:</strong> Spieler besuchen <code className="px-1 py-0.5 bg-muted rounded">/register</code>, 
                            geben ihren Namen und E-Mail ein und registrieren sich. Sie erhalten eine Bestätigungs-E-Mail.
                          </li>
                          <li>
                            <strong>Admin-Registrierung:</strong> Sie fügen Spieler manuell über die Spieler-Verwaltung hinzu.
                          </li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was ist der Unterschied zwischen "registriert" und "bezahlt"?</h3>
                        <p className="text-sm text-muted-foreground">
                          Der Status zeigt den Zahlungsstatus: <Badge variant="outline">Registriert</Badge> = angemeldet aber nicht bezahlt, 
                          <Badge variant="default">Bezahlt</Badge> = Startgeld erhalten. Sie können den Status manuell ändern 
                          oder Stripe für automatische Zahlungsabwicklung nutzen.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie bearbeite ich Spieler-Daten?</h3>
                        <p className="text-sm text-muted-foreground">
                          In der Spieler-Verwaltung können Sie: Namen ändern, E-Mail aktualisieren, 
                          Zahlungsstatus setzen, Spieler löschen oder Spieler für das Turnier sperren.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Können Spieler ihre eigenen Statistiken sehen?</h3>
                        <p className="text-sm text-muted-foreground">
                          Ja! Nach dem Login können Spieler ihre persönlichen Statistiken, gespielte Spiele, 
                          Averages und Rankings einsehen. Admins sehen zusätzlich alle Spieler-Statistiken 
                          im Dashboard.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Shootout-System
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Wie funktioniert das Shootout?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Das Shootout bestimmt die Setzliste für das Turnier:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
                          <li>Setzen Sie den Turnier-Status auf <Badge variant="destructive">SHOOTOUT</Badge></li>
                          <li>Jeder Spieler wirft 3 Darts auf die Hauptscheibe (⭐)</li>
                          <li>Die Scores werden automatisch addiert (Max: 180 Punkte)</li>
                          <li>Spieler werden nach Gesamtscore sortiert</li>
                          <li>Die Top-Spieler (32, 64 je nach Einstellung) kommen ins Bracket</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie gebe ich Shootout-Würfe ein?</h3>
                        <p className="text-sm text-muted-foreground">
                          Öffnen Sie das Eingabe-Interface der Hauptscheibe (<code className="px-1 py-0.5 bg-muted rounded">/note/scheibe/[CODE]</code>). 
                          Wählen Sie den Spieler aus der Liste und geben Sie die 3 Wurf-Werte ein (z.B. 60, 60, 60 für 180). 
                          Das System speichert automatisch.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Kann ich Shootout-Ergebnisse korrigieren?</h3>
                        <p className="text-sm text-muted-foreground">
                          Ja! In der Shootout-Verwaltung können Sie einzelne Wurf-Werte korrigieren oder 
                          Spieler komplett aus dem Shootout entfernen und neu werfen lassen.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was passiert bei gleichen Scores?</h3>
                        <p className="text-sm text-muted-foreground">
                          Bei identischen Scores wird die Reihenfolge nach Registrierungszeit bestimmt. 
                          Alternativ können Sie ein Stechen durchführen (zusätzlicher Wurf).
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Turnierbaum & Spiele
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Wie generiere ich den Turnierbaum?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Nach Abschluss des Shootouts:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Gehen Sie zu "Turnierbaum"</li>
                          <li>Klicken Sie auf "Bracket aus Shootout generieren"</li>
                          <li>Das System erstellt automatisch das K.O.-System mit optimaler Setzung</li>
                          <li>Beste Spieler starten gegeneinander in späteren Runden</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie weise ich Spiele den Scheiben zu?</h3>
                        <p className="text-sm text-muted-foreground">
                          Im Turnierbaum sehen Sie alle Spiele einer Runde. Klicken Sie auf "Scheibe zuweisen" 
                          und wählen Sie eine freie Scheibe aus. Das Spiel erscheint dann automatisch auf dem 
                          Display dieser Scheibe.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie startet ein Spiel?</h3>
                        <p className="text-sm text-muted-foreground">
                          Das Spiel startet automatisch, sobald Sie es einer Scheibe zugewiesen haben. 
                          Die Spieler sehen ihre Namen auf dem Display und können mit der Eingabe beginnen.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was ist ein "Leg"?</h3>
                        <p className="text-sm text-muted-foreground">
                          Ein Leg ist eine einzelne Runde von 501/301 bis 0. Ein Match besteht aus mehreren Legs 
                          (z.B. Best of 3 Legs = wer zuerst 2 Legs gewinnt). Sie können die Anzahl der Legs 
                          pro Spiel in den Einstellungen festlegen.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie gebe ich Würfe ein?</h3>
                        <p className="text-sm text-muted-foreground">
                          Auf dem iPad-Interface geben Sie die geworfenen Punkte ein (z.B. 60, 100, 45). 
                          Das System berechnet automatisch die Rest-Punkte. Bei einem Finish (genau 0 erreicht) 
                          wird das Leg automatisch beendet.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Was ist ein "Bust"?</h3>
                        <p className="text-sm text-muted-foreground">
                          Ein Bust tritt auf wenn: Spieler unter 0 kommt, auf genau 1 landet, oder nicht mit Doppel 
                          auscheckt. Die Punkte bleiben dann unverändert und der nächste Spieler ist dran.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Live-Überwachung & OBS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">Was zeigt die Live-Überwachung?</h3>
                        <p className="text-sm text-muted-foreground">
                          Die Live-Überwachung (<code className="px-1 py-0.5 bg-muted rounded">/dashboard/live</code>) 
                          zeigt alle aktiven Scheiben in Echtzeit: Aktuelles Spiel, Spieler-Namen, Scores, 
                          Leg-Status und letzte Würfe. Perfekt um den Turnier-Überblick zu behalten!
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Wie integriere ich OBS für Livestreaming?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          So richten Sie OBS ein:
                        </p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Öffnen Sie OBS Studio</li>
                          <li>Fügen Sie eine "Browser-Quelle" hinzu</li>
                          <li>URL: <code className="px-1 py-0.5 bg-muted rounded">http://localhost:3000/obs</code></li>
                          <li>Breite: 1920, Höhe: 1080 (Full HD)</li>
                          <li>✅ "Seite neu laden wenn Szene aktiv wird"</li>
                          <li>Das Overlay zeigt automatisch das aktuelle Haupt-Spiel</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Welche Informationen zeigt das OBS-Overlay?</h3>
                        <p className="text-sm text-muted-foreground">
                          Das Overlay zeigt: Spieler-Namen, Aktuelle Scores, Legs gewonnen, Letzte 6 Würfe, 
                          3-Dart-Average, Checkout-Prozentsätze und animierte Wurf-Updates in Echtzeit.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconBook className="h-4 w-4" />
                        Technische Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">URLs & Zugangspunkte</h3>
                        <div className="space-y-2 ml-4">
                          <div className="flex flex-col gap-1">
                            <code className="text-xs px-2 py-1 bg-muted rounded">/dashboard</code>
                            <span className="text-xs text-muted-foreground">Admin-Dashboard (Login erforderlich)</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <code className="text-xs px-2 py-1 bg-muted rounded">/register</code>
                            <span className="text-xs text-muted-foreground">Öffentliche Spieler-Registrierung</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <code className="text-xs px-2 py-1 bg-muted rounded">/note/scheibe/[CODE]</code>
                            <span className="text-xs text-muted-foreground">iPad Eingabe-Interface für Wurf-Erfassung</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <code className="text-xs px-2 py-1 bg-muted rounded">/display/scheibe/[CODE]</code>
                            <span className="text-xs text-muted-foreground">TV/Beamer Display für Zuschauer</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <code className="text-xs px-2 py-1 bg-muted rounded">/obs</code>
                            <span className="text-xs text-muted-foreground">OBS Browser Source für Livestreaming</span>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Echtzeit-System</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Das System nutzt WebSocket (Port 3001) für Echtzeit-Updates:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Wurf-Updates erscheinen sofort auf allen Displays</li>
                          <li>Automatische Reconnection bei Verbindungsabbruch</li>
                          <li>Broadcast an alle verbundenen Clients gleichzeitig</li>
                          <li>Keine manuelle Aktualisierung nötig</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">Datenbank & Backup</h3>
                        <p className="text-sm text-muted-foreground">
                          Alle Daten werden in einer SQLite-Datenbank gespeichert. 
                          Die Datei <code className="px-1 py-0.5 bg-muted rounded">prisma/dev.db</code> enthält 
                          alle Turnier-Daten, Spieler, Spiele und Würfe. Regelmäßige Backups werden empfohlen!
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">API-Endpunkte</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Das System bietet REST APIs für erweiterte Integrationen:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><code className="px-1 py-0.5 bg-muted rounded">/api/dashboard/stats</code> - Statistiken abrufen</li>
                          <li><code className="px-1 py-0.5 bg-muted rounded">/api/tournament/bracket</code> - Turnierbaum laden</li>
                          <li><code className="px-1 py-0.5 bg-muted rounded">/api/obs/live</code> - Live-Daten für OBS</li>
                          <li><code className="px-1 py-0.5 bg-muted rounded">/api/board</code> - Scheiben-Status</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Troubleshooting */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconQuestionMark className="h-4 w-4" />
                        Problemlösungen & Troubleshooting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">Display zeigt keine Updates</h3>
                        <p className="text-sm text-muted-foreground mb-2">Lösungen:</p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Prüfen Sie ob der WebSocket-Server läuft (Port 3001)</li>
                          <li>Laden Sie die Seite neu (F5)</li>
                          <li>Prüfen Sie die Browser-Konsole auf Fehler (F12)</li>
                          <li>Stellen Sie sicher dass Firewall Port 3001 nicht blockiert</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">Spieler kann sich nicht registrieren</h3>
                        <p className="text-sm text-muted-foreground mb-2">Mögliche Ursachen:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Turnier-Status ist nicht auf "REGISTRATION_OPEN"</li>
                          <li>Maximale Spielerzahl bereits erreicht</li>
                          <li>E-Mail bereits registriert (doppelte Anmeldung)</li>
                          <li>E-Mail-Server nicht konfiguriert (Magic Link kommt nicht an)</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">Spiel lässt sich nicht starten</h3>
                        <p className="text-sm text-muted-foreground mb-2">Prüfen Sie:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Ist die Scheibe als "Aktiv" markiert?</li>
                          <li>Hat die Scheibe bereits ein laufendes Spiel?</li>
                          <li>Sind beide Spieler vorhanden?</li>
                          <li>Ist der Turnier-Status korrekt (ACTIVE)?</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">Wurf wurde falsch eingegeben</h3>
                        <p className="text-sm text-muted-foreground">
                          Verwenden Sie die "Undo" Funktion im Eingabe-Interface oder kontaktieren Sie 
                          einen Admin zum manuellen Korrigieren in der Datenbank.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">OBS zeigt schwarzen Screen</h3>
                        <p className="text-sm text-muted-foreground mb-2">Lösungen:</p>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Aktivieren Sie "Hardware-Beschleunigung deaktivieren" in OBS Browser-Quelle</li>
                          <li>Erhöhen Sie die "Seiten-Ladezeit" auf 5 Sekunden</li>
                          <li>Aktivieren Sie "Seite neu laden wenn Szene aktiv wird"</li>
                          <li>Prüfen Sie ob der Server läuft (http://localhost:3000/obs im Browser testen)</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1 text-destructive">Datenbank ist korrupt</h3>
                        <p className="text-sm text-muted-foreground">
                          Stellen Sie ein Backup wieder her oder führen Sie <code className="px-1 py-0.5 bg-muted rounded">npx prisma db push</code> aus 
                          um die Datenbank neu zu initialisieren. <strong>Achtung:</strong> Dabei gehen alle Daten verloren!
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best Practices */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconBook className="h-4 w-4" />
                        Best Practices & Tipps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">📱 Hardware-Empfehlungen</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li><strong>Eingabe:</strong> iPad oder Android Tablet (min. 10 Zoll)</li>
                          <li><strong>Display:</strong> TV/Beamer mit HDMI, Raspberry Pi als Client</li>
                          <li><strong>Server:</strong> Laptop/PC mit min. 4GB RAM für bis zu 8 Scheiben</li>
                          <li><strong>Netzwerk:</strong> Stabiles WLAN oder Ethernet-Kabel</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">⚙️ Setup-Reihenfolge</h3>
                        <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                          <li>Turnier-Grunddaten eingeben (Name, Datum, Spielerzahl)</li>
                          <li>Scheiben anlegen und Haupt-Scheibe markieren</li>
                          <li>Displays/iPads mit URLs verbinden und testen</li>
                          <li>Registrierung öffnen und Spieler anmelden lassen</li>
                          <li>Shootout durchführen wenn alle da sind</li>
                          <li>Bracket generieren und Turnier starten</li>
                        </ol>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">💾 Backup-Strategie</h3>
                        <p className="text-sm text-muted-foreground">
                          Erstellen Sie <strong>vor dem Turnier</strong> und <strong>nach jeder Runde</strong> ein Backup der 
                          <code className="px-1 py-0.5 bg-muted rounded">prisma/dev.db</code> Datei. Bei Problemen können Sie 
                          so auf den letzten Stand zurückkehren.
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">🎥 Streaming-Tipps</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>Testen Sie das OBS-Setup <strong>vor</strong> dem Turnier</li>
                          <li>Verwenden Sie eine dedizierte Szene pro Scheibe</li>
                          <li>Aktivieren Sie "Browser-Cache" für bessere Performance</li>
                          <li>Setzen Sie die Bildrate auf 30 FPS für Dart-Overlays</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-1">📧 E-Mail Kommunikation</h3>
                        <p className="text-sm text-muted-foreground">
                          Nutzen Sie die Mail-Verwaltung um: Willkommens-E-Mails zu senden, 
                          Rundenzeiten bekannt zu geben, Ergebnisse zu verschicken, 
                          Spielpaarungen anzukündigen. Templates können gespeichert und wiederverwendet werden.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact & Version */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconMail className="h-4 w-4" />
                          Kontakt & Support
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Entwickler</p>
                          <p className="text-sm text-muted-foreground">
                            FW Puschendorf Darts System
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">E-Mail Support</p>
                          <a href="mailto:support@pudo-dartmasters.de" className="text-sm text-muted-foreground hover:underline">
                            support@pudo-dartmasters.de
                          </a>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">Technischer Support</p>
                          <p className="text-sm text-muted-foreground">
                            Verfügbar während Turnier-Events
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconBook className="h-4 w-4" />
                          System-Informationen
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Version</p>
                          <Badge variant="outline">v2.0.0</Badge>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">Technologie-Stack</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary">Next.js 15</Badge>
                            <Badge variant="secondary">Prisma</Badge>
                            <Badge variant="secondary">SQLite</Badge>
                            <Badge variant="secondary">WebSocket</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">Features</p>
                          <p className="text-xs text-muted-foreground">
                            ✅ Echtzeit-Updates • ✅ Multi-Board Support • ✅ OBS Integration • 
                            ✅ E-Mail System • ✅ Statistiken • ✅ Mobile-Optimiert
                          </p>
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
