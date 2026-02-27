"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, Target, Sparkles, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900 selection:bg-slate-200">
      
      {/* --- Background Elements --- */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]">
      </div>

      {/* --- Back Button --- */}
      <div className="absolute top-8 left-8">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 group font-semibold rounded-sm" onClick={() => router.push('/')}>
            <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Zurück
        </Button>
      </div>

      <main className="w-full max-w-md px-6 relative z-10">
        
        {/* Logo Animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex justify-center"
        >
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-slate-900 rounded-sm flex items-center justify-center">
               <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* --- LOGIN FORM --- */
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">/ LOGIN ■</div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Willkommen zurück</h1>
                <p className="text-base text-slate-500 mt-2">
                  Gib deine E-Mail-Adresse ein, um dich anzumelden.
                </p>
              </div>

              <Card className="border-slate-200 shadow-none rounded-sm bg-white">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-900 font-semibold">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@firma.de"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-12 h-14 rounded-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-900 text-base"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 rounded-sm text-lg font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verarbeite...
                        </>
                      ) : (
                        <>
                          Magic Link anfordern <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6"
                    >
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 rounded-sm">
                        <AlertDescription className="font-medium">{message.text}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <p className="mt-8 text-center text-sm font-mono text-slate-400">
                Mit der Anmeldung akzeptieren Sie unsere <a href="/datenschutz" className="underline hover:text-slate-900 transition-colors">Datenschutzerklärung</a>.
              </p>
            </motion.div>
          ) : (
            /* --- SUCCESS STATE --- */
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-center py-8"
            >
               <div className="mx-auto w-20 h-20 bg-slate-900 text-white rounded-sm flex items-center justify-center mb-8">
                  <Sparkles className="h-10 w-10" />
               </div>
               
               <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">E-Mail versendet!</h2>
               <p className="text-slate-600 text-lg max-w-xs mx-auto mb-10 leading-relaxed">
                 Wir haben einen magischen Link an <br/><strong className="text-slate-900">{email}</strong> gesendet.
               </p>

               <div className="flex flex-col gap-4">
                 <Button 
                   variant="outline" 
                   className="w-full h-14 border-slate-200 hover:bg-slate-50 text-slate-900 rounded-sm font-semibold text-lg"
                   onClick={() => window.open('https://gmail.com', '_blank')}
                 >
                   E-Mail Postfach öffnen
                 </Button>
                 <Button 
                   variant="ghost" 
                   className="w-full h-14 text-slate-500 hover:text-slate-900 rounded-sm font-mono text-sm uppercase tracking-widest"
                   onClick={() => setIsSuccess(false)}
                 >
                   Andere E-Mail verwenden
                 </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
