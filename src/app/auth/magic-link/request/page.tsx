"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MagicLinkRequestPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setDevLink(null);

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Ein Login-Link wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe dein Postfach.' 
        });
        if (data.devLink) {
          setDevLink(data.devLink);
          setMessage({ 
            type: 'info', 
            text: `Development Mode: Link wurde generiert (siehe unten oder Console)` 
          });
          console.log('🔗 Magic Link:', data.devLink);
        }
        setEmail("");
      } else {
        setMessage({ type: 'error', text: data.message || 'Ein Fehler ist aufgetreten.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler. Bitte versuche es erneut.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.08),transparent_70%)] blur-2xl" />
        <div className="absolute left-[20%] top-1/2 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[15%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.13),transparent_70%)] blur-3xl" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Badge variant="outline" className="border-white/30 text-white backdrop-blur mb-4">
              Darts Masters Puschendorf
            </Badge>
            <h1 className="text-4xl font-bold mb-2">Magic Link</h1>
            <p className="text-white/70">
              Erhalte einen sicheren Login-Link per E-Mail
            </p>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Mail className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">Passwortloser Login</CardTitle>
                  <CardDescription className="text-white/60">
                    Gib deine E-Mail-Adresse ein
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sende Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Magic Link anfordern
                    </>
                  )}
                </Button>
              </form>

              {message && (
                <Alert className={`mt-4 ${
                  message.type === 'success' 
                    ? 'border-green-500 bg-green-500/10' 
                    : message.type === 'info'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-red-500 bg-red-500/10'
                }`}>
                  {message.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
                  <AlertDescription className={
                    message.type === 'success' 
                      ? 'text-green-400' 
                      : message.type === 'info'
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {devLink && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 font-semibold mb-2">🔧 Development Mode</p>
                  <p className="text-xs text-white/70 mb-2 break-all">{devLink}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                    onClick={() => window.location.href = devLink}
                  >
                    Direkt zum Link
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurück zum Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
