import { useEffect, useState } from "react";
import { privacyConfig } from "@/config/privacy";

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    // defaults based on config
    const defaults: Record<string, boolean> = {};
    privacyConfig.services.forEach(s => {
      defaults[s.id] = s.required;
    });
    return defaults;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const loadPreferences = () => {
    const saved = localStorage.getItem("cookie-consent");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (e) {
        console.error("Failed to parse cookie-consent:", e);
      }
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadPreferences();
    window.addEventListener("cookie-consent-updated", loadPreferences);
    return () => window.removeEventListener("cookie-consent-updated", loadPreferences);
  }, []);

  const savePreferences = (prefs: Record<string, boolean>) => {
    // Ensure required services are always true
    privacyConfig.services.forEach(s => {
      if (s.required) prefs[s.id] = true;
    });
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  const hasConsent = (serviceId: string): boolean => {
    return preferences[serviceId] === true;
  };

  return { preferences, setPreferences, savePreferences, loadPreferences, hasConsent, isLoaded };
}