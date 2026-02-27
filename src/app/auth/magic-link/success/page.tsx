"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

function MagicLinkSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const sessionParam = searchParams.get('session');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogin = async () => {
      try {
        console.log('🔐 Magic Link Success: Starting authentication');
        
        if (sessionParam && !token) {
          console.warn('⚠️ Old session param detected, but no token.');
          setError('Dieser Link ist veraltet. Bitte fordere einen neuen Login-Link an.');
          setTimeout(() => router.push('/login'), 4000);
          return;
        }

        if (!token) {
          console.error('❌ No token found');
          setError('Ungültiges Login-Token');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('🔑 Calling signIn with magic link token...');

        // Login via NextAuth mit Magic Link Provider
        // Wir übergeben das Token als "password" oder in einem eigenen Feld
        const result = await signIn('credentials', {
          token, // Pass the signed token
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
        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
        
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

        // Redirect basierend auf Rolle und Berechtigungen
        let redirectUrl = '/user';
        
        if (userSession.user.role === 'ADMIN') {
          redirectUrl = '/dashboard';
        } else {
          // Check for tournament access
          try {
            const accessResponse = await fetch('/api/auth/check-access');
            if (accessResponse.ok) {
              const accessData = await accessResponse.json();
              if (accessData.hasAccess) {
                redirectUrl = '/dashboard';
              }
            }
          } catch (e) {
            console.error('Error checking access for redirect', e);
          }
        }

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
  }, [token, sessionParam, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900 selection:bg-slate-200">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md px-6">
          <Card className="border-slate-200 shadow-none rounded-sm bg-white">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-sm flex items-center justify-center mb-8 border border-red-100">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Fehler</h2>
              <p className="text-slate-600 text-base mb-8 leading-relaxed">{error}</p>
              <div className="flex items-center justify-center gap-3 text-sm font-mono text-slate-400 uppercase tracking-widest">
                <Loader2 className="h-4 w-4 animate-spin" />
                Weiterleitung zum Login...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900 selection:bg-slate-200">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md px-6">
        <Card className="border-slate-200 shadow-none rounded-sm bg-white">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-slate-900 text-white rounded-sm flex items-center justify-center mb-8">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Magic Link bestätigt!</h2>
            <p className="text-slate-600 text-base mb-8 leading-relaxed">
              Willkommen zurück!
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3 text-sm font-mono text-slate-900 uppercase tracking-widest font-semibold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sichere Anmeldung...
              </div>
              <p className="text-xs font-mono text-slate-400">
                Du wirst automatisch weitergeleitet
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function MagicLinkSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="w-full max-w-md px-6">
          <Card className="border-slate-200 shadow-none rounded-sm bg-white">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-slate-50 text-slate-400 rounded-sm flex items-center justify-center mb-8 border border-slate-100">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lade...</h2>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <MagicLinkSuccessContent />
    </Suspense>
  );
}
