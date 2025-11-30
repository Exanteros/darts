"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Target, BookOpen, ArrowLeft, Gavel, Users, Trophy, Clock } from "lucide-react";
import Link from "next/link";

/* ======================== LOGO COMPONENT ======================== */

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/public/logo');
        if (response.ok) {
          const data = await response.json();
          setMainLogo(data.mainLogo || '');
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, []);

  if (loading || !mainLogo) {
    return (
      <div className="flex items-center gap-2">
        <Target className="h-8 w-8 text-primary" />
        <span className="font-bold text-xl">Darts Masters</span>
      </div>
    );
  }

  return (
    <img
      src={mainLogo}
      alt="Turnier Logo"
      className="h-12 w-auto object-contain"
    />
  );
}

/* ======================== HEADER ======================== */

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/user-dashboard">Dashboard</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Anmelden</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/tournament/register">Jetzt anmelden</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ======================== FOOTER ======================== */

function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <DynamicLogo />
            </div>
            <p className="text-sm text-muted-foreground">
              Professionelles Darts-Turnier<br />
              Puschendorf 2025
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Turnier</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tournament/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Anmeldung
                </Link>
              </li>
              <li>
                <Link href="/user-dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Anmelden
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Rechtliches</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/datenschutz" className="text-muted-foreground hover:text-foreground transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-muted-foreground hover:text-foreground transition-colors">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Darts Masters Puschendorf. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-4">
            <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ======================== MAIN PAGE ======================== */

export default function RulesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header Section */}
          <div className="mb-8 space-y-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Startseite
              </Button>
            </Link>
            
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              Regelwerk
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Turnierregeln
            </h1>
            <p className="text-xl text-muted-foreground">
              Offizielles Regelwerk für das Darts Masters Puschendorf 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            
            {/* 1. Spielmodus */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  1. Spielmodus
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-slate max-w-none space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">1.1 Grundlegendes</h3>
                  <p>
                    Gespielt wird nach den offiziellen Regeln des Dartsports (PDC-orientiert), jedoch angepasst an den Hobby-Bereich.
                    Die Entfernung zum Board beträgt 2,37m, die Höhe des Bullseyes 1,73m.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-base font-semibold mb-2">1.2 Spielvarianten</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    <li><strong>Gruppenphase / Vorrunde:</strong> 501 Single Out. Das bedeutet, das Leg kann mit jedem beliebigen Feld beendet werden.</li>
                    <li><strong>K.O.-Runde (ab Halbfinale):</strong> 501 Double Out. Das Leg muss mit einem Doppelfeld oder dem Bullseye beendet werden.</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-base font-semibold mb-2">1.3 Distanz</h3>
                  <p>
                    Jedes Match wird im Modus "Best of 3 Legs" (First to 2) gespielt. Im Finale kann die Distanz auf "Best of 5" erhöht werden.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Turnierablauf */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  2. Turnierablauf
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-slate max-w-none space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-2">2.1 Shootout-Phase</h3>
                  <p>
                    Zu Beginn wirft jeder Teilnehmer 3 Darts auf den Highscore. Das Ergebnis bestimmt die Setzliste für den Turnierbaum.
                    Bei Punktgleichheit entscheidet der frühere Wurfzeitpunkt.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-base font-semibold mb-2">2.2 K.O.-System</h3>
                  <p>
                    Das Turnier wird im Single-Elimination-Modus gespielt. Wer verliert, scheidet aus.
                    Es gibt keine Trostrunde.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Verhaltensregeln */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  3. Etikette & Verhalten
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-slate max-w-none space-y-4">
                <p>
                  Fairplay steht an erster Stelle. Wir erwarten von allen Teilnehmern einen respektvollen Umgang miteinander.
                </p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Während des Wurfs des Gegners ist Ruhe zu bewahren.</li>
                  <li>Keine unsportlichen Gesten oder Ausrufe.</li>
                  <li>Alkoholgenuss ist erlaubt, solange die Spielfähigkeit und das Verhalten nicht beeinträchtigt werden.</li>
                  <li>Den Anweisungen der Turnierleitung ist jederzeit Folge zu leisten.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Schreiben / Caller */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  4. Schreiben & Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-slate max-w-none">
                <p>
                  Um einen reibungslosen Ablauf zu gewährleisten, gilt folgende Regelung:
                </p>
                <div className="bg-muted/30 p-4 rounded-md border mt-2">
                  <p className="font-medium">
                    Der Verlierer eines Spiels ist verpflichtet, das nächste Spiel am selben Board als Schreiber (Caller) zu begleiten.
                  </p>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Das Scoring erfolgt über die bereitgestellten Tablets. Eine kurze Einweisung erfolgt vor Turnierbeginn.
                </p>
              </CardContent>
            </Card>

            {/* 5. Zeitplan */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  5. Zeitplan & Anwesenheit
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-slate max-w-none">
                <p>
                  Spieler müssen sich spätestens 15 Minuten vor ihrem aufgerufenen Spiel am Board einfinden.
                  Bei Nichterscheinen nach 5 Minuten Aufrufzeit wird das Spiel als verloren gewertet (Walkover).
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <Link href="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
