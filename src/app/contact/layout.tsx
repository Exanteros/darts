import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Nimm Kontakt mit dem Dart Masters Puschendorf Team auf. Wir beantworten gerne deine Fragen zum Turnier.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/contact',
  },
  openGraph: {
    title: 'Kontakt | Dart Masters Puschendorf',
    description: 'Nimm Kontakt mit dem Dart Masters Puschendorf Team auf.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Kontakt - Dart Masters Puschendorf',
    description: 'Kontaktformular und Informationen zum Dart Masters Puschendorf',
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
