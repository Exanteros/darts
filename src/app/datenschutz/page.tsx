"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Target, ArrowLeft, Shield, Lock, Eye, 
  Server, Globe, FileCheck, Mail 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ================= ANIMATION VARIANTS ================= */

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4 } 
  }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

/* ================= COMPONENTS ================= */

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/public/logo')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setMainLogo(data.mainLogo || ''))
      .catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
        {mainLogo ? (
          <img src={mainLogo} alt="Logo" className="h-5 w-5 object-contain" />
        ) : (
          <Target className="h-4 w-4 text-white" />
        )}
      </div>
      <span className="font-bold tracking-tight text-lg text-slate-900">Darts Masters</span>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </Link>
        <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Startseite
            </Button>
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-16 lg:py-24 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/">
              <DynamicLogo />
            </Link>
            <p className="mt-6 text-slate-500 text-sm leading-relaxed font-medium">
              Darts-Sport auf höchstem Niveau in Puschendorf. Organisiert für Spieler von Spielern.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Event</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/tournament/register" className="hover:text-slate-900 transition-colors">Anmeldung</Link></li>
              <li><Link href="/tournament/participants" className="hover:text-slate-900 transition-colors">Teilnehmerliste</Link></li>
              <li><Link href="/sponsors" className="hover:text-slate-900 transition-colors">Sponsoren</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Kontakt</Link></li>
              <li><Link href="/faq" className="hover:text-slate-900 transition-colors">Häufige Fragen</Link></li>
              <li><Link href="/anfahrt" className="hover:text-slate-900 transition-colors">Anfahrt</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Rechtliches</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/impressum" className="hover:text-slate-900 transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-slate-900 transition-colors">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-slate-900 transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Darts Masters Puschendorf.</p>
          <div className="flex gap-6">
             <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Built for the game.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================= MAIN PAGE ================= */

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[600px] w-[600px] bg-slate-50 opacity-80 blur-[100px]" />
      </div>

      <Header />

      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="space-y-12"
          >
            
            {/* Hero Section */}
            <motion.div variants={fadeIn} className="text-left space-y-4">
              <div className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-8">
                / RECHTLICHES ■ DATENSCHUTZ
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
                Datenschutzerklärung
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed mb-12">
                Transparente Informationen darüber, wie wir deine Daten beim Darts Masters Puschendorf im Rahmen der DSGVO erheben, verarbeiten und schützen.
              </p>
            </motion.div>

            {/* 1. Verantwortlicher */}
            <motion.div variants={fadeIn}>
              <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-md">
                <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-slate-900" />
                  <h2 className="font-semibold text-slate-900 text-lg">1. Verantwortliche Stelle</h2>
                </div>
                <CardContent className="p-6 text-base text-slate-600 leading-relaxed">
                  <p className="mb-4">
                    Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
                  </p>
                  <div className="bg-slate-50 p-6 rounded-md border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">Freie Wähler Puschendorf e.V.</p>
                    <p>Vertreten durch: Dr.-Ing. Stefan Geissdörfer</p>
                    <p>Asternstraße 17, 90617 Puschendorf</p>
                    <p>Deutschland</p>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                      <a href="mailto:support@pudo-dartmasters.de" className="text-slate-900 font-medium hover:underline flex items-center gap-2 transition-colors">
                        <Mail className="h-4 w-4" /> support@pudo-dartmasters.de
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 2. Hosting & Technik */}
            <motion.div variants={fadeIn} className="pt-8">
              <div className="flex items-start gap-5">
                <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                  <Server className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">2. Hosting, Server-Log-Dateien & Technik</h3>
                  <div className="text-base text-slate-600 leading-relaxed space-y-4">
                    <p>
                      <strong>Hoster:</strong> Diese Website wird technisch betreut und gehostet durch die Contimore UG (haftungsbeschränkt), Asternstraße 17, 90617 Puschendorf. 
                      Die vom Hoster erhobenen Daten werden in unserem Auftrag (Auftragsverarbeitung gem. Art. 28 DSGVO) verarbeitet.
                    </p>
                    <p>
                      <strong>Server-Log-Dateien:</strong> Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
                      die Ihr Browser automatisch an uns übermittelt. Dies sind: Browsertyp und Browserversion, verwendetes Betriebssystem, Referrer URL, 
                      Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse. Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
                    </p>
                    <p>
                      Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der 
                      technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. Datenerfassung */}
            <motion.div variants={fadeIn} className="pt-8">
              <div className="flex items-start gap-5">
                <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="space-y-4 w-full">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">3. Erfassung von Teilnehmerdaten</h3>
                  
                  <p className="text-base text-slate-600 leading-relaxed">
                    Wenn Sie sich für das Darts-Turnier registrieren, erheben wir Daten, die für die Durchführung des Turniers und die Erfüllung des Vertrages absolut notwendig sind (Art. 6 Abs. 1 lit. b DSGVO).
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div className="p-6 rounded-md border border-slate-200 bg-white">
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">Turnier-Anmeldung</h4>
                      <ul className="list-disc pl-5 text-base text-slate-600 space-y-2">
                        <li>Vor- und Nachname (für Abgleich und Turnierleitung)</li>
                        <li>E-Mail-Adresse (für Authentifizierung via Magic Link & Organisation)</li>
                        <li>Spielername / Nickname (wird öffentlich im Turnierbaum angezeigt)</li>
                        <li>Zahlungsstatus & Ticketdaten</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed mt-4">
                    Die Spielerstatistiken (z.B. Spielergebnisse, Platzierungen) werden während des Turniers digital erfasst und im Rahmen des Turniers auf Screens sowie unserer Website präsentiert. Mit der Teilnahme stimmen Sie dieser der Natur der Veranstaltung innewohnenden Verarbeitung zu.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 4. Dienste & Cookies */}
            <motion.div variants={fadeIn} className="pt-8">
              <div className="space-y-12">
                <div className="flex items-start gap-5">
                  <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">4. Zahlungsanbieter & Externe Dienste</h3>
                    <div className="text-base text-slate-600 space-y-6">
                      <div>
                        <strong className="text-slate-900 block mb-1">Zahlungsabwicklung via Stripe</strong>
                        Wir bieten die Bezahlung der Teilnahmegebühr via Stripe an. Anbieter dieses Zahlungsdienstes ist die Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland.
                        Wenn Sie die Zahlung via Stripe vornehmen, werden Ihre eingegebenen Zahlungsdaten an Stripe übermittelt. 
                        Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsabwicklung). Details entnehmen Sie der Datenschutzerklärung von Stripe: <a href="https://stripe.com/de/privacy" target="_blank" className="text-slate-900 hover:underline">stripe.com/de/privacy</a>.
                      </div>
                      <div>
                        <strong className="text-slate-900 block mb-1">Transaktions-E-Mails</strong>
                        Wir nutzen spezialisierte Dienstleister (z.B. Resend / Amazon SES), um sichere Authentifizierungs-E-Mails ("Magic Links") und Buchungsbestätigungen zuzustellen. Diese Anbieter verarbeiten Ihre E-Mail-Adresse streng nach unseren Weisungen (AV-Vertrag).
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">5. Cookies & Lokale Speicherung</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Unsere Website verwendet teilweise sogenannte Cookies bzw. nutzt den Local Storage Ihres Browsers. 
                      Diese dienen in erster Linie dazu, nach der Anmeldung Ihre Login-Session zu halten ("technisch notwendige Cookies"). 
                      Dafür wird keine Einwilligung des Nutzers benötigt (Speicherung erfolgt gem. § 25 Abs. 2 TTDSG i.V.m. Art. 6 Abs. 1 lit. f DSGVO).
                      Wir nutzen keine Tracking- oder Marketing-Cookies (wie z.B. Google Analytics oder Facebook Pixel).
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 5. Betroffenenrechte */}
            <motion.div variants={fadeIn} className="pt-8">
              <Card className="bg-slate-950 text-white border-slate-800 rounded-md">
                <CardContent className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 tracking-tight">
                    <Shield className="h-6 w-6 text-white" /> 6. Ihre Rechte als Betroffener
                  </h3>
                  <div className="text-slate-300 text-base mb-8 leading-relaxed space-y-4">
                    <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Widerruf Ihrer Einwilligung:</strong> Eine erteilte Einwilligung (z.B. für Bildaufnahmen) können Sie jederzeit formlos widerrufen.</li>
                      <li><strong>Beschwerderecht bei der Aufsichtsbehörde:</strong> Sie haben ein Beschwerderecht bei der zuständigen Aufsichtsbehörde (z.B. Bayerisches Landesamt für Datenschutzaufsicht).</li>
                      <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="h-12 px-6 rounded-sm border-slate-700 text-white hover:bg-slate-800 hover:text-white bg-transparent" asChild>
                    <a href="mailto:support@pudo-dartmasters.de">Datenschutzanfrage stellen</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <div className="pt-8">
              <Button asChild className="rounded-sm bg-slate-900 text-white hover:bg-slate-800 h-11 px-8">
                <Link href="/">Zurück zur Startseite</Link>
              </Button>
            </div>

          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}