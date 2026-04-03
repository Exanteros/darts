'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DynamicLogo from '@/components/DynamicLogo';
import { cn } from '@/lib/utils';
import { Mail, Menu, MessageSquare, Send, ShieldCheck, Timer } from 'lucide-react';

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof ContactFormData, string>>;

const initialData: ContactFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

function validate(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (data.name.trim().length < 2) {
    errors.name = 'Bitte gib deinen Namen ein.';
  }

  const email = data.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Bitte gib eine gueltige E-Mail-Adresse ein.';
  }

  if (data.subject.trim().length < 3) {
    errors.subject = 'Bitte gib einen Betreff ein.';
  }

  if (data.message.trim().length < 10) {
    errors.message = 'Deine Nachricht sollte mindestens 10 Zeichen lang sein.';
  }

  return errors;
}

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<ContactFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const checkScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const isValid = useMemo(() => Object.keys(validate(data)).length === 0, [data]);

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    const nextErrors = validate(data);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setSubmitError(payload?.message || 'Deine Nachricht konnte nicht gesendet werden.');
        return;
      }

      setSubmitMessage(payload.message || 'Danke! Deine Nachricht wurde erfolgreich gesendet.');
      setData(initialData);
      setErrors({});
    } catch {
      setSubmitError('Netzwerkfehler: Bitte versuche es in ein paar Minuten erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="relative min-h-screen bg-white antialiased text-slate-900 selection:bg-slate-200">
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-4' : 'bg-white py-6 border-b border-transparent'
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" aria-label="Zur Startseite">
            <DynamicLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
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

      <main className="pt-16 lg:pt-24">
        <section className="relative min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-6rem)] flex items-center py-8 lg:py-16 overflow-hidden border-b border-slate-200">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="max-w-2xl w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  / KONTAKT ■
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 mb-6 lg:mb-8 leading-[1.1]">
                  Schreib uns <br />
                  <span className="text-slate-400">direkt.</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 mb-8 lg:mb-10 leading-relaxed font-medium max-w-xl">
                  Fragen zur Anmeldung, Sponsoring oder zum Event-Ablauf? Wir melden uns schnell bei dir zurueck.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Button size="lg" className="h-14 px-8 rounded-sm bg-slate-900 text-white text-lg hover:bg-slate-800 font-semibold w-full sm:w-auto" asChild>
                    <a href="#contact-form">Nachricht senden</a>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-sm border-slate-300 text-slate-900 text-lg hover:bg-slate-50 font-semibold w-full sm:w-auto" asChild>
                    <a href="mailto:support@pudo-dartmasters.de">E-Mail oeffnen</a>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                <div className="grid grid-cols-1 gap-4">
                  <InfoCard
                    icon={<Mail className="h-5 w-5 text-slate-900" />}
                    title="E-Mail"
                    text="support@pudo-dartmasters.de"
                  />
                  <InfoCard
                    icon={<Timer className="h-5 w-5 text-slate-900" />}
                    title="Antwortzeit"
                    text="In der Regel innerhalb von 24 Stunden"
                  />
                  <InfoCard
                    icon={<ShieldCheck className="h-5 w-5 text-slate-900" />}
                    title="Datenschutz"
                    text="Deine Anfrage wird vertraulich behandelt."
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="contact-form" className="py-24 lg:py-32 border-b border-slate-200 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-xs font-mono text-slate-400 mb-12 tracking-widest uppercase">
              / FORMULAR ■
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
              <div className="lg:col-span-3 border border-slate-200 bg-white p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => handleChange('name', event.target.value)}
                        placeholder="Max Mustermann"
                        aria-invalid={Boolean(errors.name)}
                      />
                      {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(event) => handleChange('email', event.target.value)}
                        placeholder="name@example.com"
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Betreff</Label>
                    <Input
                      id="subject"
                      value={data.subject}
                      onChange={(event) => handleChange('subject', event.target.value)}
                      placeholder="Worum geht es?"
                      aria-invalid={Boolean(errors.subject)}
                    />
                    {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nachricht</Label>
                    <Textarea
                      id="message"
                      value={data.message}
                      onChange={(event) => handleChange('message', event.target.value)}
                      placeholder="Schreib uns kurz dein Anliegen..."
                      className="min-h-40"
                      aria-invalid={Boolean(errors.message)}
                    />
                    {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                  </div>

                  {submitMessage && (
                    <div className="rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                      {submitMessage}
                    </div>
                  )}

                  {submitError && (
                    <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                      {submitError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || !isValid}
                    className="h-12 rounded-sm bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                  >
                    {isSubmitting ? 'Senden...' : 'Nachricht absenden'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>

              <aside className="lg:col-span-2 border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Wobei koennen wir helfen?</h2>
                <p className="text-slate-600 mb-8">
                  Unser Team hilft dir bei Fragen zu Turnieranmeldung, Sponsorenmoeglichkeiten und organisatorischen Themen.
                </p>

                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-sm bg-white">
                    <p className="text-sm font-semibold text-slate-900">Turnieranmeldung</p>
                    <p className="text-sm text-slate-600 mt-1">Support bei Registrierung, Warteliste und Teilnahmebedingungen.</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-sm bg-white">
                    <p className="text-sm font-semibold text-slate-900">Sponsoring</p>
                    <p className="text-sm text-slate-600 mt-1">Pakete, Sichtbarkeit und individuelle Partnerschaften.</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-sm bg-white">
                    <p className="text-sm font-semibold text-slate-900">Event-Infos</p>
                    <p className="text-sm text-slate-600 mt-1">Ablauf, Zeitplan, Location und Besucherfragen.</p>
                  </div>
                </div>

                <a href="/faq" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Zur FAQ-Seite
                </a>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <DynamicLogo />
              <p className="mt-6 text-slate-500 text-sm leading-relaxed font-medium">
                Darts-Sport auf hoechstem Niveau in Puschendorf. Organisiert fuer Spieler von Spielern.
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
                <li><a href="/faq" className="hover:text-slate-900 transition-colors">Haeufige Fragen</a></li>
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
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="p-5 border border-slate-200 bg-white">
      <div className="inline-flex items-center justify-center h-10 w-10 border border-slate-200 bg-slate-50 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}