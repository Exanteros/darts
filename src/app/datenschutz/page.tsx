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

export default function DatenschutzPage() {
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
              <Shield className="h-3 w-3 mr-1.5" /> DSGVO Konformität
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Datenschutzerklärung
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">
              Transparente Informationen darüber, wie wir deine Daten beim Darts Masters Puschendorf verarbeiten und schützen.
            </p>
          </motion.div>

          <Separator className="bg-slate-100" />

          {/* 1. Verantwortlicher */}
          <motion.div variants={fadeIn}>
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 p-4 px-6 flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">1. Verantwortlicher</h2>
              </div>
              <CardContent className="p-6 text-sm text-slate-600 leading-relaxed">
                <p className="mb-4">
                  Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900 mb-1">Freie Wähler Puschendorf e.V.</p>
                  <p>Vertreten durch: Dr.-Ing. Stefan Geissdörfer</p>
                  <p>Asternstrasse 17, 90617 Puschendorf</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
                    <a href="mailto:geissdoerfer@fw-puschendorf.de" className="text-blue-600 hover:underline flex items-center gap-2">
                      <Mail className="h-3 w-3" /> geissdoerfer@fw-puschendorf.de
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. Hosting & Technik */}
          <motion.div variants={fadeIn}>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Server className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Hosting & Technik</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Diese Website wird technisch betreut und gehostet durch die <strong>Contimore UG (haftungsbeschränkt)</strong>. 
                  Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. 
                  Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
                  Namen, Webseitenzugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
                </p>
              </div>
            </div>
          </motion.div>

          <Separator className="bg-slate-100" />

          {/* 3. Datenerfassung */}
          <motion.div variants={fadeIn}>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Eye className="h-4 w-4" />
              </div>
              <div className="space-y-4 w-full">
                <h3 className="text-lg font-bold text-slate-900">Datenerfassung</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm">Server-Log-Dateien</h4>
                    <ul className="list-disc pl-4 text-xs text-slate-500 space-y-1">
                      <li>Browsertyp und Version</li>
                      <li>Betriebssystem</li>
                      <li>Referrer URL</li>
                      <li>IP-Adresse & Zeitstempel</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm">Turnier-Anmeldung</h4>
                    <ul className="list-disc pl-4 text-xs text-slate-500 space-y-1">
                      <li>Vor- und Nachname</li>
                      <li>E-Mail (für Login)</li>
                      <li>Spielername (Nickname)</li>
                      <li>Zahlungsdaten (via Stripe)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <Separator className="bg-slate-100" />

          {/* 4. Dienste & Cookies */}
          <motion.div variants={fadeIn}>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Externe Dienste</h3>
                  <div className="text-sm text-slate-600 space-y-4">
                    <p>
                      <strong>Stripe (Zahlungen):</strong> Wenn Sie die Bezahlung über Stripe wählen, werden Ihre Zahlungsdaten an Stripe Payments Europe, Ltd., Irland übermittelt. 
                      Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
                    </p>
                    <p>
                      <strong>E-Mails:</strong> Wir versenden Transaktions-Mails (z.B. Login-Links) über spezialisierte Dienstleister. Ihre Adresse wird nicht verkauft.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Cookies</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Wir nutzen technisch notwendige Cookies/Session Storage für den Login-Status. Ohne diese ist die Nutzung des Dashboards nicht möglich (Art. 6 Abs. 1 lit. f DSGVO).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 5. Betroffenenrechte */}
          <motion.div variants={fadeIn}>
            <Card className="bg-slate-900 text-white border-slate-800">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" /> Ihre Rechte
                </h3>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. 
                  Zudem können Sie Einwilligungen widerrufen und sich bei der Aufsichtsbehörde (BayLDA) beschweren.
                </p>
                <Button variant="secondary" size="sm" asChild>
                  <a href="mailto:geissdoerfer@fw-puschendorf.de">Datenschutzanfrage stellen</a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      </main>
      <Footer />
    </div>
  );
}