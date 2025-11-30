"use client";

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
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
  clientSecret,
  playerName,
  email 
}: { 
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  clientSecret: string;
  playerName: string;
  email: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tournament/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        setPaymentStatus('error');
        toast({
          title: 'Zahlung fehlgeschlagen',
          description: error.message || 'Es ist ein Fehler aufgetreten',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        toast({
          title: 'Zahlung erfolgreich!',
          description: 'Du wurdest erfolgreich für das Turnier registriert.',
        });
        
        // Redirect nach Erfolg
        setTimeout(() => {
          window.location.href = '/tournament/registration/success';
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setPaymentStatus('error');
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      });
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
            <p className="text-xl font-bold">{entryFee.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      <PaymentElement />

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
          `${entryFee.toFixed(2)} € bezahlen`
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
  const [isLoading, setIsLoading] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

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
          amount: entryFee,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Fehler beim Erstellen der Zahlung');
      }

      setClientSecret(data.clientSecret);
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
          <PaymentForm
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            entryFee={entryFee}
            clientSecret={clientSecret}
            playerName={playerName}
            email={email}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
