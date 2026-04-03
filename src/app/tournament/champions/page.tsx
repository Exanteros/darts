"use client";

import { PageHeader } from "@/components/page-header";
import DynamicLogo from "@/components/DynamicLogo";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, Target, Menu, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// API Response interface
interface Champion {
  id: string;
  name: string;
  tournament: string;
  date: string;
  avg: string;
  checkout: string;
  tag: string | null;
  imageUrl: string | null;
  imagePosY?: string | null;
  colorClass: string;
  iconColor: string;
  order: number;
}



function Footer() {
  return (
    <footer className="bg-white py-16 lg:py-24 border-t border-slate-200">
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
              <li><a href="/tournament/champions" className="hover:text-slate-900 transition-colors">Champions</a></li>
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

export default function ChampionsPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchChampions = async () => {
      try {
        const res = await fetch("/api/public/champions");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success) {
            setChampions(data.champions);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchChampions();
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="relative min-h-screen bg-white antialiased text-slate-900 selection:bg-slate-200">
      
      <PageHeader />

      {/* HEADER SECTION mimicking HeroSection from main page */}
      <section className="relative min-h-[50dvh] flex items-center py-16 lg:py-24 border-b border-slate-200 mt-16 md:mt-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
              <Trophy size={14} className="text-amber-500" />
              HALL OF FAME
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 mb-6 lg:mb-8 leading-[1.1]">
              Unsere <br />
              <span className="text-slate-400">Champions</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-8 lg:mb-10 leading-relaxed font-medium max-w-xl">
              Hier werden Legenden geboren. Die Besten der Besten, verewigt für ihre herausragenden Leistungen an der Scheibe.
            </p>
          </div>
        </div>
      </section>

      {/* CHAMPIONS GRID mimicking FeaturesSection cards */}
      <section className="py-16 lg:py-24 border-b border-slate-200 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-xs font-mono text-slate-400 mb-12 tracking-widest uppercase">
            / TITELTRÄGER ■
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 animate-pulse font-mono text-sm tracking-widest">
              LADE CHAMPIONS...
            </div>
          ) : champions.length === 0 ? (
             <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-sm max-w-xl mx-auto">
               Noch keine Champions verzeichnet. <br />Das nächste Turnier wartet auf neue Legenden!
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {champions.map((champ, index) => (
                <motion.div 
                  key={champ.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={cn(
                    "bg-white border border-slate-200 hover:border-slate-400 transition-colors group relative flex flex-col",
                    champ.tag === "Reigning Champ" ? "shadow-md hover:shadow-lg border-amber-200/50" : ""
                  )}
                >
                  {/* Highlight Border Top */}
                  <div className={cn("absolute top-0 inset-x-0 h-1", champ.colorClass || "bg-slate-400")} />

                  {/* Winner Tag */}
                  {champ.tag && (
                    <div className={cn(
                      "absolute top-4 right-4 text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-sm z-10",
                      champ.tag === "Reigning Champ" || champ.tag.includes("Reign") 
                        ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {champ.tag}
                    </div>
                  )}

                  {/* Panorama Image */}
                  <div className="relative w-full aspect-[21/9] bg-slate-100 border-b border-slate-200 overflow-hidden mt-1">
                    {champ.imageUrl ? (
                      <img 
                        src={champ.imageUrl} 
                        alt={`Panorama von ${champ.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        style={{ objectPosition: `center ${champ.imagePosY || "50%"}` }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-500">
                        <User size={32} className="mb-1 opacity-50" />
                        <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">Panorama Foto</span>
                      </div>
                    )}
                  </div>

                  {/* Profile/Header area */}
                  <div className="p-8 pb-6 bg-white flex flex-col items-center border-b border-slate-100">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center line-clamp-1">{champ.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs font-mono uppercase tracking-wider">
                      <Trophy size={14} className={champ.iconColor || "text-slate-400"} />
                      <span>{champ.tournament}</span>
                    </div>
                  </div>

                  {/* Stats area */}
                  {(champ.avg || champ.checkout) && (
                    <div className={cn(
                      "flex-1 grid divide-x divide-slate-100 bg-white",
                      (champ.avg && champ.checkout) ? "grid-cols-2" : "grid-cols-1"
                    )}>
                      {champ.avg && (
                        <div className="p-6 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-2">Turnier-Avg</span>
                          <span className="font-extrabold text-3xl text-slate-900 tracking-tighter">{champ.avg}</span>
                        </div>
                      )}
                      {champ.checkout && (
                        <div className="p-6 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-2">High Finish</span>
                          <span className="font-extrabold text-3xl text-slate-900 tracking-tighter">{champ.checkout}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer area */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono tracking-wider uppercase bg-slate-50/50">
                    <Calendar size={14} />
                    <span>{champ.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION mimicking Footer CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Wirst du der Nächste?
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Sichere dir deinen Platz im nächsten Turnier und verewige dich in der Hall of Fame.
          </p>
          <Button size="lg" className="h-14 px-8 rounded-sm bg-slate-900 text-white text-lg hover:bg-slate-800 font-semibold inline-flex items-center gap-2" asChild>
            <a href="/tournament/register">
              Jetzt anmelden <ArrowRight size={20} />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}