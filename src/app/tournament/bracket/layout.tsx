import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turnierbaum',
  description: 'Der aktuelle Turnierbaum und die Ergebnisse des Dart Masters Puschendorf. Verfolge den Weg zum Finale live!',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/tournament/bracket',
  },
  openGraph: {
    title: 'Turnierbaum | Dart Masters Puschendorf',
    description: 'Live-Ergebnisse und Turnierbaum.',
  },
};

export default function BracketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
