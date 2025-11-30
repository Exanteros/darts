"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function MagicLinkSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionData = searchParams.get('session');
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const handleLogin = async () => {
      try {
        console.log('🔐 Magic Link Success: Starting authentication');
        
        if (!sessionData) {
          console.error('❌ No session data found');
          setError('Ungültige Session-Daten');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Decode session data
        const decoded = JSON.parse(Buffer.from(sessionData, 'base64').toString());
        const { email, name, timestamp } = decoded;

        console.log('📧 Decoded session data:', { email, name, age: Date.now() - timestamp });

        // Security: Check timestamp (max 30 Sekunden alt)
        if (Date.now() - timestamp > 30000) {
          console.error('❌ Session expired');
          setError('Session abgelaufen. Bitte melde dich erneut an.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        setUserData({ email, name });

        console.log('🔑 Calling signIn with magic link...');

        // Login via NextAuth mit Magic Link Provider
        // Verwende redirect: false um die Kontrolle über die Weiterleitung zu behalten
        const result = await signIn('credentials', {
          email,
          password: '',
          isMagicLink: 'true',
          redirect: false
        });

        console.log('✅ SignIn result:', result);

        if (result?.error) {
          console.error('❌ SignIn error:', result.error);
          setError('Fehler bei der Anmeldung. Bitte versuche es erneut.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        if (!result?.ok) {
          console.error('❌ SignIn not ok:', result);
          setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('✅ SignIn successful, fetching session...');

        // Hole Session um Rolle zu prüfen
        const sessionResponse = await fetch('/api/auth/session');
        
        if (!sessionResponse.ok) {
          console.error('❌ Session fetch failed:', sessionResponse.status);
          setError('Fehler beim Laden der Session. Bitte versuche es erneut.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        const userSession = await sessionResponse.json();
        
        console.log('📋 Session data:', userSession);

        if (!userSession?.user) {
          console.error('❌ No user in session:', userSession);
          setError('Keine gültige Session. Bitte versuche es erneut.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Redirect basierend auf Rolle
        const redirectUrl = userSession.user.role === 'ADMIN' ? '/dashboard' : '/user';
        console.log('🔄 Redirecting to:', redirectUrl);
        
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1000);

        // Dieser Code wird nur erreicht, wenn redirect: false wäre
        if (result?.error) {
          setError('Fehler bei der Anmeldung. Bitte versuche es erneut.');
          setTimeout(() => router.push('/login'), 2000);
        }

      } catch (err) {
        console.error('Magic Link Success Error:', err);
        setError('Ein Fehler ist aufgetreten.');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleLogin();
  }, [sessionData, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Fehler</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Weiterleitung zum Login...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Magic Link bestätigt!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Willkommen zurück{userData?.name ? `, ${userData.name}` : ''}!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sichere Anmeldung wird durchgeführt...
          </div>
          <p className="text-xs text-muted-foreground">
            Du wirst automatisch zum Dashboard weitergeleitet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MagicLinkSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <CardTitle>Lade...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <MagicLinkSuccessContent />
    </Suspense>
  );
}
