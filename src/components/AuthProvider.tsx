"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Unterdrücke CLIENT_FETCH_ERROR Warnings in der Console (bekanntes Next.js 15 + NextAuth Issue)
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('CLIENT_FETCH_ERROR') || args[0].includes('[next-auth][error]'))
      ) {
        // Ignoriere diesen spezifischen Fehler - er ist harmlos
        return;
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <SessionProvider
      // Workaround für Next.js 15 CLIENT_FETCH_ERROR während SSR
      basePath="/api/auth"
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
