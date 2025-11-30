"use client";

import { useEffect, useState, useRef } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useInView, 
  useSpring, 
  useAnimation,
  useMotionValue,
  Variants 
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Target, Trophy, Users, Calendar, MapPin, Clock, 
  Zap, TrendingUp, ChevronRight, Sparkles,
  Shield, Award, ArrowRight, CheckCircle2
} from "lucide-react";

/* ======================== MAGIC UI COMPONENTS ======================== */

// 1. NUMBER TICKER
function NumberTicker({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(Math.round(latest));
      }
    });
  }, [springValue]);

  return <span className={cn("inline-block tabular-nums text-black dark:text-white tracking-wider", className)} ref={ref} />;
}

// 2. WORD PULL UP
function WordPullUp({
  words,
  className,
  wrapperFramerProps = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  },
  framerProps = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  },
}: {
  words: string;
  className?: string;
  wrapperFramerProps?: Variants;
  framerProps?: Variants;
}) {
  return (
    <motion.h1
      variants={wrapperFramerProps}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={cn(
        "font-display text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em] drop-shadow-sm",
        className,
      )}
    >
      {words.split(" ").map((word, i) => (
        <motion.span
          key={i}
          variants={framerProps}
          style={{ display: "inline-block", paddingRight: "8px" }}
        >
          {word === "" ? <span>&nbsp;</span> : word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// 3. BORDER BEAM
function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  anchor?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": delay,
        } as React.CSSProperties
      }
      className={cn(
        "absolute inset-[0] rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:calc(var(--delay)*1s)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className,
      )}
    />
  );
}

// 4. ANIMATED GRID PATTERN
function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  ...props
}: any) {
  const id = useRef(`grid-pattern-${Math.random().toString(36).substr(2, 9)}`).current;

  return (
    <div className={cn("pointer-events-none absolute inset-0 h-full w-full overflow-hidden [mask-image:linear-gradient(to_bottom,white,transparent)]", className)} {...props}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30"
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              strokeDasharray={strokeDasharray}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
        <svg x={x} y={y} className="overflow-visible">
            {[...Array(numSquares)].map((_, i) => (
                <motion.rect
                    key={i}
                    width={width - 1}
                    height={height - 1}
                    x={Math.floor(Math.random() * 20) * width + 1}
                    y={Math.floor(Math.random() * 20) * height + 1}
                    fill="currentColor"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: maxOpacity }}
                    transition={{
                        duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: Math.random() * 10,
                    }}
                />
            ))}
        </svg>
      </svg>
    </div>
  );
}

// 5. SHIMMER BUTTON
const ShimmerButton = ({ children, className, ...props }: any) => {
  return (
    <button
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-8 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] dark:text-black",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-[1px]",
        className
      )}
      style={{
        "--spread": "90deg",
        "--shimmer-color": "#ffffff",
        "--radius": "100px",
        "--speed": "3s",
        "--cut": "0.1em",
        "--bg": "rgba(0, 0, 0, 1)",
      } as React.CSSProperties}
      {...props}
    >
      <div className={cn("-z-30 blur-[2px]", "absolute inset-0 overflow-visible [container-type:size]")}>
        <div className="absolute inset-0 h-[100cqh] animate-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
          <div className="absolute -inset-full w-auto rotate-0 animate-spin [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </div>
      </div>
      <div className={cn("insert-0 absolute size-full", "rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]", "transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]")} />
      <div className={cn("relative z-10 flex items-center gap-2")}>{children}</div>
      <div className={cn("absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]")} />
    </button>
  );
};

/* ======================== HELPER COMPONENTS ======================== */

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.6 } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// --- DIESE KOMPONENTE FEHLTE VORHER ---
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
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition-transform group-hover:scale-110">
        {mainLogo ? (
          <img src={mainLogo} alt="Logo" className="h-5 w-5 object-contain" />
        ) : (
          <Target className="h-5 w-5" />
        )}
      </div>
      <span className="font-bold text-lg tracking-tight text-slate-900">Darts Masters</span>
    </div>
  );
}

/* ======================== PAGE CONTENT ======================== */

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white selection:bg-slate-900 selection:text-white font-sans antialiased">
      <style jsx global>{`
        @keyframes border-beam {
          100% { offset-distance: 100%; }
        }
        .animate-border-beam {
          animation: border-beam calc(var(--duration)*1s) infinite linear;
        }
        @keyframes slide {
          to { transform: translate(calc(100cqw - 100%), 0); }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
             animation: spin var(--speed) linear infinite;
        }
      `}</style>

      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesBentoGrid />
        <TournamentTimeline />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

/* ======================== SECTIONS ======================== */

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32 lg:pb-48">
      {/* MagicUI: Animated Grid Background */}
      <AnimatedGridPattern 
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]", "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12")}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-4xl"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-8">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-50 transition-colors cursor-default">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-slate-600 font-medium">Anmeldung geöffnet für 2025</span>
            </Badge>
          </motion.div>

          {/* Headline - MagicUI: Word Pull Up */}
          <WordPullUp 
            words="Darts Masters Puschendorf" 
            className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-slate-900 mb-2"
          />

          {/* Subline */}
          <motion.p 
            variants={fadeInUp}
            className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed"
          >
            Das Darts-Event der Region. 64 Spieler, Single-Elimination 
            und professionelles Live-Scoring auf über 5 Scheiben.
          </motion.p>

          {/* Buttons - MagicUI: Shimmer Button */}
          <motion.div 
            variants={fadeInUp}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a href="/tournament/register">
                <ShimmerButton className="shadow-2xl">
                    <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                        Jetzt anmelden
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-white" />
                </ShimmerButton>
            </a>
            
            <Button size="lg" variant="outline" className="h-[52px] px-8 rounded-full border-slate-200 hover:bg-slate-50 transition-all hover:scale-105" asChild>
              <a href="#features">
                Mehr erfahren
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { label: "Teilnehmer Max.", value: 64, icon: Users },
    { label: "Gewinnspiele", value: 63, icon: Trophy },
    { label: "Profi-Scheiben", value: 5, icon: Target },
    { label: "Live-Latenz (ms)", value: 50, icon: Zap },
  ];

  return (
    <div className="border-y border-slate-100 bg-slate-50/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="flex flex-col items-center justify-center text-center"
            >
              <div className="mb-2 rounded-full bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
                <stat.icon className="h-5 w-5" />
              </div>
              {/* MagicUI: Number Ticker */}
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                 <NumberTicker value={stat.value} />{stat.label.includes('Latenz') ? 'ms' : (stat.label.includes('Scheiben') ? '+' : '')}
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesBentoGrid() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Professionelles Setup. <span className="text-slate-400">Maximale Spannung.</span>
          </h2>
          <p className="text-lg text-slate-600">
            Wir bringen TV-Atmosphäre in den Hobbysport. Jedes Detail ist darauf ausgelegt, 
            das beste Spielerlebnis zu bieten.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          
          {/* Large Card Left */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 row-span-2 relative group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 hover:shadow-xl transition-all duration-500 hover:border-blue-200"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Real-Time Scoring</h3>
                <p className="text-slate-500 max-w-md">
                  Erlebe professionelles Caller-Feeling. Alle Scores werden in Echtzeit auf Tablets erfasst und live auf Monitoren und im Web angezeigt.
                </p>
              </div>
              
              {/* Fake UI Element with animation */}
              <div className="mt-8 bg-white rounded-xl border border-slate-200 p-4 shadow-sm opacity-90 group-hover:translate-y-[-5px] transition-transform duration-500">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-400">LIVE</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-slate-400">Spieler 1</div>
                    <div className="text-3xl font-mono font-bold text-slate-900"> <NumberTicker value={140} /> </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Spieler 2</div>
                    <div className="text-3xl font-mono font-bold text-slate-300"> <NumberTicker value={301} /> </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Small Card Top Right */}
          <BentoCard 
            title="Single Out Format"
            description="Klassisches 501 Single Out für schnellen Spielfluss. Best of 2 Legs in der Gruppenphase."
            icon={Target}
            delay={0.1}
          />

          {/* Small Card Middle Right */}
          <BentoCard 
            title="Preispool"
            description="Attraktive Sach- und Geldpreise für die Top-Platzierungen und High-Finishes."
            icon={Award}
            delay={0.2}
          />

          {/* Wide Card Bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3 bg-slate-900 rounded-3xl p-8 relative overflow-hidden group"
          >
            {/* MagicUI: Border Beam on Dark Card */}
            <BorderBeam size={300} duration={12} delay={9} colorFrom="#3b82f6" colorTo="#8b5cf6" />

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 font-medium text-sm">Turnier-Struktur</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Single-Elimination K.O.</h3>
                <p className="text-slate-400 max-w-xl">
                  64 Spieler starten. Wer verliert, ist raus. Maximale Spannung ab der ersten Minute. 
                  Kein Double-Out Zwang bis zum Halbfinale.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function BentoCard({ title, description, icon: Icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-center relative overflow-hidden group"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 text-slate-900 border border-slate-100 relative z-10">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed relative z-10">{description}</p>
    </motion.div>
  );
}

function TournamentTimeline() {
  const steps = [
    {
      step: "01",
      title: "Shootout Phase",
      desc: "3 Darts High-Score Wurf zur Ermittlung der Setzliste."
    },
    {
      step: "02",
      title: "The Knockout",
      desc: "K.O.-System (1 vs 64, 2 vs 63...). Best of 2 Legs."
    },
    {
      step: "03",
      title: "Das Finale",
      desc: "Die zwei besten Spieler kämpfen auf der Main-Stage."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-white border border-slate-200">Ablauf</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Der Weg zum Titel</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative"
            >
              {i !== steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-slate-200 to-transparent z-0" />
              )}
              
              <div className="relative z-10 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-5xl font-bold text-slate-100 mb-4 group-hover:text-blue-50 transition-colors">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden isolate">
      {/* Glow Effect */}
      <div 
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-6xl h-[400px] bg-gradient-to-r from-blue-600/40 via-indigo-500/40 to-blue-600/40 blur-[100px] -z-10 opacity-80 pointer-events-none mix-blend-normal"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-16 text-center overflow-hidden relative shadow-2xl ring-1 ring-white/10 z-20"
        >
          {/* MagicUI: Border Beam for CTA */}
          <BorderBeam size={400} duration={10} colorFrom="#ffffff" colorTo="#3b82f6" />
          
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight relative z-10">
            Bereit für die Challenge?
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
            Die Plätze sind streng limitiert auf 64 Teilnehmer. 
            Melde dich jetzt an und sichere dir deinen Startplatz im Februar 2025.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
             <a href="/tournament/register">
                <ShimmerButton className="h-14 px-8 text-lg">
                    Jetzt Anmelden
                </ShimmerButton>
             </a>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-700 text-white hover:bg-slate-800 hover:text-white transition-all bg-transparent">
              <a href="/login">Login</a>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10">
              <CheckCircle2 className="h-4 w-4 text-blue-400" /> <span>Offizielles Turnier</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ======================== HEADER & FOOTER ======================== */

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 py-3" : "bg-transparent py-5"
    )}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <DynamicLogo />

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
          <a href="#ablauf" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Ablauf</a>
          <a href="/user" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Dashboard</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex hover:bg-slate-100 text-slate-700" asChild>
            <a href="/login">Login</a>
          </Button>
          <Button size="sm" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200/50" asChild>
            <a href="/tournament/register">Registrieren</a>
          </Button>
        </div>
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
              <li><a href="/tournament/register" className="hover:text-slate-900 transition-colors">Anmeldung</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Rechtliches</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="/impressum" className="hover:text-slate-900 transition-colors">Impressum</a></li>
              <li><a href="/datenschutz" className="hover:text-slate-900 transition-colors">Datenschutz</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Ort & Zeit</h4>
            <p className="text-sm text-slate-500 mb-2">Februar 2025</p>
            <p className="text-sm text-slate-500">Puschendorf, DE</p>
          </div>
        </div>
        
        <Separator className="bg-slate-100 mb-8" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© 2025 Darts Masters. Built with love and passion.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
          </div>
        </div>
      </div>
    </footer>
  );
}