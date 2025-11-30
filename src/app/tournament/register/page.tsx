"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Calendar, Euro, Users, ArrowRight, CreditCard, CheckCircle2, ChevronLeft, Lock, ArrowLeft, XCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  maxPlayers: number;
  entryFee: number;
  status: string;
  _count: { players: number };
}

/* ================= UTILS ================= */

// Spotlight Effect Component for Cards
function SpotlightCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn("group relative border border-slate-200 bg-white overflow-hidden rounded-xl", className)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function TournamentRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'SELECTION' | 'FORM' | 'PAYMENT' | 'SUCCESS'>('SELECTION');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  // Form State
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    // 1. Load Tournaments
    fetch('/api/tournament/public')
      .then(res => res.json())
      .then(data => data.success && setTournaments(data.tournaments));

    // 2. Load Stripe Key
    fetch('/api/admin/tournament/settings')
      .then(res => res.json())
      .then(data => {
        if (data.stripeEnabled && data.stripePublishableKey) {
          setStripePromise(loadStripe(data.stripePublishableKey));
        }
      });

    // 3. Load User Profile (if logged in)
    fetch('/api/user/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.user) {
          setPlayerName(data.user.name || "");
          setEmail(data.user.email || "");
        }
      })
      .catch(() => {}); // Ignore errors if not logged in
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

    // Check if tournament is free
    if (selectedTournament.entryFee === 0) {
      try {
        const res = await fetch('/api/tournament/register/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournamentId: selectedTournament.id,
            playerName,
            email,
            paymentIntentId: null // No payment needed
          }),
        });
        const data = await res.json();
        
        if (data.success) {
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

  /* --- SUB-COMPONENTS (Inline for easier state access) --- */

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
        // Finalize Registration
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
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 transition-colors focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <CardElement options={{
            style: { 
              base: { fontSize: '16px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } } 
            }
          }} />
        </div>
        <Button disabled={!stripe || payLoading} className="w-full h-12 bg-slate-900 text-white hover:bg-black rounded-lg shadow-lg shadow-slate-900/20 text-base font-medium">
          {payLoading ? <Loader2 className="animate-spin" /> : `Jetzt ${selectedTournament?.entryFee}€ bezahlen`}
        </Button>
      </form>
    );
  };

  /* --- RENDER --- */

  return (
    <div className="h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100 overflow-hidden flex flex-col">
      
      {/* Navbar Minimal */}
      <nav className="w-full z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-200/50 shrink-0">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-5 w-5 bg-slate-900 rounded-md" /> Darts Masters
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4 mr-1" /> Abbrechen
          </Button>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: SELECTION */}
          {step === 'SELECTION' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full max-h-full"
            >
              <div className="text-center mb-8 space-y-2 shrink-0">
                <Badge variant="outline" className="px-3 py-1 bg-white border-slate-200 text-slate-500 rounded-full text-xs">
                  Saison 2025
                </Badge>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                  Wähle deine Challenge.
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  Sichere dir deinen Startplatz.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 overflow-y-auto px-2 pb-2">
                {tournaments.map((t, i) => (
                  <SpotlightCard 
                    key={t.id} 
                    className={cn(
                      "w-full md:w-[380px] min-h-[450px] cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 active:scale-95 flex flex-col",
                      t.status !== 'REGISTRATION_OPEN' && "opacity-60 pointer-events-none grayscale"
                    )}
                    onClick={() => handleSelect(t)}
                  >
                    <div className="p-8 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <Badge variant={t.status === 'REGISTRATION_OPEN' ? 'default' : 'secondary'} className={t.status === 'REGISTRATION_OPEN' ? "bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1" : "text-sm px-3 py-1"}>
                          {t.status === 'REGISTRATION_OPEN' ? 'Offen' : 'Geschlossen'}
                        </Badge>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-3 line-clamp-1">{t.name}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                        {t.description || "Ein spannendes Turnier im K.O.-System. Zeig dein Können am Oche."}
                      </p>

                      <div className="space-y-3 pt-6 border-t border-slate-100 mt-auto">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-4 w-4 mr-3 text-slate-400" />
                          {new Date(t.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Users className="h-4 w-4 mr-3 text-slate-400" />
                          {t._count.players} / {t.maxPlayers} Teilnehmer
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-2">
                           <span className="text-2xl font-bold text-slate-900">{t.entryFee}€</span>
                           <span className="text-sm font-medium text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                             Anmelden <ArrowRight className="ml-1 h-4 w-4" />
                           </span>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: FORM & PAYMENT (Unified Layout) */}
          {(step === 'FORM' || step === 'PAYMENT') && selectedTournament && (
            <motion.div
              key="process"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto w-full"
            >
              {/* Progress Indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={cn("flex items-center justify-center w-5 h-5 rounded-full text-[10px]", step === 'FORM' ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600")}>1</span>
                  <span className={step === 'FORM' ? "text-slate-900" : "text-slate-400"}>Daten</span>
                  <div className="w-6 h-[1px] bg-slate-200 mx-2" />
                  <span className={cn("flex items-center justify-center w-5 h-5 rounded-full text-[10px]", step === 'PAYMENT' ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600")}>2</span>
                  <span className={step === 'PAYMENT' ? "text-slate-900" : "text-slate-400"}>Zahlung</span>
                </div>
              </div>

              <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden bg-white">
                <div className="p-6 md:p-8">
                  
                  {/* Selected Item Recap (Visual Ticket Stub) */}
                  <div className="flex flex-row justify-between items-center border-b border-slate-100 pb-6 mb-6 gap-4">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Turnier</div>
                      <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{selectedTournament.name}</h2>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span>{new Date(selectedTournament.startDate).toLocaleDateString('de-DE')}</span>
                        <span>•</span>
                        <span>{selectedTournament.entryFee}€ Startgeld</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1 font-normal border-slate-200 bg-slate-50">
                      {selectedTournament.entryFee}€
                    </Badge>
                  </div>

                  {/* Form Content */}
                  <AnimatePresence mode="wait">
                    {step === 'FORM' ? (
                      <motion.form
                        key="details-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={submitDetails}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 text-sm">Dein Spielername</Label>
                          <Input 
                            value={playerName} 
                            onChange={e => setPlayerName(e.target.value)} 
                            placeholder="z.B. 'The Power'"
                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            required
                            autoFocus
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 text-sm">E-Mail Adresse</Label>
                          <Input 
                            type="email"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="max@beispiel.de"
                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            required
                          />
                        </div>

                        {error && (
                          <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 flex items-center gap-2">
                            <XCircle className="h-3.5 w-3.5" /> {error}
                          </div>
                        )}

                        <div className="pt-2 flex gap-3">
                          <Button type="button" variant="ghost" className="h-10 flex-1 text-slate-500 text-sm" onClick={() => setStep('SELECTION')}>
                            Zurück
                          </Button>
                          <Button type="submit" disabled={loading} className="h-10 flex-[2] bg-slate-900 text-white hover:bg-black rounded-lg shadow-lg shadow-slate-900/20 text-sm font-medium">
                             {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Weiter zur Zahlung"}
                          </Button>
                        </div>
                      </motion.form>
                    ) : (
                      /* PAYMENT STEP */
                      <motion.div
                        key="payment-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs border border-blue-100">
                          <Lock className="h-3 w-3" /> Deine Daten sind sicher und verschlüsselt.
                        </div>

                        {stripePromise && clientSecret && (
                          <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PaymentForm />
                          </Elements>
                        )}
                         
                         <div className="mt-4 text-center">
                           <button 
                             onClick={() => setStep('FORM')} 
                             className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center w-full gap-1"
                            >
                             <ArrowLeft className="h-3 w-3" /> Daten korrigieren
                           </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-green-500/40">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">Du bist dabei!</h1>
              <p className="text-slate-500 text-base mb-8 max-w-md text-center leading-relaxed">
                Deine Anmeldung für <strong>{selectedTournament?.name}</strong> war erfolgreich. Wir haben dir eine Bestätigung an {email} gesendet.
              </p>
              
              <div className="flex gap-3">
                <Button onClick={() => router.push('/user')} className="h-10 px-6 rounded-full bg-slate-900 text-white hover:bg-black text-sm">
                  Zum Dashboard
                </Button>
                <Button variant="outline" onClick={() => { setStep('SELECTION'); setSelectedTournament(null); setPlayerName(""); setEmail(""); }} className="h-10 px-6 rounded-full border-slate-200 text-sm">
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