import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turnierregeln',
  description: 'Die offiziellen Spielregeln für das Dart Masters Puschendorf. Erfahre mehr über den Modus und Ablauf des Turniers.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/rules',
  },
  openGraph: {
    title: 'Turnierregeln | Dart Masters Puschendorf',
    description: 'Modus und Ablauf des Darts-Turniers.',
  },
};

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
