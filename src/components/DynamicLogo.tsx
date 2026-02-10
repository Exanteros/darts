"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";

export default function DynamicLogo({ className }: { className?: string }) {
  const [mainLogo, setMainLogo] = useState<string>('');

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/api/admin/tournament/settings');
        if (response.ok) {
          const settings = await response.json();
          setMainLogo(settings.mainLogo || '');
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  return (
    <div className={`flex items-center gap-3 cursor-pointer ${className || ''}`}>
      {mainLogo ? (
        <img src={mainLogo} alt="Logo" className="h-9 w-auto object-contain" />
      ) : (
        <>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Target className="h-6 w-6" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">Darts Masters</span>
        </>
      )}
    </div>
  );
}
