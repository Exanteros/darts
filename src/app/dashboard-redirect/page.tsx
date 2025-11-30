"use client";

import { useUserCheck } from '@/hooks/useUserCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, ArrowRight } from 'lucide-react';

export default function DashboardRedirect() {
  const { isAdmin, isLoading, isAuthenticated, shouldRedirect } = useUserCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Überprüfe Berechtigung...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-900">Anmeldung erforderlich</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-6">
              Bitte melde dich an, um auf dein Dashboard zuzugreifen.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Zur Anmeldung
              <ArrowRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-900 flex items-center justify-center gap-2">
              {isAdmin ? (
                <>
                  <Shield className="h-6 w-6 text-blue-600" />
                  Admin Dashboard
                </>
              ) : (
                <>
                  <User className="h-6 w-6 text-green-600" />
                  Mein Dashboard
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-6">
              {isAdmin
                ? 'Du wirst zum Admin-Dashboard weitergeleitet...'
                : 'Du wirst zu deinem persönlichen Dashboard weitergeleitet...'
              }
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
