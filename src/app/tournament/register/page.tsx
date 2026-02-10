"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Calendar, Euro, Users, ArrowRight, CreditCard, CheckCircle2, ChevronLeft, Lock, ArrowLeft, XCircle, MapPin, ChevronDown } from "lucide-react";
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

/* ================= UTILS ================= */

function SpotlightRow({ children, className, onClick, isExpanded }: { children: React.ReactNode; className?: string; onClick?: () => void; isExpanded?: boolean }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative border-b border-slate-200 bg-white overflow-hidden transition-colors hover:bg-slate-50/50",
        isExpanded && "bg-slate-50/30 ring-1 ring-slate-100 border-l-4 border-slate-300",
        className
      )}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
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

    fetch('/api/admin/tournament/settings')
      .then(res => res.json())
      .then(data => {
        setStripeEnabled(!!data.stripeEnabled);
        if (data.stripeEnabled && data.stripePublishableKey) {
          setStripePromise(loadStripe(data.stripePublishableKey));
        }
      });

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
          amount: selectedTournament.entryFee
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setClientSecret(data.clientSecret);
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
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 transition-colors focus-within:bg-white focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-200">
          <CardElement options={{
            style: { base: { fontSize: '16px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } } }
          }} />
        </div>
        <Button disabled={!stripe || payLoading} className="w-full h-12 bg-slate-900 text-white hover:bg-black rounded-lg shadow-lg shadow-slate-900/20 text-base font-medium">
          {payLoading ? <Loader2 className="animate-spin" /> : `Jetzt ${selectedTournament?.entryFee}€ bezahlen`}
        </Button>
      </form>
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="h-screen bg-[#FAFAFA] text-slate-900 selection:bg-slate-200 overflow-hidden flex flex-col">
      <nav className="w-full z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-200/50 shrink-0">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer" onClick={() => router.push('/')}>
            <DynamicLogo />
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4 mr-1" /> Abbrechen
          </Button>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          
          {step === 'SELECTION' && (
            <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} className="flex flex-col h-full min-h-0">
              <div className="text-center mb-6 space-y-2 shrink-0">
                <Badge variant="outline" className="px-3 py-1 bg-white border-slate-200 text-slate-500 rounded-full text-xs">Saison 2026</Badge>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  Wähle deine <span className="text-slate-400"><br></br>Challenge</span>
                </h1>

              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="col-span-6">Turnier</div>
                      <div className="col-span-2 text-center">Datum</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-right">Startgeld</div>
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-100 min-h-[36vh] max-h-[60vh]">
                      {tournaments.map((t) => {
                        const isExpanded = expandedIds.includes(t.id);
                        const isFull = t._count.players >= t.maxPlayers || t.status === 'WAITLIST';
                        const isClosed = t.status !== 'REGISTRATION_OPEN' && t.status !== 'WAITLIST';

                        return (
                          <SpotlightRow key={t.id} isExpanded={isExpanded} className={cn(isClosed && "opacity-60 pointer-events-none grayscale")} onClick={() => {
                            if (isClosed) return;
                            setExpandedIds(prev => {
                              const topId = tournaments[0]?.id;
                              if (prev.includes(t.id)) {
                                // collapse, but never collapse top
                                if (t.id === topId) return prev;
                                return prev.filter(id => id !== t.id);
                              }
                              return [...prev, t.id];
                            });
                          }}>
                            <div className="px-6 md:px-8 py-5 cursor-pointer">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="col-span-6 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0"><Trophy className="h-5 w-5" /></div>
                                  <div>
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">{t.name}</h3>
                                    <div className="md:hidden flex items-center gap-3 mt-1 text-xs text-slate-500">
                                      <span>{new Date(t.startDate).toLocaleDateString('de-DE')}</span>
                                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      <span>{t.entryFee}€</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="hidden md:block col-span-2 text-center text-sm text-slate-600">{new Date(t.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</div>
                                <div className="hidden md:flex col-span-2 justify-center">
                                  <Badge variant={t.status === 'REGISTRATION_OPEN' ? 'default' : 'secondary'} className={cn("text-[10px] px-2 py-0.5 uppercase tracking-tighter", t.status === 'REGISTRATION_OPEN' ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500")}>
                                    {t.status === 'REGISTRATION_OPEN' ? (isFull ? 'Warteliste' : 'Offen') : 'Ende'}
                                  </Badge>
                                </div>
                                <div className="hidden md:flex col-span-2 items-center justify-end gap-4">
                                  <span className="font-bold text-slate-900">{t.entryFee}€</span>
                                  <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="pt-6 pb-2 grid grid-cols-1 md:grid-cols-12 gap-6">
                                      <div className="md:col-span-8 space-y-4">
                                        <p className="text-sm text-slate-500 leading-relaxed">{t.description || "Ein spannendes Turnier im K.O.-System. Zeig dein Können am Oche."}</p>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                                          <div className="flex items-center text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" />{t.location || "Location folgt"}</div>
                                          <div className="flex items-center text-xs text-slate-600"><Users className="h-3.5 w-3.5 mr-2 text-slate-400" />{t._count.players} / {t.maxPlayers} Teilnehmer</div>
                                        </div>
                                      </div>
                                      <div className="md:col-span-4 flex items-end justify-end">
                                        <Button onClick={(e) => { e.stopPropagation(); handleSelect(t); }} className={cn("w-full md:w-auto bg-slate-900 text-white hover:bg-black rounded-lg shadow-lg shadow-slate-900/10 px-6", isExpanded ? "text-sm font-semibold py-3" : "text-xs font-medium")}>
                                          {isFull ? 'Zur Warteliste' : 'Anmelden'} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </SpotlightRow>
                        );
                      })}

                      {/* If there are few tournaments, show an informative filler */}
                      {tournaments.length === 0 && (
                        <div className="p-8 text-center text-slate-500">Keine Turniere verfügbar.</div>
                      )}

                      {tournaments.length > 0 && tournaments.length < 4 && (
                        <div className="p-6 border-t border-slate-100 text-slate-600 text-sm">Weitere Turniere werden bald angekündigt — schau später wieder vorbei oder folge uns auf Social Media.</div>
                      )}

                      {/* Scroll hint for clarity */}


                    </div>
                  </div>
            </motion.div>
          )}

          {(step === 'FORM' || step === 'PAYMENT' || step === 'PAY_ON_SITE') && selectedTournament && (
            <motion.div key="process" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="max-w-xl mx-auto w-full">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={cn("flex items-center justify-center w-5 h-5 rounded-full text-[10px]", step === 'FORM' ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600")}>1</span>
                  <span className={step === 'FORM' ? "text-slate-900" : "text-slate-400"}>Daten</span>
                  <div className="w-6 h-[1px] bg-slate-200 mx-2" />
                  <span className={cn("flex items-center justify-center w-5 h-5 rounded-full text-[10px]", (step === 'PAYMENT' || step === 'PAY_ON_SITE') ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600")}>2</span>
                  <span className={(step === 'PAYMENT' || step === 'PAY_ON_SITE') ? "text-slate-900" : "text-slate-400"}>{step === 'PAY_ON_SITE' ? 'Bestätigung' : 'Zahlung'}</span>
                </div>
              </div>
              <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden bg-white">
                <div className="p-6 md:p-8">
                  <div className="flex flex-row justify-between items-center border-b border-slate-100 pb-6 mb-6 gap-4">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Turnier</div>
                      <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{selectedTournament.name}</h2>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span>{new Date(selectedTournament.startDate).toLocaleDateString('de-DE')}</span>
                        <span>•</span>
                        <span>{selectedTournament.entryFee}€</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1 font-normal border-slate-200 bg-slate-50">{selectedTournament.entryFee}€</Badge>
                  </div>
                  <AnimatePresence mode="wait">
                    {step === 'FORM' ? (
                      <motion.form key="details-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={submitDetails} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 text-sm">Vor- und Nachname</Label>
                          <Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="z.B. Max Mustermann" className="h-10 bg-slate-50 border-slate-200" required autoFocus />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 text-sm">E-Mail Adresse</Label>
                          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max@beispiel.de" className="h-10 bg-slate-50 border-slate-200" required />
                        </div>
                        {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 flex items-center gap-2"><XCircle className="h-3.5 w-3.5" /> {error}</div>}
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <Button type="button" variant="ghost" className="h-10 w-full sm:flex-1 text-slate-500" onClick={() => setStep('SELECTION')}>Zurück</Button>
                          <Button type="submit" disabled={loading} className="h-10 w-full sm:flex-[2] bg-slate-900 text-white hover:bg-black rounded-lg shadow-lg shadow-slate-900/20 text-sm font-medium">
                             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (isWaitingListSuccess ? "Auf Warteliste setzen" : (stripeEnabled ? "Weiter zur Zahlung" : "Weiter zur Bestätigung"))}
                          </Button>
                        </div>
                      </motion.form>
                    ) : step === 'PAYMENT' ? (
                      <motion.div key="payment-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 text-slate-700 rounded-lg text-xs border border-slate-100"><Lock className="h-3 w-3" /> Deine Daten sind sicher und verschlüsselt.</div>
                        {stripePromise && clientSecret && (
                          <Elements stripe={stripePromise} options={{ clientSecret }}><PaymentForm /></Elements>
                        )}
                        <button onClick={() => setStep('FORM')} className="mt-4 text-xs text-slate-400 hover:text-slate-600 w-full flex justify-center gap-1"><ArrowLeft className="h-3 w-3" /> Daten korrigieren</button>
                      </motion.div>
                    ) : (
                      <motion.div key="pay-on-site" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-4"><Euro className="h-6 w-6" /></div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Zahlung vor Ort</h3>
                          <p className="text-sm text-slate-600 mb-4">Das Startgeld von <strong>{selectedTournament.entryFee}€</strong> wird am Turniertag vor Ort in bar beglichen.</p>
                        </div>
                        {error && <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 flex items-center gap-2"><XCircle className="h-3.5 w-3.5" /> {error}</div>}
                        <Button onClick={handlePayOnSiteRegistration} disabled={loading} className="w-full h-12 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20 text-base font-medium">{loading ? <Loader2 className="animate-spin" /> : "Kostenpflichtig anmelden"}</Button>
                        <button onClick={() => setStep('FORM')} className="text-xs text-slate-400 hover:text-slate-600 w-full flex justify-center gap-1"><ArrowLeft className="h-3 w-3" /> Daten korrigieren</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full">
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl", isWaitingListSuccess ? "bg-amber-500 shadow-amber-500/40" : "bg-green-500 shadow-green-500/40")}>
                {isWaitingListSuccess ? <Users className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">{isWaitingListSuccess ? "Du bist auf der Warteliste!" : "Du bist dabei!"}</h1>
              <p className="text-slate-500 text-base mb-8 max-w-md text-center leading-relaxed">
                {isWaitingListSuccess ? <span>Du wurdest erfolgreich auf die Warteliste für <strong>{selectedTournament?.name}</strong> gesetzt.</span> : <span>Deine Anmeldung für <strong>{selectedTournament?.name}</strong> war erfolgreich.</span>}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push('/user')} className="h-10 px-6 rounded-full bg-slate-900 text-white hover:bg-black text-sm">Zum Dashboard</Button>
                <Button variant="outline" onClick={() => { setStep('SELECTION'); setPlayerName(""); setEmail(""); setError(null); setLoading(false); setClientSecret(""); setIsWaitingListSuccess(false); }} className="h-10 px-6 rounded-full border-slate-200 text-sm">Weitere Anmeldung</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}