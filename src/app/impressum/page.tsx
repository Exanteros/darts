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
    <footer className="border-t border-slate-100 bg-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 bg-black rounded-md flex items-center justify-center">
                <Target className="h-3 w-3 text-white" />
              </div>
              <span className="font-bold">Darts Masters</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Puschendorf 2025. <br/>
              High-End Darts Entertainment.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Turnier</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/tournament/register" className="hover:text-slate-900 transition-colors">Anmeldung</Link></li>
              <li><Link href="/user" className="hover:text-slate-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Rechtliches</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/impressum" className="hover:text-slate-900 transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-slate-900 transition-colors">Datenschutz</Link></li>
            </ul>
          </div>
        </div>
        
        <Separator className="bg-slate-100 mb-8" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Darts Masters Puschendorf.</p>
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

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          className="space-y-12"
        >
          
          {/* Hero Section */}
          <motion.div variants={fadeIn} className="text-center space-y-4">
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 mb-2">
              <Scale className="h-3 w-3 mr-1.5" /> Rechtliche Hinweise
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Impressum
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">
              Angaben gemäß § 5 TMG und Kontaktinformationen für das Darts Masters Turnier.
            </p>
          </motion.div>

          <Separator className="bg-slate-100" />

          {/* Contact Information Grid */}
          <motion.div variants={fadeIn} className="grid md:grid-cols-2 gap-6">
            
            {/* Operator Card */}
            <Card className="border-slate-200 shadow-sm bg-slate-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">Betreiber</h3>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">Freie Wähler Puschendorf e.V.</p>
                  <p>Asternstrasse 17</p>
                  <p>90617 Puschendorf</p>
                  <p>Deutschland</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Vertreten durch</p>
                  <p className="text-sm text-slate-700">Dr.-Ing. Stefan Geissdörfer</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">Kontakt</h3>
                </div>
                <div className="space-y-4">
                  <a href="mailto:geissdoerfer@fw-puschendorf.de" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">E-Mail schreiben</p>
                      <p className="text-slate-500 text-xs">geissdoerfer@fw-puschendorf.de</p>
                    </div>
                  </a>
                  
                  <a href="tel:091019059567" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">Anrufen</p>
                      <p className="text-slate-500 text-xs">09101 / 9059567</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Legal Texts Section */}
          <motion.div variants={fadeIn} className="space-y-8">
            
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-slate-400" /> Haftung & Recht
              </h3>
              
              <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2">Haftung für Inhalte</h4>
                  <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2">Urheberrecht</h4>
                  <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="border-t border-slate-200 pt-8">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Streitbeilegung</h4>
                  <p className="text-sm text-slate-500 max-w-md">
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit. 
                    Wir sind nicht verpflichtet, an Streitbeilegungsverfahren teilzunehmen.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
                    Zur OS-Plattform <Globe className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Tech Partner (Subtle) */}
            <div className="flex items-center justify-center pt-8 opacity-60 hover:opacity-100 transition-opacity">
               <div className="text-xs text-center">
                  <span className="text-slate-400 block mb-1">Technische Realisierung</span>
                  <span className="font-semibold text-slate-600">Contimore UG (haftungsbeschränkt)</span>
               </div>
            </div>

          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}