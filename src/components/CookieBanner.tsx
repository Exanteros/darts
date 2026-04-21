"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Settings, Check } from "lucide-react";
import Link from "next/link";
import { privacyConfig } from "@/config/privacy";
import { useToast } from "@/hooks/use-toast";

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    // Initializer returns defaults
    const defaults: Record<string, boolean> = {};
    privacyConfig.services.forEach(s => {
      defaults[s.id] = s.required;
    });
    return defaults;
  });

  useEffect(() => {
    const saved = localStorage.getItem("cookie-consent");
    if (!saved) {
      setIsOpen(true);
    } else {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        setIsOpen(true);
      }
    }
  }, []);

  const savePreferences = (prefs: Record<string, boolean>) => {
    // Ensure required are always true
    privacyConfig.services.forEach(s => {
      if (s.required) prefs[s.id] = true;
    });
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsOpen(false);
    setShowSettings(false);
    toast({
      title: "Gespeichert",
      description: privacyConfig.cookieBanner.savedText,
    });
    
    // Custom event to notify other components (like datenschutz page)
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  const handleAcceptAll = () => {
    const prefs = { ...preferences };
    privacyConfig.services.forEach(s => {
      prefs[s.id] = true;
    });
    savePreferences(prefs);
  };

  const handleAcceptEssential = () => {
    const prefs = { ...preferences };
    privacyConfig.services.forEach(s => {
      prefs[s.id] = s.required;
    });
    savePreferences(prefs);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[360px]"
          >
            <div className="bg-white border border-slate-200 shadow-2xl rounded-xl p-5 flex flex-col gap-4">
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-900 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm">{privacyConfig.cookieBanner.title}</h2>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    {privacyConfig.cookieBanner.description}
                  </p>
                  <Link prefetch={false} href="/datenschutz" className="text-xs font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600 inline-block mt-2">
                    Datenschutzerklärung lesen
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleAcceptAll} 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold h-9 text-xs"
                >
                  <Check className="mr-2 h-3.5 w-3.5" /> {privacyConfig.cookieBanner.acceptAllText}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleAcceptEssential}
                    className="w-full rounded-sm font-medium text-slate-700 bg-slate-50 border-slate-200 h-9 text-xs"
                  >
                    {privacyConfig.cookieBanner.acceptEssentialText}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSettings(true)}
                    className="w-full rounded-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 text-xs"
                  >
                    <Settings className="mr-1.5 h-3 w-3" /> Details
                  </Button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px] bg-white text-slate-900 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{privacyConfig.cookieBanner.manageText}</DialogTitle>
            <DialogDescription className="text-slate-600 pt-2">
              Passen Sie Ihre Einstellungen an. Sie können diese jederzeit in unserer Datenschutzerklärung widerrufen oder ändern.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {privacyConfig.services.map((service) => (
              <div key={service.id} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{service.title}</h4>
                    {service.required && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm">
                        Erforderlich
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{service.description}</p>
                </div>
                <div className="pt-1">
                  <Switch
                    checked={preferences[service.id]}
                    onCheckedChange={(checked) => {
                      if (!service.required) {
                        setPreferences(prev => ({ ...prev, [service.id]: checked }));
                      }
                    }}
                    disabled={service.required}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="rounded-sm">
              Abbrechen
            </Button>
            <Button onClick={handleSaveSettings} className="bg-slate-900 text-white rounded-sm hover:bg-slate-800">
              Einstellungen speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}