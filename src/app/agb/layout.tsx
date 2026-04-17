import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Allgemeine Geschäftsbedingungen für das Dart Masters Puschendorf. Teilnahmebedingungen und Regelungen.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/agb',
  },
  openGraph: {
    title: 'AGB | Dart Masters Puschendorf',
    description: 'Allgemeine Geschäftsbedingungen für das Dart Masters Puschendorf.',
  },
};

export default function AGBLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
