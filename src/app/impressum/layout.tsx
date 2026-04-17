import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum und rechtliche Hinweise zum Dart Masters Puschendorf.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/impressum',
  },
  openGraph: {
    title: 'Impressum | Dart Masters Puschendorf',
    description: 'Impressum der offiziellen Website des Dart Masters Puschendorf.',
  },
};

export default function ImpressumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
