"use client";

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Registrierung erfolgreich!</CardTitle>
          <CardDescription>
            Du wurdest erfolgreich für das Turnier registriert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Was passiert als Nächstes?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Deine Zahlung wurde erfolgreich verarbeitet</li>
              <li>📧 Du erhältst eine Bestätigungs-E-Mail</li>
              <li>🎯 Du kannst dich auf das Turnier vorbereiten</li>
              <li>📅 Weitere Informationen folgen per E-Mail</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Zur Startseite
            </Button>
            <Button 
              onClick={() => window.location.href = '/tournament/register'}
              variant="outline"
              className="w-full"
            >
              Weitere Person anmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
