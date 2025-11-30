"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, Mail, ArrowLeft, Save, Loader2, 
  Target, LogOut, Upload, Shield, Lock, Bell
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ================= TYPES ================= */

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  memberSince: string;
}

/* ================= COMPONENTS ================= */

function DynamicLogo() {
  const [mainLogo, setMainLogo] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/public/logo')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setMainLogo(data.mainLogo || ''))
      .catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
        {mainLogo ? (
          <img src={mainLogo} alt="Logo" className="h-5 w-5 object-contain" />
        ) : (
          <Target className="h-4 w-4 text-white" />
        )}
      </div>
      <span className="font-bold tracking-tight text-lg text-slate-900">Darts Masters</span>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <DynamicLogo />
        </Link>
        <Link href="/user">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
            </Button>
        </Link>
      </div>
    </header>
  );
}

/* ================= MAIN PAGE ================= */

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
        setFormData({ name: data.user.name || '', email: data.user.email || '' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      // Simulate slight delay for UX
      await new Promise(r => setTimeout(r, 500));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Allgemein' },
    { id: 'security', label: 'Sicherheit' },
    { id: 'notifications', label: 'Benachrichtigungen' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      <Header />

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
                        <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 hover:bg-white">
                            Entfernen
                        </Button>
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
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
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="pl-9 h-10 bg-white border-slate-200 focus:ring-slate-900"
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
                        onClick={handleSubmit} 
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
                    <h3 className="text-lg font-semibold text-red-900">Gefahrenzone</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                        Einmal gelöschte Konten können nicht wiederhergestellt werden. Alle deine Turnierdaten gehen verloren.
                    </p>
                    <div className="flex items-center justify-end">
                       <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                          <LogOut className="h-4 w-4 mr-2" /> Konto löschen
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