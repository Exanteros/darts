import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung des Dart Masters Puschendorf. Wie wir deine Daten behandeln und schützen.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/datenschutz',
  },
  openGraph: {
    title: 'Datenschutz | Dart Masters Puschendorf',
    description: 'Datenschutzerklärung für Teilnehmer und Besucher.',
  },
};

export default function DatenschutzLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
