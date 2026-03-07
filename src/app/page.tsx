'use client';

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Target, Trophy, Users, Zap, 
  ArrowRight, CheckCircle2, Menu,
  Award, Shield, Calendar, Terminal
} from "lucide-react";

/* ======================== CLEAN HELPER COMPONENTS ======================== */

// Schlichte Zahlendarstellung ohne viel Schnickschnack
function StatDisplay({ value, label, suffix = "" }: any) {
  return (
    <div className="flex flex-col items-start p-6 border-l border-slate-200">
      <div className="text-5xl font-extrabold text-slate-900 tracking-tighter mb-2">
        {value}{suffix}
      </div>
      <div className="text-sm font-mono text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
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
        <img src={mainLogo} alt="Logo" className="h-8 w-auto object-contain" />
      ) : (
        <>
          <div className="flex h-8 w-8 items-center justify-center bg-slate-900 text-white rounded-sm">
            <Target className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Dart Masters</span>
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
    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      {loading ? 'LÄDT...' : (badgeText || 'KEIN EVENT').toUpperCase()}
    </div>
  );
}

/* ======================== MAIN PAGE ======================== */

export default function Home() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="relative min-h-screen bg-white antialiased text-slate-900 selection:bg-slate-200">
      <Header />
      
      <main className="pt-16 lg:pt-24">
        <HeroSection />
        <StatsSection />
        <ImageCarouselSection />
        <FeaturesSection />
        <ComparisonSection />
      </main>

      <Footer />
    </div>
  );
}

/* ======================== SECTIONS ======================== */

function HeroSection() {
  return (
    <section className="relative min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-6rem)] flex items-center py-8 lg:py-16 overflow-hidden border-b border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <RegistrationBadge />
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 mb-6 lg:mb-8 leading-[1.1]">
              Dart Masters <br />
              <span className="text-slate-400">Puschendorf</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-8 lg:mb-10 leading-relaxed font-medium max-w-xl">
              Erlebe das größte Darts-Event der Region. Ein professionelles Setup, das echtes Ally Pally Feeling direkt zu dir bringt.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" className="h-14 px-8 rounded-sm bg-slate-900 text-white text-lg hover:bg-slate-800 font-semibold w-full sm:w-auto" asChild>
                <a href="/tournament/register">Jetzt anmelden</a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-sm border-slate-300 text-slate-900 text-lg hover:bg-slate-50 font-semibold w-full sm:w-auto" asChild>
                <a href="#features">Details ansehen</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative hidden lg:flex justify-center"
          >
            {/* Hero Image */}
            <div className="flex items-center justify-center w-full max-w-md">
              <img 
                src="/hero/hero.png" 
                alt="Dart Masters Hero" 
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-16 border-b border-slate-200 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-xs font-mono text-slate-400 mb-8 tracking-widest uppercase">
          / BY THE NUMBERS ■
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatDisplay value="64" label="Teilnehmer" />
          <StatDisplay value="8" label="Profi-Boards" />
          <StatDisplay value="501" label="Double Out" />
          <StatDisplay value="1" label="Champion" />
        </div>
      </div>
    </section>
  );
}

function ImageCarouselSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Map scroll progress (0 to 1) to rotation degrees (-15 to 15)
  const rotation = useTransform(scrollYProgress, [0, 1], [-15, 15]);

  const baseImages = [
    "/darts/1.jpg",
    "/darts/2.jpg",
    "/darts/3.jpg",
    "/darts/4.jpg",
    "/darts/5.jpg",
    "/darts/6.jpg"
  ];
  
  // 24 images to fill the ~9400px circumference
  const images = [...baseImages, ...baseImages, ...baseImages, ...baseImages];

  return (
    <section ref={containerRef} className="py-24 border-b border-slate-200 overflow-hidden bg-white relative flex flex-col items-center">
      <div className="container mx-auto px-6 mb-8 relative z-10">
        <div className="text-xs font-mono text-slate-400 tracking-widest uppercase text-center">
          / ATMOSPHERE ■
        </div>
      </div>

      <div className="relative w-full h-[400px] overflow-hidden flex justify-center">
        {/* Gradient masks for smooth fade out on edges */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />
        
        {/* Huge circle that rotates based on scroll */}
        <motion.div 
          className="absolute top-[20px] left-1/2 w-[3000px] h-[3000px] rounded-full"
          style={{ 
            x: "-50%",
            rotate: rotation
          }}
        >
          {images.map((src, i) => {
            const angle = (i / images.length) * 360;
            return (
              <div 
                key={i} 
                className="absolute top-0 left-1/2 origin-[50%_1500px]"
                style={{ 
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  height: '1500px' // Radius
                }}
              >
                <div className="w-64 md:w-80 aspect-[4/3] rounded-sm overflow-hidden bg-slate-100 border border-slate-200 shadow-xl">
                  <img 
                    src={src} 
                    alt="Impression" 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 border-b border-slate-200">
      <div className="container mx-auto px-6">
        <div className="text-xs font-mono text-slate-400 mb-12 tracking-widest uppercase">
          / FEATURES ■
        </div>
        
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Professionelles Setup, <br/>aber für alle.
          </h2>
          <p className="text-xl text-slate-600">
            Wir bringen die Standards der großen Turniere in die Region. Von der Anmeldung bis zum Finale – alles digital, transparent und auf höchstem Niveau.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 border border-slate-200 bg-white hover:border-slate-400 transition-colors group">
            <Zap className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-900">Echtzeit Live-Scoring</h3>
            <p className="text-slate-600 leading-relaxed">
              Alle Ergebnisse werden sofort digital erfasst und auf Screens in der Halle sowie online gestreamt.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 border border-slate-200 bg-white hover:border-slate-400 transition-colors group">
            <Award className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-900">Preise & Pokale</h3>
            <p className="text-slate-600 leading-relaxed">
              Sachpreise und Trophäen für die Top-Platzierten und das höchste Finish des Turniers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 border border-slate-200 bg-white hover:border-slate-400 transition-colors group">
            <Shield className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-3 text-slate-900">Fairplay-Modus</h3>
            <p className="text-slate-600 leading-relaxed">
              Geregelter Ablauf durch erfahrene Turnierleitung und klare, transparente Regeln für alle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="py-24 lg:py-32 bg-slate-900 text-white">
      <div className="container mx-auto px-6">
        <div className="text-xs font-mono text-slate-500 mb-12 tracking-widest uppercase">
          / THE EXPERIENCE ■
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Nicht nur ein Turnier. <br/>Ein Event.
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Single-Elimination K.O. System ab der ersten Runde — jedes Spiel zählt. Das ist ein Darts‑Turnier, wie es sein sollte.
            </p>
            <Button variant="outline" className="h-12 px-6 rounded-sm border-slate-700 text-white hover:bg-slate-800 hover:text-white bg-transparent" asChild>
              <a href="#rules">Regelwerk lesen <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
          
          <div className="border border-slate-800 bg-slate-950 p-8 font-mono text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-4 mb-4 text-slate-500">
              <span>FEATURE</span>
              <span>STATUS</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Walk-on Music</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Caller</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Live Stream</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Catering</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
      isScrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200 py-4" : "bg-white py-6 border-b border-transparent"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <DynamicLogo />
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
          <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Login</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button className="rounded-sm bg-slate-900 text-white px-6 hidden sm:flex hover:bg-slate-800 font-semibold" asChild>
            <a href="/tournament/register">Anmelden</a>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-slate-900">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <DynamicLogo />
            <p className="mt-6 text-slate-500 text-sm leading-relaxed font-medium">
              Darts-Sport auf höchstem Niveau in Puschendorf. Organisiert für Spieler von Spielern.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Event</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="/tournament/register" className="hover:text-slate-900 transition-colors">Anmeldung</a></li>
              <li><a href="/tournament/participants" className="hover:text-slate-900 transition-colors">Teilnehmerliste</a></li>
              <li><a href="/sponsors" className="hover:text-slate-900 transition-colors">Sponsoren</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="/contact" className="hover:text-slate-900 transition-colors">Kontakt</a></li>
              <li><a href="/faq" className="hover:text-slate-900 transition-colors">Häufige Fragen</a></li>
              <li><a href="/anfahrt" className="hover:text-slate-900 transition-colors">Anfahrt</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Rechtliches</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><a href="/impressum" className="hover:text-slate-900 transition-colors">Impressum</a></li>
              <li><a href="/datenschutz" className="hover:text-slate-900 transition-colors">Datenschutz</a></li>
              <li><a href="/agb" className="hover:text-slate-900 transition-colors">AGB</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-400">© 2026 Dart Masters Puschendorf.</p>
          <div className="flex gap-6">
             <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Built for the game.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
