import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anfahrt',
  description: 'So findest du zum Austragungsort des Dart Masters Puschendorf. Wegbeschreibung und Adresse des Sportheims.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/anfahrt',
  },
  openGraph: {
    title: 'Anfahrt | Dart Masters Puschendorf',
    description: 'Wegbeschreibung zum Sportheim Puschendorf.',
  },
};

export default function AnfahrtLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Sportheim Puschendorf (Austragungsort)',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Waldstraße 1',
      addressLocality: 'Puschendorf',
      postalCode: '90617',
      addressCountry: 'DE'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
