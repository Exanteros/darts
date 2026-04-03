"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, Target, Sparkles, CheckCircle2 } from "lucide-react";
import DynamicLogo from "@/components/DynamicLogo";
import { Separator } from "@/components/ui/separator";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Fehler beim Senden des Magic Links.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Ein Verbindungsfehler ist aufgetreten.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Background */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,slate-200_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="lg:hidden relative flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <DynamicLogo />
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-slate-600 hover:text-slate-900"
            >
              Zurück
            </Button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    DART MASTERS 2026
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Anmelden</h1>
                  <p className="text-slate-600">Gib deine E-Mail ein, um Magic Link zu erhalten</p>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-semibold">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-slate-900 text-base"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-base font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          Magic Link anfordern
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="rounded-lg">
                        <AlertDescription className="font-medium text-sm">{message.text}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2 text-center text-sm text-slate-500">
                    <p>Indem du dich anmeldest, akzeptierst du unsere</p>
                    <p>
                      <Link href="/datenschutz" className="underline hover:text-slate-900 transition-colors">Datenschutzerklärung</Link> und <Link href="/agb" className="underline hover:text-slate-900 transition-colors">AGB</Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm text-center"
              >
                <div className="mx-auto mb-6 inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Link versendet!</h2>
                <p className="text-slate-600 mb-2">
                  Wir haben einen Magic Link an
                </p>
                <p className="font-semibold text-slate-900 mb-8 break-all">{email}</p>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-semibold"
                    onClick={() => window.location.href = 'https://mail.google.com'}
                  >
                    E-Mail öffnen
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-lg font-semibold text-slate-900"
                    onClick={() => setIsSuccess(false)}
                  >
                    Andere E-Mail verwenden
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
        {/* Left Side */}
        <div className="relative hidden lg:flex flex-col p-10 bg-slate-900 border-r border-slate-800 text-white overflow-hidden">
          <FlickeringGrid
            className="absolute inset-0 z-0 size-full"
            squareSize={4}
            gridGap={6}
            color="#6B7280"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(79,70,229,0.1)_0%,transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity mb-8">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-slate-900" />
              </div>
              <span className="text-xl font-bold">Dart Masters</span>
            </Link>
          </div>

          {/* Testimonial & Footer Text */}
          <div className="relative z-10 mt-auto text-right">
            <blockquote className="text-lg font-medium leading-relaxed mb-4">
              "Willkommen beim größten Darts-Turnier der Region. Hier treffen sich die besten Spieler für ein unvergessliches Event voller Spannung und Spaß."
            </blockquote>
            <p className="text-sm text-slate-400 mb-12">— Dart Masters Organization Team</p>

            <div className="text-sm text-slate-500">
              <p>© 2026 Dart Masters Puschendorf</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center justify-center p-10 bg-white">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm space-y-8"
              >
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    ANMELDEN
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">Willkommen zurück</h1>
                  <p className="text-slate-600">Gib deine E-Mail-Adresse ein, um dich anzumelden</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-slate-900 text-base"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        Mit E-Mail anmelden
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="rounded-lg">
                      <AlertDescription className="font-medium text-sm">{message.text}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Separator />

                {/* Footer Text */}
                <div className="text-center text-xs text-slate-500 space-y-1">
                  <p>Mit dem Anmelden akzeptierst du unsere</p>
                  <p>
                    <Link href="/datenschutz" className="underline hover:text-slate-900 transition-colors">Datenschutzerklärung</Link> und <Link href="/agb" className="underline hover:text-slate-900 transition-colors">AGB</Link>
                  </p>
                </div>

                {/* Back to Home Link */}
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/')}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    ← Zurück zur Startseite
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm text-center space-y-6"
              >
                <div className="mx-auto inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900">Link versendet!</h2>
                  <p className="text-slate-600">
                    Wir haben einen magischen Link an<br />
                    <span className="font-semibold text-slate-900 break-all">{email}</span> gesendet.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-semibold"
                    onClick={() => window.location.href = 'https://mail.google.com'}
                  >
                    E-Mail-Postfach öffnen
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-11 rounded-lg font-semibold text-slate-900"
                    onClick={() => setIsSuccess(false)}
                  >
                    Andere E-Mail verwenden
                  </Button>
                </div>

                <Button 
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="w-full text-slate-600 hover:text-slate-900"
                >
                  ← Zurück zur Startseite
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
