import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sponsoren',
  description: 'Ein großer Dank an unsere Sponsoren und Unterstützer des Dart Masters Puschendorf. Ohne euch wäre das Event nicht möglich!',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/sponsors',
  },
  openGraph: {
    title: 'Sponsoren | Dart Masters Puschendorf',
    description: 'Unsere Unterstützer im Fokus.',
  },
};

export default function SponsorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
