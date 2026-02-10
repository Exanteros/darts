'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Target, Trophy, Users, Zap, 
  ArrowRight, CheckCircle2, Menu,
  Award, Shield, Calendar
} from "lucide-react";

/* ======================== CLEAN HELPER COMPONENTS ======================== */

// Schlichte Zahlendarstellung ohne viel Schnickschnack
function StatDisplay({ value, label, icon: Icon, suffix = "" }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center p-4"
    >
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-bold text-slate-900 tracking-tight">
        {value}{suffix}
      </div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{label}</div>
    </motion.div>
  );
}

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/admin/tournament/settings');
        if (response.ok) {
          const settings = await response.json();
          setMainLogo(settings.mainLogo || '');
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  return (
    <div className="flex items-center gap-3 cursor-pointer">
      {mainLogo ? (
        <img src={mainLogo} alt="Logo" className="h-10 w-auto object-contain" />
      ) : (
        <>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Target className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Darts Masters</span>
        </>
      )}
    </div>
  );
}

function RegistrationBadge() {
  const [badgeText, setBadgeText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch('/api/tournament/public')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!mounted) return;
        if (data && data.tournaments && data.tournaments.length > 0) {
          const now = new Date();
          const tournaments = data.tournaments as any[];

          // Prefer tournaments with open registration or waitlist
          const prioritized = tournaments
            .filter(t => t.status === 'REGISTRATION_OPEN' || t.status === 'WAITLIST')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

          let t = prioritized[0];

          if (!t) {
            // Next upcoming tournament
            const upcoming = tournaments
              .filter(t => new Date(t.startDate) > now)
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            t = upcoming[0] || tournaments.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
          }

          if (t) {
            const monthYear = new Date(t.startDate).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
            const statusText = t.status === 'REGISTRATION_OPEN' ? 'Anmeldung offen' : t.status === 'WAITLIST' ? 'Warteliste' : (new Date(t.startDate) > now ? 'Anmeldung geschlossen' : 'Vergangen');
            setBadgeText(`${monthYear} • ${statusText}`);
          }
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  return (
    <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium bg-slate-100 text-slate-600 border-none rounded-full">
      {loading ? 'Lädt...' : (badgeText || 'Kein Event')}
    </Badge>
  );
}

/* ======================== MAIN PAGE ======================== */

export default function Home() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="relative min-h-screen bg-white antialiased text-slate-900">
      <Header />
      
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}

/* ======================== SECTIONS ======================== */

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Subtiler Hintergrund-Akzent statt Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-slate-50 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <RegistrationBadge />
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Darts Masters <span className="text-slate-400"><br></br>Puschendorf</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Erlebe das größte Darts-Event der Region. 64 Spieler, 
              professionelles Live-Scoring und echte Turnier-Atmosphäre.
            </p>

            <div className="flex items-center justify-center">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-slate-200 text-lg w-full sm:w-auto hover:bg-slate-50" asChild>
                <a href="#features">Details ansehen</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}



function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <Zap className="h-8 w-8 text-blue-400 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Echtzeit Live-Scoring</h3>
              <p className="text-slate-400 text-lg max-w-md">
                Alle Ergebnisse werden sofort digital erfasst und auf Screens in der Halle sowie online gestreamt.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Target className="w-64 h-64 -mb-20 -mr-20" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
            <Award className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-3">Preise & Pokale</h3>
            <p className="text-slate-500">Sachpreise und Trophäen für die Top-Platzierten und das höchste Finish.</p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
            <Shield className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-3">Fairplay-Modus</h3>
            <p className="text-slate-500">Geregelter Ablauf durch erfahrene Turnierleitung und klare Regeln.</p>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Turnier-Struktur</h3>
              <p className="text-slate-500">Single-Elimination K.O. System ab der ersten Runde — jedes Spiel zählt. Das ist ein Darts‑Turnier!</p>
            </div>
            <Button variant="link" className="text-slate-900 p-0 h-auto font-bold text-lg" asChild>
              <a href="#rules">Regelwerk lesen <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}





/* ======================== HEADER & FOOTER ======================== */

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-100 py-4" : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <DynamicLogo />
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900">Features</a>
          <a href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">Login</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button className="rounded-full bg-slate-900 px-6 hidden sm:flex" asChild>
            <a href="/tournament/register">Anmelden</a>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 lg:py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <DynamicLogo />
            <p className="mt-6 text-slate-500 text-sm leading-relaxed">
              Darts-Sport auf höchstem Niveau in Puschendorf. Organisiert für Spieler von Spielern.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Event</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="/tournament/register" className="hover:text-slate-900">Anmeldung</a></li>
              <li><a href="/tournament/participants" className="hover:text-slate-900">Teilnehmerliste</a></li>
              <li><a href="/sponsors" className="hover:text-slate-900">Sponsoren</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="/contact" className="hover:text-slate-900">Kontakt</a></li>
              <li><a href="/faq" className="hover:text-slate-900">Häufige Fragen</a></li>
              <li><a href="/anfahrt" className="hover:text-slate-900">Anfahrt</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Rechtliches</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="/impressum" className="hover:text-slate-900">Impressum</a></li>
              <li><a href="/datenschutz" className="hover:text-slate-900">Datenschutz</a></li>
              <li><a href="/agb" className="hover:text-slate-900">AGB</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">© 2026 Darts Masters Puschendorf.</p>
          <div className="flex gap-6">
             <span className="text-sm text-slate-400 italic">Built for the game.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}