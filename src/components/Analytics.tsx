'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export function Analytics({ gaId = process.env.NEXT_PUBLIC_GA_ID }: { gaId?: string }) {
  const { hasConsent, isLoaded } = useCookieConsent();

  useEffect(() => {
    if (!isLoaded || !gaId) {
      return;
    }

    if (hasConsent('analytics')) {
      // Simulate loading Google Analytics only if consent is given
      console.log('✅ Analysedienste (Analytics) geladen mit GA-ID:', gaId);
      
      const script = document.createElement('script');
      script.id = 'ga-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
      
      window.gtag('js', new Date());
      window.gtag('config', gaId, {
        anonymize_ip: true,
      });
    } else {
      // Clean up script if consent is revoked
      const scripts = document.head.querySelectorAll('script[src*="googletagmanager.com"]');
      scripts.forEach(s => s.remove());
      const stateScripts = document.head.querySelectorAll('script#ga-script');
      stateScripts.forEach(s => s.remove());

      delete window.dataLayer;
      delete window.gtag;
      if (gaId) {
        (window as any)[`ga-disable-${gaId}`] = true;
      }
      console.log('🚫 Analysedienste (Analytics) blockiert aufgrund fehlender Zustimmung.');
    }
  }, [hasConsent('analytics'), isLoaded, gaId]);

  return null;
}

// Typings for global window
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}