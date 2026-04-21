"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { privacyConfig } from "@/config/privacy";
import { useToast } from "@/hooks/use-toast";

export default function CookiePreferences() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    privacyConfig.services.forEach(s => {
      defaults[s.id] = s.required;
    });
    return defaults;
  });
  
  const [mounted, setMounted] = useState(false);

  const loadPreferences = () => {
    const saved = localStorage.getItem("cookie-consent");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {}
    }
  };

  useEffect(() => {
    setMounted(true);
    loadPreferences();
    window.addEventListener('cookie-consent-updated', loadPreferences);
    return () => window.removeEventListener('cookie-consent-updated', loadPreferences);
  }, []);

  const handleSave = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    toast({
      title: "Gespeichert",
      description: "Ihre Cookie-Einstellungen wurden erfolgreich aktualisiert.",
    });
    window.dispatchEvent(new Event('cookie-consent-updated'));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 mt-4">
      {privacyConfig.services.map((service) => (
        <div key={service.id} className="flex gap-4 items-start p-5 bg-white border border-slate-200 rounded-md">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-slate-900 text-lg">{service.title}</h4>
              {service.required && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-sm">
                  Erforderlich
                </span>
              )}
            </div>
            <p className="text-base text-slate-600 leading-relaxed mb-3">{service.description}</p>
            <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-sm border border-slate-100 inline-block">Cookies: {service.cookies.join(", ")}</p>
          </div>
          <div className="pt-1 pl-4">
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
      <div className="pt-2">
        <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-6 py-5 h-auto text-base rounded-sm">
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
}