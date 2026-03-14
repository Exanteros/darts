"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Calendar, Euro, Users, ArrowRight, CreditCard, CheckCircle2, ChevronLeft, Lock, ArrowLeft, XCircle, MapPin, ChevronDown, Target } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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
  street?: string;
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

  useEffect(() => {
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

    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.user) {
          setPlayerName(data.user.name || "");
          setEmail(data.user.email || "");
        }
      })
      .catch(() => {});
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
      const res = await fetch('/api/tournament/register/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament?.id,
          playerName,
          email,
          paymentIntentId: null
        }),
      });
      const data = await res.json();
      if (data.success) setStep('SUCCESS');
      else setError(data.message || "Fehler bei der Anmeldung");
    } catch (err) {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  /* --- PAYMENT COMPONENT --- */

  const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [payLoading, setPayLoading] = useState(false);

    const handlePay = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setPayLoading(true);
      
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: playerName, email }
        }
      });

      if (stripeError) {
        setError(stripeError.message || "Zahlung fehlgeschlagen");
        setPayLoading(false);
      } else if (paymentIntent?.status === 'succeeded') {
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
        <div className="p-4 rounded-sm border border-slate-200 bg-slate-50 transition-colors focus-within:bg-white focus-within:border-slate-400">
          <div className="mb-4 space-y-1 rounded-sm border bg-white p-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Startgebühr</span>
              <span>{(paymentAmountDetails?.baseAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Stripe-Transaktionskosten</span>
              <span>{(paymentAmountDetails?.feeAmount ?? 0).toFixed(2)}€</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold text-foreground">
              <span>Gesamt</span>
              <span>{(paymentAmountDetails?.totalAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€</span>
            </div>
          </div>
          <CardElement options={{
            style: { base: { fontSize: '16px', color: '#0f172a', '::placeholder': { color: '#94a3b8' }, fontFamily: 'monospace' } }
          }} />
        </div>
        <Button disabled={!stripe || payLoading} className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-sm text-lg font-semibold">
          {payLoading ? <Loader2 className="animate-spin" /> : `Jetzt ${(paymentAmountDetails?.totalAmount ?? selectedTournament?.entryFee ?? 0).toFixed(2)}€ bezahlen`}
        </Button>
      </form>
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="min-h-screen bg-white text-slate-900 selection:bg-slate-200 flex flex-col">
      <nav className="w-full z-50 bg-white border-b border-slate-200 shrink-0">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => router.push('/')}>
            <DynamicLogo />
          </div>
          <Button variant="ghost" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900 rounded-sm font-semibold">
            <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-6 py-8 md:py-12 max-w-5xl flex flex-col">
        <AnimatePresence mode="wait">
          
          {step === 'SELECTION' && (
            <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col h-full">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-sm uppercase tracking-widest">
                  / SAISON 2026 ■
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                  Wähle deine <br />
                  <span className="text-slate-400">Challenge</span>
                </h1>
              </div>

              <div className="border border-slate-200 rounded-sm bg-white flex flex-col">
                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-400 uppercase tracking-widest">
                  <div className="col-span-6">Turnier</div>
                  <div className="col-span-2 text-center">Datum</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-right">Startgeld</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {tournaments.map((t) => {
                    const isExpanded = expandedIds.includes(t.id);
                    const isFull = t._count.players >= t.maxPlayers || t.status === 'WAITLIST';
                    const isClosed = t.status !== 'REGISTRATION_OPEN' && t.status !== 'WAITLIST';

                    return (
                      <div 
                        key={t.id} 
                        className={cn(
                          "group relative bg-white transition-colors hover:bg-slate-50",
                          isExpanded && "bg-slate-50",
                          isClosed && "opacity-60 pointer-events-none grayscale"
                        )}
                        onClick={() => {
                          if (isClosed) return;
                          setExpandedIds(prev => {
                            const topId = tournaments[0]?.id;
                            if (prev.includes(t.id)) {
                              if (t.id === topId) return prev;
                              return prev.filter(id => id !== t.id);
                            }
                            return [...prev, t.id];
                          });
                        }}
                      >
                        <div className="px-4 md:px-6 py-4 cursor-pointer">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="col-span-6 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-sm bg-slate-900 flex items-center justify-center text-white shrink-0">
                                <Target className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight">{t.name}</h3>
                                <div className="md:hidden flex items-center gap-3 mt-1 text-xs font-mono text-slate-500">
                                  <span>{new Date(t.startDate).toLocaleDateString('de-DE')}</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                  <span>{t.entryFee}€</span>
                                </div>
                              </div>
                            </div>
                            <div className="hidden md:block col-span-2 text-center text-sm font-mono text-slate-600">
                              {new Date(t.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="hidden md:flex col-span-2 justify-center">
                              <div className={cn(
                                "text-[10px] font-mono px-2 py-1 uppercase tracking-widest border rounded-sm", 
                                t.status === 'REGISTRATION_OPEN' 
                                  ? (isFull ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200") 
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              )}>
                                {t.status === 'REGISTRATION_OPEN' ? (isFull ? 'Warteliste' : 'Offen') : 'Ende'}
                              </div>
                            </div>
                            <div className="hidden md:flex col-span-2 items-center justify-end gap-4">
                              <span className="font-bold text-slate-900 text-lg">{t.entryFee}€</span>
                              <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="pt-4 pb-2 grid grid-cols-1 md:grid-cols-12 gap-6">
                                  <div className="md:col-span-8 space-y-4">
                                    <p className="text-sm text-slate-600 leading-relaxed">{t.description || "Ein spannendes Turnier im K.O.-System. Zeig dein Können am Oche."}</p>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                      <div className="flex items-center text-xs font-mono text-slate-500 uppercase tracking-wider">
                                        <MapPin className="h-3 w-3 mr-2 text-slate-400" />
                                        {t.location || "Location folgt"}
                                      </div>
                                      <div className="flex items-center text-xs font-mono text-slate-500 uppercase tracking-wider">
                                        <Users className="h-3 w-3 mr-2 text-slate-400" />
                                        {t._count.players} / {t.maxPlayers}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="md:col-span-4 flex items-end justify-end">
                                    <Button 
                                      onClick={(e) => { e.stopPropagation(); handleSelect(t); }} 
                                      className="w-full md:w-auto h-10 bg-slate-900 text-white hover:bg-slate-800 rounded-sm px-6 font-semibold text-sm"
                                    >
                                      {isFull ? 'Zur Warteliste' : 'Anmelden'} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}

                  {tournaments.length === 0 && (
                    <div className="p-12 text-center text-slate-500 font-mono text-sm uppercase tracking-widest">
                      Keine Turniere verfügbar.
                    </div>
                  )}

                  {tournaments.length > 0 && tournaments.length < 4 && (
                    <div className="p-6 bg-slate-50 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                      Weitere Turniere werden bald angekündigt.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {(step === 'FORM' || step === 'PAYMENT' || step === 'PAY_ON_SITE') && selectedTournament && (
            <motion.div key="process" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto w-full">
              <div className="flex justify-center mb-12">
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
                  <div className={cn("flex items-center gap-2", step === 'FORM' ? "text-slate-900 font-bold" : "text-slate-400")}>
                    <span className={cn("flex items-center justify-center w-6 h-6 rounded-sm border", step === 'FORM' ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200")}>1</span>
                    DATEN
                  </div>
                  <div className="w-12 h-[1px] bg-slate-200" />
                  <div className={cn("flex items-center gap-2", (step === 'PAYMENT' || step === 'PAY_ON_SITE') ? "text-slate-900 font-bold" : "text-slate-400")}>
                    <span className={cn("flex items-center justify-center w-6 h-6 rounded-sm border", (step === 'PAYMENT' || step === 'PAY_ON_SITE') ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200")}>2</span>
                    {step === 'PAY_ON_SITE' ? 'BESTÄTIGUNG' : 'ZAHLUNG'}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-white rounded-sm p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-8 mb-8 gap-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">/ TURNIER ■</div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{selectedTournament.name}</h2>
                    <div className="flex gap-3 mt-2 text-sm font-mono text-slate-500">
                      <span>{new Date(selectedTournament.startDate).toLocaleDateString('de-DE')}</span>
                      <span>•</span>
                      <span>{selectedTournament.entryFee}€</span>
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                    {selectedTournament.entryFee}€
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 'FORM' ? (
                    <motion.form key="details-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={submitDetails} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-slate-900 font-semibold">Vor- und Nachname</Label>
                        <Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="z.B. Max Mustermann" className="h-12 rounded-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-900" required autoFocus />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-900 font-semibold">E-Mail Adresse</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max@beispiel.de" className="h-12 rounded-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-900" required />
                      </div>
                      {error && (
                        <div className="p-4 rounded-sm bg-red-50 text-red-700 text-sm border border-red-200 flex items-center gap-2 font-medium">
                          <XCircle className="h-5 w-5" /> {error}
                        </div>
                      )}
                      <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <Button type="button" variant="outline" className="h-14 w-full sm:w-1/3 rounded-sm border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold" onClick={() => setStep('SELECTION')}>
                          Zurück
                        </Button>
                        <Button type="submit" disabled={loading} className="h-14 w-full sm:w-2/3 bg-slate-900 text-white hover:bg-slate-800 rounded-sm text-lg font-semibold">
                           {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isWaitingListSuccess ? "Auf Warteliste setzen" : (stripeEnabled ? "Weiter zur Zahlung" : "Weiter zur Bestätigung"))}
                        </Button>
                      </div>
                    </motion.form>
                  ) : step === 'PAYMENT' ? (
                    <motion.div key="payment-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="flex items-center gap-2 mb-8 p-4 bg-slate-50 text-slate-700 rounded-sm text-sm border border-slate-200 font-mono">
                        <Lock className="h-4 w-4" /> Sichere und verschlüsselte Zahlung.
                      </div>
                      {stripePromise && clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}><PaymentForm /></Elements>
                      )}
                      <button onClick={() => setStep('FORM')} className="mt-8 text-sm font-mono text-slate-400 hover:text-slate-900 w-full flex justify-center items-center gap-2 uppercase tracking-widest transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Daten korrigieren
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="pay-on-site" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div className="p-8 bg-slate-50 rounded-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-white border border-slate-200 text-slate-900 rounded-sm flex items-center justify-center mx-auto mb-6">
                          <Euro className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Zahlung vor Ort</h3>
                        <p className="text-base text-slate-600">Das Startgeld von <strong className="text-slate-900">{selectedTournament.entryFee}€</strong> wird am Turniertag vor Ort in bar beglichen.</p>
                      </div>
                      {error && (
                        <div className="p-4 rounded-sm bg-red-50 text-red-700 text-sm border border-red-200 flex items-center gap-2 font-medium">
                          <XCircle className="h-5 w-5" /> {error}
                        </div>
                      )}
                      <Button onClick={handlePayOnSiteRegistration} disabled={loading} className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-sm text-lg font-semibold">
                        {loading ? <Loader2 className="animate-spin" /> : "Kostenpflichtig anmelden"}
                      </Button>
                      <button onClick={() => setStep('FORM')} className="text-sm font-mono text-slate-400 hover:text-slate-900 w-full flex justify-center items-center gap-2 uppercase tracking-widest transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Daten korrigieren
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className={cn(
                "w-24 h-24 rounded-sm flex items-center justify-center text-white mb-8", 
                isWaitingListSuccess ? "bg-amber-500" : "bg-slate-900"
              )}>
                {isWaitingListSuccess ? <Users className="h-12 w-12" /> : <CheckCircle2 className="h-12 w-12" />}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 text-center tracking-tighter">
                {isWaitingListSuccess ? "Auf der Warteliste!" : "Du bist dabei!"}
              </h1>
              <p className="text-slate-600 text-lg mb-12 max-w-md text-center leading-relaxed">
                {isWaitingListSuccess 
                  ? <span>Du wurdest erfolgreich auf die Warteliste für <strong className="text-slate-900">{selectedTournament?.name}</strong> gesetzt.</span> 
                  : <span>Deine Anmeldung für <strong className="text-slate-900">{selectedTournament?.name}</strong> war erfolgreich.</span>}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button onClick={() => router.push('/user')} className="h-14 px-8 rounded-sm bg-slate-900 text-white hover:bg-slate-800 text-lg font-semibold w-full sm:w-auto">
                  Zum Dashboard
                </Button>
                <Button variant="outline" onClick={() => { setStep('SELECTION'); setPlayerName(""); setEmail(""); setError(null); setLoading(false); setClientSecret(""); setIsWaitingListSuccess(false); }} className="h-14 px-8 rounded-sm border-slate-200 text-slate-900 hover:bg-slate-50 text-lg font-semibold w-full sm:w-auto">
                  Weitere Anmeldung
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
