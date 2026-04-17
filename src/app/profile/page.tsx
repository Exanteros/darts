"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, ArrowLeft, Loader2,
  Target, LogOut, Upload, Shield, Lock, Bell
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import { startRegistration } from "@simplewebauthn/browser";
import { CheckCircle2, Fingerprint } from "lucide-react";

/* ================= TYPES ================= */

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  memberSince: string;
}

/* ================= COMPONENTS ================= */

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [name, setName] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        setErrorMessage("Du bist nicht angemeldet. Bitte melde dich zuerst an.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
          setHasPasskey(data.user.hasPasskey || data.user.webAuthnCredentials?.length > 0);
        setName(data.user.name || "");
      } else {
        setErrorMessage(data.message || "Profil konnte nicht geladen werden");
      }
    } catch (err) {
      setErrorMessage("Verbindungsfehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast({ title: "Fehler", description: "Name darf nicht leer sein", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile!, name });
        toast({ title: "Erfolg", description: "Name wurde aktualisiert" });
      } else {
        toast({ title: "Fehler", description: data.message || "Fehler beim Speichern", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Fehler", description: "Verbindungsfehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);



  if (errorMessage && !profile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
        <PageHeader />
        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Profil konnte nicht geladen werden</h1>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <div className="flex items-center gap-3">
              <Button onClick={fetchProfile}>Erneut versuchen</Button>
              <Button variant="outline" asChild>
                <Link href="/user">Zum Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs: { id: 'general' | 'security' | 'notifications'; label: string }[] = [
    { id: 'general', label: 'Allgemein' },
    { id: 'security', label: 'Sicherheit' },
    { id: 'notifications', label: 'Benachrichtigungen' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      <PageHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Einstellungen</h1>
          <p className="text-slate-500">Verwalte deine Profil-Details und Präferenzen.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              
              {/* Avatar Section */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-slate-100">
                            <AvatarFallback className="bg-slate-900 text-white text-2xl font-medium">
                                {profile?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Profilbild</h3>
                            <p className="text-sm text-slate-500 max-w-xs">
                                Dieses Bild wird auf Turnieren und in Ranglisten angezeigt.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                          onClick={() => toast({ title: "Info", description: "Profilbild-Verwaltung folgt in Kürze." })}
                        >
                            Entfernen
                        </Button>
                        <Button
                          className="bg-slate-900 text-white hover:bg-slate-800"
                          onClick={() => toast({ title: "Info", description: "Profilbild-Upload folgt in Kürze." })}
                        >
                            <Upload className="h-4 w-4 mr-2" /> Hochladen
                        </Button>
                    </div>
                 </div>
              </section>

              {/* Personal Info Section */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Persönliche Daten</h3>
                    <p className="text-sm text-slate-500">
                        Änderungen hier werden sofort wirksam.
                    </p>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div className="grid gap-2 max-w-lg">
                        <Label htmlFor="name" className="text-slate-700">Anzeigename</Label>
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                             <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                             <Input 
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9 h-10 bg-white border-slate-200 focus:ring-slate-900"
                             />
                           </div>
                        </div>
                        <p className="text-[13px] text-slate-400">
                            Dieser Name ist öffentlich für andere Spieler sichtbar.
                        </p>
                    </div>

                    {/* Email Input */}
                    <div className="grid gap-2 max-w-lg">
                        <Label htmlFor="email" className="text-slate-700">E-Mail Adresse</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input 
                                id="email"
                                value={profile?.email || ""}
                                readOnly
                                disabled
                                className="pl-9 h-10 bg-slate-50 border-slate-200 text-slate-500"
                            />
                        </div>
                    </div>

                    {/* Role Badge (Read Only) */}
                    <div className="grid gap-2">
                        <Label className="text-slate-700">Berechtigung</Label>
                        <div>
                             <Badge variant="outline" className="pl-1 pr-3 py-1 bg-slate-50 border-slate-200 text-slate-600 font-normal">
                                <Shield className="h-3 w-3 mr-1.5 text-blue-500" />
                                {profile?.role === 'ADMIN' ? 'Administrator' : 'Verifizierter Spieler'}
                             </Badge>
                        </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        Zuletzt aktualisiert: {new Date().toLocaleDateString()}
                    </p>
                    <Button 
                        onClick={handleSaveName} 
                        disabled={saving}
                        className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm min-w-[120px]"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Speichern"}
                    </Button>
                 </div>
              </section>

              {/* Danger Zone */}
              <section className="border border-red-200 rounded-xl overflow-hidden bg-white">
                 <div className="p-6">
                    <h3 className="text-lg font-semibold text-red-900">Sitzung</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Melde dich auf diesem Gerät sicher von deinem Account ab.
                    </p>
                    <div className="flex items-center justify-end">
                      <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      >
                          <LogOut className="h-4 w-4 mr-2" /> Abmelden
                       </Button>
                    </div>
                 </div>
              </section>

            </motion.div>
          )}

          {/* Placeholders for other tabs */}
          {activeTab === 'security' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                <Lock className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Sicherheit</h3>
                <p className="text-slate-500">Zwei-Faktor-Authentifizierung und Passwort-Einstellungen folgen bald.</p>
             </motion.div>
          )}

           {activeTab === 'notifications' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                <Bell className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Benachrichtigungen</h3>
                <p className="text-slate-500">Steuere hier, welche E-Mails du von uns erhalten möchtest.</p>
             </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}