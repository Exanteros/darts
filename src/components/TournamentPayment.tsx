"use client";

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface TournamentPaymentProps {
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  onSuccess?: () => void;
}

interface PaymentAmountDetails {
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stripePublishableKey) {
          return loadStripe(data.stripePublishableKey);
        }
        return null;
      })
      .catch(() => null);
  }
  return stripePromise;
}

function PaymentForm({ 
  tournamentId, 
  tournamentName, 
  entryFee,
  amountDetails,
  clientSecret,
  playerName,
  email 
}: { 
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  amountDetails: PaymentAmountDetails | null;
  clientSecret: string;
  playerName: string;
  email: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);

  useEffect(() => {
    if (!stripe || !amountDetails || !clientSecret) return;

    try {
      const totalAmount = Math.round(((amountDetails?.totalAmount ?? entryFee) || 0) * 100);
      const pr = stripe.paymentRequest({
        country: 'DE',
        currency: 'eur',
        total: {
          label: tournamentName,
          amount: totalAmount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result: any) => {
        if (result) {
          setPaymentRequest(pr);
          setCanUsePaymentRequest(true);

          pr.on('paymentmethod', async (ev: any) => {
            setIsProcessing(true);
            try {
              const confirm = await stripe.confirmCardPayment(clientSecret, {
                payment_method: ev.paymentMethod.id
              }, { handleActions: false });

              if (confirm.error) {
                ev.complete('fail');
                toast({ title: 'Zahlung fehlgeschlagen', description: confirm.error.message || 'Fehler', variant: 'destructive' });
              } else {
                ev.complete('success');
                if (confirm.paymentIntent && confirm.paymentIntent.status === 'requires_action') {
                  const final = await stripe.confirmCardPayment(clientSecret);
                  if (final.error) {
                    toast({ title: 'Fehler', description: final.error.message || 'Authentifizierung fehlgeschlagen', variant: 'destructive' });
                  } else {
                    setPaymentStatus('success');
                    toast({ title: 'Zahlung erfolgreich!', description: 'Du wurdest erfolgreich registriert.' });
                    setTimeout(() => { window.location.href = '/tournament/registration/success'; }, 1200);
                  }
                } else {
                  setPaymentStatus('success');
                  toast({ title: 'Zahlung erfolgreich!', description: 'Du wurdest erfolgreich registriert.' });
                  setTimeout(() => { window.location.href = '/tournament/registration/success'; }, 1200);
                }
              }
            } catch (err) {
              console.error('PaymentRequest error', err);
              ev.complete('fail');
              toast({ title: 'Fehler', description: 'Zahlung fehlgeschlagen', variant: 'destructive' });
            } finally {
              setIsProcessing(false);
            }
          });
        }
      }).catch(() => {});
    } catch (err) {
      // ignore
    }
  }, [stripe, amountDetails, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Kartenfeld nicht gefunden');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: playerName,
            email: email
          }
        }
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        setPaymentStatus('error');
        toast({ title: 'Zahlung fehlgeschlagen', description: result.error.message || 'Es ist ein Fehler aufgetreten', variant: 'destructive' });
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        toast({ title: 'Zahlung erfolgreich!', description: 'Du wurdest erfolgreich für das Turnier registriert.' });
        setTimeout(() => { window.location.href = '/tournament/registration/success'; }, 1200);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setPaymentStatus('error');
      toast({ title: 'Fehler', description: (err as Error).message || 'Ein unerwarteter Fehler ist aufgetreten', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Zahlung erfolgreich!</h3>
        <p className="text-muted-foreground">
          Du wurdest erfolgreich registriert. Du wirst weitergeleitet...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Turnier</Label>
          <p className="text-sm text-muted-foreground">{tournamentName}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Teilnehmer</Label>
          <p className="text-sm text-muted-foreground">{playerName}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium">E-Mail</Label>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Startgebühr</Label>
            <p className="text-xl font-bold">{(amountDetails?.baseAmount ?? entryFee).toFixed(2)} €</p>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm text-muted-foreground">
            <span>Stripe-Transaktionskosten</span>
            <span>{(amountDetails?.feeAmount ?? 0).toFixed(2)} €</span>
          </div>
          <div className="mt-2 flex justify-between items-center font-semibold">
            <span>Gesamtbetrag</span>
            <span>{(amountDetails?.totalAmount ?? entryFee).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {canUsePaymentRequest && paymentRequest ? (
        <div className="mb-4">
          <PaymentRequestButtonElement options={{
            paymentRequest,
          }} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Kreditkarte</Label>
        <div className="border rounded-md p-3">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#000',
                '::placeholder': { color: '#a0aec0' },
              }
            }
          }} />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zahlung wird verarbeitet...
          </>
        ) : (
          `${(amountDetails?.totalAmount ?? entryFee).toFixed(2)} € bezahlen`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Sichere Zahlung über Stripe. Deine Zahlungsdaten werden verschlüsselt übertragen.
      </p>
    </form>
  );
}

export function TournamentPayment({ 
  tournamentId, 
  tournamentName, 
  entryFee,
  onSuccess 
}: TournamentPaymentProps) {
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountDetails, setAmountDetails] = useState<PaymentAmountDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [stripeObj, setStripeObj] = useState<any>(null);

  useEffect(() => {
    // Prüfe ob Stripe konfiguriert ist
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        setStripeConfigured(data.success && data.stripeEnabled);
      })
      .catch(() => {
        setStripeConfigured(false);
      });
  }, []);

  useEffect(() => {
    // pre-load stripe promise object for payment request creation
    getStripePromise().then(s => setStripeObj(s)).catch(() => {});
  }, []);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName || !email) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle alle Felder aus',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          playerName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Fehler beim Erstellen der Zahlung');
      }

      setClientSecret(data.clientSecret);
      setAmountDetails(data.amountDetails || null);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Fehler beim Erstellen der Zahlung',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (stripeConfigured === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zahlung nicht verfügbar</CardTitle>
          <CardDescription>
            Stripe-Zahlungen sind derzeit nicht konfiguriert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Bitte kontaktiere den Administrator für alternative Zahlungsmöglichkeiten.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stripeConfigured === null) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Lade Zahlungsoptionen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turnier-Anmeldung</CardTitle>
          <CardDescription>
            Melde dich für {tournamentName} an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Name</Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Dein Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm font-medium">Startgebühr</Label>
                <p className="text-2xl font-bold">{entryFee.toFixed(2)} €</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vorbereitung...
                </>
              ) : (
                'Zur Zahlung'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zahlung abschließen</CardTitle>
        <CardDescription>
          Schließe deine Turnier-Anmeldung ab
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={getStripePromise()}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
          }}
        >
          <EnhancedPaymentForm
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            entryFee={entryFee}
            amountDetails={amountDetails}
            clientSecret={clientSecret}
            playerName={playerName}
            email={email}
            stripeObj={stripeObj}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

function EnhancedPaymentForm(props: any) {
  // shim to pass stripeObj into PaymentForm behavior (backwards compatible)
  return <PaymentForm {...props} />;
}
