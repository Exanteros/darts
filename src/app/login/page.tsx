"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowRight, CheckCircle2, Target, Sparkles, ChevronLeft } from "lucide-react";
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
        // Kein setMessage nötig, wir wechseln die View
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- Background Elements --- */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        {/* Subtle center glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* --- Back Button --- */}
      <div className="absolute top-8 left-8">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 group" onClick={() => router.push('/')}>
            <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Zurück
        </Button>
      </div>

      <main className="w-full max-w-md px-4 relative z-10">
        
        {/* Logo Animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-200">
               <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* --- LOGIN FORM --- */
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Willkommen zurück</h1>
                <p className="text-sm text-slate-500 mt-2">
                  Gib deine E-Mail-Adresse ein, um dich anzumelden.
                </p>
              </div>

              <Card className="border-slate-200 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-medium">E-Mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@firma.de"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.01]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verarbeite...
                        </>
                      ) : (
                        <>
                          Magic Link anfordern <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                        <AlertDescription>{message.text}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <p className="mt-8 text-center text-xs text-slate-400">
                Mit der Anmeldung akzeptieren Sie unsere <a href="/datenschutz" className="underline hover:text-slate-600">Datenschutzerklärung</a>.
              </p>
            </motion.div>
          ) : (
            /* --- SUCCESS STATE --- */
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-center"
            >
               <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
                  <Sparkles className="h-8 w-8" />
               </div>
               
               <h2 className="text-2xl font-bold text-slate-900 mb-2">E-Mail versendet!</h2>
               <p className="text-slate-500 max-w-xs mx-auto mb-8 leading-relaxed">
                 Wir haben einen magischen Link an <span className="font-semibold text-slate-900">{email}</span> gesendet.
                 Klicke auf den Link in der E-Mail, um dich anzumelden.
               </p>

               <div className="flex flex-col gap-3">
                 <Button 
                   variant="outline" 
                   className="w-full border-slate-200 hover:bg-slate-50 text-slate-600"
                   onClick={() => window.open('https://gmail.com', '_blank')}
                 >
                   E-Mail Postfach öffnen
                 </Button>
                 <Button 
                   variant="ghost" 
                   className="w-full text-slate-400 hover:text-slate-600"
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