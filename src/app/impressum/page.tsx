"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Target, ArrowLeft, Mail, Phone, MapPin, 
  Scale, ShieldCheck, Globe, Building2, FileText 
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
      <span className="font-bold tracking-tight text-lg text-slate-900">Dart Masters</span>
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
          <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Dart Masters Puschendorf.</p>
          <div className="flex gap-6">
             <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Built for the game.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================= MAIN PAGE ================= */

export default function ImpressumPage() {
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
                / RECHTLICHES ■ IMPRESSUM
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
                Impressum
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed mb-12">
                Angaben gemäß § 5 TMG und Kontaktinformationen für das Dart Masters Turnier.
              </p>
            </motion.div>

            {/* Contact Information Grid */}
            <motion.div variants={fadeIn} className="grid md:grid-cols-2 gap-6">
              
              {/* Operator Card */}
              <Card className="border-slate-200 shadow-sm bg-slate-50/50 rounded-md">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="h-6 w-6 text-slate-900" />
                    <h3 className="font-bold text-slate-900 text-lg">Betreiber</h3>
                  </div>
                  <div className="space-y-2 text-base text-slate-600">
                    <p className="font-bold text-slate-900">Freie Wähler Puschendorf e.V.</p>
                    <p>Asternstraße 17</p>
                    <p>90617 Puschendorf</p>
                    <p>Deutschland</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-200/60">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-2">Vertreten durch</p>
                    <p className="text-base text-slate-900 font-medium">Dr.-Ing. Stefan Geissdörfer</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card className="border-slate-200 shadow-sm bg-white rounded-md">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="h-6 w-6 text-slate-900" />
                    <h3 className="font-bold text-slate-900 text-lg">Kontakt</h3>
                  </div>
                  <div className="space-y-4">
                    <a href="mailto:support@pudo-dartmasters.de" className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center text-slate-900 border border-slate-200 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-slate-900 text-sm mb-0.5">E-Mail schreiben</p>
                        <p className="text-slate-500 text-sm truncate">support@pudo-dartmasters.de</p>
                      </div>
                    </a>
                    
                    <a href="tel:091019059567" className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center text-slate-900 border border-slate-200 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm mb-0.5">Anrufen</p>
                        <p className="text-slate-500 text-sm">09101 / 9059567</p>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Register Info */}
            <motion.div variants={fadeIn} className="pt-8">
               <div className="flex items-start gap-5">
                <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Registereintrag</h3>
                  <p className="text-base text-slate-600 leading-relaxed">
                    Eintragung im Vereinsregister.<br/>
                    Registergericht: Amtsgericht Fürth<br/>
                    Registernummer: VR 200583
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Legal Texts Section */}
            <motion.div variants={fadeIn} className="pt-8 space-y-12">
              
              <div className="flex items-start gap-5">
                <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-6 w-full">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Haftung & Recht</h3>
                  
                  <div className="grid gap-6">
                    <div className="p-6 rounded-md bg-white border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">Haftung für Inhalte</h4>
                      <p className="text-base text-slate-600 leading-relaxed">
                        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                      </p>
                    </div>

                    <div className="p-6 rounded-md bg-white border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">Urheberrecht</h4>
                      <p className="text-base text-slate-600 leading-relaxed">
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispute Resolution */}
              <div className="flex items-start gap-5">
                <div className="mt-1 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 border border-slate-200">
                  <Scale className="h-5 w-5" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Streitschlichtung</h3>
                  <p className="text-base text-slate-600 leading-relaxed">
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" className="text-slate-900 hover:underline" target="_blank" rel="noreferrer">https://ec.europa.eu/consumers/odr</a>.<br/>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <Button asChild className="rounded-sm bg-slate-900 text-white hover:bg-slate-800 h-11 px-8">
                  <Link href="/">Zurück zur Startseite</Link>
                </Button>
              </div>

              {/* Tech Partner */}
              <div className="pt-12 mt-12 border-t border-slate-200">
                <p className="text-sm text-slate-500 font-mono tracking-widest uppercase mb-2">Technische Realisierung</p>
                <p className="text-base font-semibold text-slate-900">Contimore UG (haftungsbeschränkt)</p>
              </div>

            </motion.div>

          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}