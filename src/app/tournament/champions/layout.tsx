import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Champions',
  description: 'Die Gewinner und Hall of Fame des Dart Masters Puschendorf. Alle bisherigen Champions auf einen Blick.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/tournament/champions',
  },
  openGraph: {
    title: 'Hall of Fame | Dart Masters Puschendorf',
    description: 'Alle bisherigen Champions auf einen Blick.',
  },
};

export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
