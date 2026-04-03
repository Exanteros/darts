"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Car, MapPin, Train, Clock3, Navigation } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import DynamicLogo from "@/components/DynamicLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PublicTournament = {
  id: string;
  name: string;
  startDate: string;
  status: string;
  location?: string | null;
  street?: string | null;
};

type LocationHint = {
  city: string | null;
  region: string | null;
  country: string | null;
  source: "ip" | "none";
};

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
              <li><Link href="/tournament/champions" className="hover:text-slate-900 transition-colors">Champions</Link></li>
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
          <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Built for the game.</span>
        </div>
      </div>
    </footer>
  );
}

export default function AnfahrtPage() {
  const [eventName, setEventName] = useState("Dart Masters Puschendorf");
  const [location, setLocation] = useState("Puschendorf");
  const [street, setStreet] = useState("");
  const [locationHint, setLocationHint] = useState<LocationHint>({ city: null, region: null, country: null, source: "none" });
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAddress = async () => {
      try {
        const response = await fetch("/api/tournament/public");
        if (!response.ok) return;

        const data = await response.json();
        const tournaments: PublicTournament[] = data?.tournaments ?? [];
        if (!tournaments.length || !mounted) return;

        const now = new Date();
        const parsed = tournaments
          .map((t) => ({ ...t, date: new Date(t.startDate) }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const preferred =
          parsed.find((t) => t.status === "REGISTRATION_OPEN" || t.status === "WAITLIST") ||
          parsed.find((t) => t.date >= now) ||
          parsed[parsed.length - 1];

        if (!preferred) return;

        setEventName(preferred.name || "Dart Masters Puschendorf");
        setLocation(preferred.location?.trim() || "Puschendorf");
        setStreet(preferred.street?.trim() || "");
      } catch {
        // Keep fallback values when API data is not available.
      }
    };

    loadAddress();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadLocationHint = async () => {
      try {
        const response = await fetch("/api/public/location-hint", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as LocationHint;
        if (!mounted) return;

        setLocationHint({
          city: data.city ?? null,
          region: data.region ?? null,
          country: data.country ?? null,
          source: data.source ?? "none",
        });
      } catch {
        // Keep neutral fallback texts.
      }
    };

    loadLocationHint();
    return () => {
      mounted = false;
    };
  }, []);

  const mapQuery = [street, location].filter(Boolean).join(", ");
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery || "Puschendorf")}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || "Puschendorf")}`;
  const mapsDriveUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery || "Puschendorf")}&travelmode=driving`;
  const mapsTransitUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery || "Puschendorf")}&travelmode=transit`;

  const normalizedLocation = location.toLowerCase();
  const normalizedCity = (locationHint.city || "").toLowerCase();
  const isLocal = normalizedCity.length > 0 && normalizedLocation.includes(normalizedCity);

  const carDescription = isLocal
    ? "Du kommst aus der Nähe: Die Halle ist über die regionalen Hauptstraßen schnell erreichbar. Vor Ort stehen Parkmöglichkeiten in fußläufiger Entfernung zur Verfügung."
    : locationHint.city
      ? `Anreise aus ${locationHint.city}: Plane die Fahrt über die regionalen Hauptstraßen. Vor Ort stehen Parkmöglichkeiten in fußläufiger Entfernung zur Verfügung.`
      : "Die Halle ist über die regionalen Hauptstraßen gut erreichbar. Vor Ort stehen Parkmöglichkeiten in fußläufiger Entfernung zur Verfügung.";

  const publicTransportDescription = isLocal
    ? "Für die Anreise mit ÖPNV reichen in der Regel kurze Verbindungen mit anschließendem Fußweg zur Location."
    : locationHint.city
      ? `Wenn du aus ${locationHint.city} anreist, plane den ÖPNV mit etwas Puffer und möglichem Umstieg ein. Die letzten Meter sind gut zu Fuß erreichbar.`
      : "Plane die Anreise idealerweise mit etwas Puffer. Die nächstgelegenen Haltepunkte sind mit einem kurzen Fußweg zur Location verbunden.";

  const arrivalDescription = isLocal
    ? "Empfehlung für lokale Anreise: etwa 25 bis 35 Minuten vor Turnierbeginn eintreffen, damit Check-in und Warm-up entspannt möglich sind."
    : locationHint.city
      ? `Bei Anreise aus ${locationHint.city} empfehlen wir, 45 bis 60 Minuten vor Turnierbeginn da zu sein, damit Check-in, Board-Zuteilung und Warm-up ohne Stress laufen.`
      : "Komme etwa 30 bis 45 Minuten vor Turnierbeginn, damit Check-in, Board-Zuteilung und Warm-up entspannt möglich sind.";

  const travelOptions = [
    {
      icon: Car,
      title: "Anreise mit dem Auto",
      description: carDescription,
    },
    {
      icon: Train,
      title: "Anreise mit ÖPNV",
      description: publicTransportDescription,
    },
    {
      icon: Clock3,
      title: "Empfohlene Ankunftszeit",
      description: arrivalDescription,
    },
  ];

  return (
    <div className="relative min-h-screen bg-white antialiased text-slate-900 selection:bg-slate-200">
      <PageHeader />

      <main className="pt-16 lg:pt-24">
        <section className="relative overflow-hidden border-b border-slate-200 py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0">
            <iframe
              title="Karte Veranstaltungsort"
              src={mapEmbedUrl}
              className="h-full w-full border-0 grayscale contrast-125 brightness-95"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
            />
            <div className="absolute inset-0 bg-white/75" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.24),_transparent_45%)]" />
            {!mapLoaded && (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#f1f5f9_100%)]" />
            )}
          </div>
          <div className="container mx-auto px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-6">/ Support ■ Anfahrt</p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.05] mb-6">
                Einfach ankommen.
                <br />
                <span className="text-slate-400">Direkt ins Turnier.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mb-10">
                Hier findest du alle wichtigen Informationen für deine Anreise zur Event-Location,
                inklusive Orientierung, Zeitplanung und schneller Navigation.
              </p>
              <p className="text-sm font-mono tracking-wider uppercase text-slate-500 mb-8">
                Ziel: {street ? `${street}, ${location}` : location}
              </p>
              {locationHint.city && (
                <p className="text-xs font-mono tracking-wider uppercase text-slate-500 mb-8">
                  Dynamische Hinweise für Anreise aus {locationHint.city}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" className="h-12 px-7 rounded-sm bg-slate-900 text-white hover:bg-slate-800 font-semibold" asChild>
                  <Link href="/contact">Frage zur Anfahrt</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-7 rounded-sm border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold" asChild>
                  <a href="#route-details">Details ansehen</a>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-7 rounded-sm font-semibold" asChild>
                  <a href={mapsLinkUrl} target="_blank" rel="noreferrer">Route in Maps</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="route-details" className="border-b border-slate-200 bg-slate-50 py-14 sm:py-16">
          <div className="container mx-auto px-6">
            <div className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-8">/ Orientierung ■</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {travelOptions.map((option) => (
                <article key={option.title} className="rounded-sm border border-slate-200 bg-white p-6">
                  <option.icon className="h-5 w-5 text-slate-900 mb-4" />
                  <h2 className="text-lg font-bold tracking-tight mb-3">{option.title}</h2>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{option.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 py-14 sm:py-16">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="rounded-sm border border-slate-200 bg-white p-7">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-slate-900" />
                <h3 className="text-2xl font-bold tracking-tight">Veranstaltungsort</h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-5">
                Die Adresse wird automatisch aus den aktuellen Turnierdaten geladen.
                Prüfe die Seite kurz vor dem Event erneut für eventuelle Updates.
              </p>
              <div className="rounded-sm bg-slate-100 border border-slate-200 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{eventName}</p>
                <p>{street || "Straße folgt"}</p>
                <p>{location}</p>
              </div>
            </div>

            <div className="rounded-sm border border-slate-200 bg-white p-7">
              <div className="flex items-center gap-3 mb-4">
                <Navigation className="h-5 w-5 text-slate-900" />
                <h3 className="text-2xl font-bold tracking-tight">Schnellnavigation</h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                Starte die Navigation direkt mit der aktuell geladenen Adresse.
                Ziel: {street ? `${street}, ${location}` : location}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="rounded-sm border-slate-300" asChild>
                  <a href={mapsDriveUrl} target="_blank" rel="noreferrer">Route mit dem Auto</a>
                </Button>
                <Button variant="outline" className="rounded-sm border-slate-300" asChild>
                  <a href={mapsTransitUrl} target="_blank" rel="noreferrer">Route mit ÖPNV</a>
                </Button>
                <Button variant="ghost" className="rounded-sm" asChild>
                  <a href={mapsLinkUrl} target="_blank" rel="noreferrer">Karte öffnen</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-6">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold transition-colors">
              <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}