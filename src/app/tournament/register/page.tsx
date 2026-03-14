"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Euro, Users, ArrowRight, CheckCircle2,
  Lock, ArrowLeft, XCircle, MapPin, ChevronDown,
  Target, ChevronLeft, Calendar, Trophy, Zap
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils";
import DynamicLogo from "@/components/DynamicLogo";

/* ================= TYPES ================= */

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  maxPlayers: number;
  entryFee: number;
  location?: string;
  street?: string; // Original Detail
  status: string;
  _count: { players: number };
}

interface PaymentAmountDetails {
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
}

/* ================= MAIN COMPONENT ================= */

export default function TournamentRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'SELECTION' | 'FORM' | 'PAYMENT' | 'PAY_ON_SITE' | 'SUCCESS'>('SELECTION');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Form State
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentAmountDetails, setPaymentAmountDetails] = useState<PaymentAmountDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingListSuccess, setIsWaitingListSuccess] = useState(false);

  // Stripe
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  /* --- API CALLS (STRICTLY FROM ORIGINAL) --- */

  useEffect(() => {
    // 1. /api/tournament/public
    fetch('/api/tournament/public')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setTournaments(data.tournaments);
          if (data.tournaments && data.tournaments.length > 0) {
            setExpandedIds([data.tournaments[0].id]);
          }
        }
      });

    // 2. /api/stripe/config
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setStripeEnabled(!!data.stripeEnabled);
          if (data.stripeEnabled && data.stripePublishableKey) {
            setStripePromise(loadStripe(data.stripePublishableKey));
          }
        }
      })
      .catch(err => console.error("Error loading stripe config", err));

    // 3. /api/user/profile
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.user) {
          setPlayerName(data.user.name || "");
          setEmail(data.user.email || "");
        }
      })
      .catch(() => { });
  }, []);

  /* --- ACTIONS --- */

  const handleSelect = (t: Tournament) => {
    setSelectedTournament(t);
    setStep('FORM');
    setError(null);
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    setLoading(true);
    setError(null);

    const isFull = selectedTournament._count.players >= selectedTournament.maxPlayers || selectedTournament.status === 'WAITLIST';

    // PATH: Free or Full -> /api/tournament/register/public
    if (selectedTournament.entryFee === 0 || isFull) {
      try {
        const res = await fetch('/api/tournament/register/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament.id,
            playerName,
            email,
            paymentIntentId: null
          }),
        });
        const data = await res.json();

        if (data.success) {
          setIsWaitingListSuccess(!!(data.message && data.message.includes('Warteliste')));
          setStep('SUCCESS');
        } else {
          setError(data.message || "Fehler bei der Anmeldung");
        }
      } catch (err) {
        setError("Verbindungsfehler");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!stripeEnabled) {
      setStep('PAY_ON_SITE');
      setLoading(false);
      return;
    }

    // PATH: Paid -> /api/stripe/create-payment-intent
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          playerName,
          email,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setClientSecret(data.clientSecret);
        setPaymentAmountDetails(data.amountDetails || null);
        setStep('PAYMENT');
      } else {
        setError(data.message || "Fehler bei der Initialisierung");
      }
    } catch (err) {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnSiteRegistration = async () => {
    setLoading(true);
    try {
      // /api/tournament/register/public with payOnSite
      const res = await fetch('/api/tournament/register/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament?.id,
          playerName,
          email,
          payOnSite: true
        }),
      });
      const data = await res.json();

      if (data.success) {
        setIsWaitingListSuccess(data.isWaitingList || false);
        setStep('SUCCESS');
      } else {
        setError(data.message || "Anmeldung fehlgeschlagen");
      }
    } catch (err) {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  /* --- STRIPE SUB-COMPONENT --- */

  const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [payLoading, setPayLoading] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<any>(null);

    const handlePay = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setPayLoading(true);

      const card = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card!,
          billing_details: { name: playerName, email }
        }
      });

      if (stripeError) {
        setError(stripeError.message || "Zahlung fehlgeschlagen");
        setPayLoading(false);
      } else if (paymentIntent?.status === 'succeeded') {
        // Final Registration: /api/tournament/register/public
        await fetch('/api/tournament/register/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament?.id,
            playerName,
            email,
            paymentIntentId: paymentIntent.id
          }),
        });
        setStep('SUCCESS');
      }
    };

    return (
      <form onSubmit={handlePay} className="space-y-6">
        <div className="bg-slate-900 rounded-sm p-6 text-white mb-6">
          <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase mb-4"><span>Posten</span><span>Betrag</span></div>
          <div className="flex justify-between text-sm mb-2"><span>Startgebühr</span><span>{(paymentAmountDetails?.baseAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€</span></div>
          <div className="flex justify-between text-sm mb-4"><span>Gebühren</span><span>{(paymentAmountDetails?.feeAmount ?? 0).toFixed(2)}€</span></div>
          <div className="flex justify-between font-black text-2xl border-t border-white/10 pt-4"><span>Gesamt</span><span>{(paymentAmountDetails?.totalAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€</span></div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-mono font-bold uppercase text-slate-400">Kartendaten</Label>
          <div className="p-4 border rounded-sm bg-white shadow-sm">
            <CardElement options={{ style: { base: { fontSize: '16px', fontFamily: 'monospace', color: '#0f172a' } } }} />
          </div>
        </div>

        <Button disabled={!stripe || payLoading} className="w-full h-14 bg-slate-900 text-white font-black text-lg">
          {payLoading ? <Loader2 className="animate-spin" /> : `Jetzt ${(paymentAmountDetails?.totalAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€ bezahlen`}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-slate-200 h-16 md:h-20">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-full flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => router.push('/')}><DynamicLogo /></div>
          <Button variant="ghost" onClick={() => router.push('/')} className="rounded-sm font-mono text-xs font-bold uppercase tracking-widest px-4">
            <ChevronLeft size={14} className="mr-2" /> Zurück
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row">
        <AnimatePresence mode="wait">

          {step === 'SELECTION' && (
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row w-full">

              {/* Sidebar Desktop - Hobby Turnier Edition */}
              <div className="w-full lg:w-[450px] bg-slate-900 p-8 md:p-12 text-white flex flex-col border-r border-white/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-8">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">Community & Fun</span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] mb-8">
                    GAME <br /> ON! <br /> <span className="text-slate-500 italic">VIEL GLÜCK.</span>
                  </h1>

                  <div className="space-y-6 mb-12">
                    <p className="text-slate-400 text-sm font-mono leading-relaxed">
                      Egal ob du zum ersten Mal am Oche stehst oder der Champion deiner Stammkneipe bist – bei uns zählt vor allem der Spaß am Spiel.
                    </p>
                  </div>

                  <div className="space-y-8">

                    <div className="flex gap-4 items-start group">
                      <div className="w-10 h-10 border border-white/20 rounded-sm flex items-center justify-center shrink-0 group-hover:border-blue-400 transition-colors">
                        <Zap size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Best-of-Vibe</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Faire Spiele, gute Musik und Kaltgetränke. Wir sorgen für den perfekten Rahmen.</div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start group">
                      <div className="w-10 h-10 border border-white/20 rounded-sm flex items-center justify-center shrink-0 group-hover:border-green-400 transition-colors">
                        <Lock size={18} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Stressfrei Anmelden</div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Sicherer Platz in 2 Minuten. Bezahl einfach und sicher via Stripe oder vor Ort.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer-Info in der Sidebar */}
                <div className="mt-auto pt-8 opacity-20 hidden lg:block">
                  <div className="text-[9px] font-mono uppercase tracking-[0.3em]">
                    Dart-Community • Saison 2026 • Jeder ist willkommen
                  </div>
                </div>
              </div>

              {/* Tournament List */}
              <div className="flex-1 bg-white p-4 md:p-12 lg:p-20">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-12 border-b pb-6">
                    <h2 className="text-3xl font-black tracking-tight uppercase">Turniere</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {tournaments.map((t) => {
                      const isExpanded = expandedIds.includes(t.id);
                      const isFull = t._count.players >= t.maxPlayers || t.status === 'WAITLIST';
                      return (
                        <div key={t.id} className={cn("border rounded-sm transition-all duration-300", isExpanded ? "border-slate-900 bg-white shadow-xl" : "border-slate-100 hover:border-slate-300")}>
                          <div className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6" onClick={() => setExpandedIds(prev => prev.includes(t.id) ? (t.id === tournaments[0]?.id ? prev : prev.filter(id => id !== t.id)) : [...prev, t.id])}>
                            <div className="flex items-center gap-6">
                              <div className={cn("w-14 h-14 flex items-center justify-center rounded-sm", isExpanded ? "bg-slate-900 text-white" : "bg-slate-50")}><Target size={24} /></div>
                              <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{t.name}</h3>
                                <div className="flex gap-4 mt-2 font-mono text-[10px] font-bold text-slate-400 uppercase">
                                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.startDate).toLocaleDateString('de-DE')}</span>
                                  <span className="flex items-center gap-1"><Users size={12} /> {t._count.players}/{t.maxPlayers}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-10">
                              <div className="text-right">
                                <div className="text-[10px] font-mono text-slate-400 uppercase">Entry</div>
                                <div className="text-2xl font-black">{t.entryFee}€</div>
                              </div>
                              <ChevronDown className={cn("transition-transform", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                                <div className="p-6 md:p-8 border-t border-slate-200/50">
                                  <p className="text-slate-600 mb-8 max-w-xl">{t.description || "Ein spannendes Dart-Event. Melde dich jetzt an."}</p>
                                  <div className="flex flex-col sm:flex-row gap-4">
                                    <Button onClick={() => handleSelect(t)} className="flex-1 h-14 bg-slate-900 text-white font-bold text-lg rounded-sm uppercase tracking-tighter">
                                      {isFull ? 'Warteliste beitreten' : 'Anmelden'}
                                    </Button>
                                    <div className="hidden sm:flex flex-1 gap-2">
                                      <div className="flex-1 border border-slate-200 p-2 text-center rounded-sm"><div className="text-[9px] font-mono uppercase text-slate-400">Location</div><div className="text-xs font-bold uppercase truncate">{t.location || 'TBA'}</div></div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {(step === 'FORM' || step === 'PAYMENT' || step === 'PAY_ON_SITE') && selectedTournament && (
            <motion.div key="process" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white border border-slate-200 p-6 md:p-12 rounded-sm shadow-2xl">

                <div className="mb-10 border-b pb-8">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">Turnieranmeldung</div>
                  <h2 className="text-3xl font-black tracking-tighter leading-none mb-4">{selectedTournament.name}</h2>
                  <div className="flex gap-4 text-xs font-mono font-bold uppercase text-slate-400">
                    <span className="text-slate-900">{selectedTournament.entryFee}€ Startgeld</span>
                  </div>
                </div>

                {step === 'FORM' ? (
                  <form onSubmit={submitDetails} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-mono font-bold uppercase text-slate-500">Vollständiger Name</Label>
                      <Input value={playerName} onChange={e => setPlayerName(e.target.value)} required placeholder="MAX MUSTERMANN" className="h-14 bg-slate-50 border-slate-200 text-lg font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-mono font-bold uppercase text-slate-500">E-Mail Adresse</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="MAX@EXAMPLE.COM" className="h-14 bg-slate-50 border-slate-200 text-lg font-bold" />
                    </div>
                    {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 font-mono text-[10px] uppercase font-black"><XCircle size={14} className="inline mr-2" /> {error}</div>}
                    <Button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white font-black text-xl active:scale-95 transition-all">
                      {loading ? <Loader2 className="animate-spin" /> : "WEITER"}
                    </Button>
                    <button type="button" onClick={() => setStep('SELECTION')} className="w-full text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-4">Abbrechen</button>
                  </form>
                ) : step === 'PAYMENT' ? (
                  <div className="space-y-8">
                    {stripePromise && clientSecret && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm />
                      </Elements>
                    )}
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-mono">Oder</span></div>
                    </div>
                    
                    <Button variant="outline" onClick={() => setStep('PAY_ON_SITE')} className="w-full h-14 border-slate-200 text-slate-900 font-bold uppercase hover:bg-slate-50">
                      <Euro size={16} className="mr-2" /> Bar vor Ort bezahlen
                    </Button>

                    <button onClick={() => setStep('FORM')} className="w-full text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-4"><ArrowLeft size={10} className="inline mr-2" /> Zurück</button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-10">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-inner"><Euro size={32} /></div>
                    <p className="text-slate-600 font-medium">Bitte bring die <strong className="text-slate-900 font-black">{selectedTournament.entryFee}€</strong> am Turniertag passend in Bar mit.</p>
                    <Button onClick={handlePayOnSiteRegistration} disabled={loading} className="w-full h-16 bg-slate-900 text-white font-black text-xl">
                      {loading ? <Loader2 className="animate-spin" /> : "JETZT KOSTENPFLICHTIG ANMELDEN"}
                    </Button>
                    <button onClick={() => setStep('FORM')} className="w-full text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">Zurück</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className={cn("w-32 h-32 rounded-sm flex items-center justify-center text-white mb-10 shadow-2xl", isWaitingListSuccess ? "bg-amber-500 shadow-amber-500/20" : "bg-slate-900 shadow-slate-900/40")}>
                {isWaitingListSuccess ? <Users size={56} /> : <CheckCircle2 size={56} />}
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none uppercase">
                {isWaitingListSuccess ? "Warteliste!" : "READY!"}
              </h1>
              <p className="text-slate-500 text-lg md:text-2xl mb-12 max-w-xl mx-auto font-medium">
                Du bist für <span className="text-slate-900 font-bold">{selectedTournament?.name}</span> angemeldet. Eine Bestätigung wurde an <span className="text-slate-900 font-bold">{email}</span> gesendet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Button onClick={() => router.push('/user')} className="h-16 px-12 bg-slate-900 text-white text-xl font-black rounded-sm shadow-xl active:scale-95 transition-all">DASHBOARD</Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="h-16 px-12 border-slate-200 text-slate-900 text-xl font-black rounded-sm active:scale-95 transition-all">NOCHMAL</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}