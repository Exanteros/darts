import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Häufig gestellte Fragen (FAQ)',
  description: 'Antworten auf die wichtigsten Fragen rund um das Dart Masters Puschendorf. Teilnahmegebühr, Regeln, Ablauf und mehr.',
  alternates: {
    canonical: 'https://pudo-dartmasters.de/faq',
  },
  openGraph: {
    title: 'FAQ | Dart Masters Puschendorf',
    description: 'Alle Antworten auf deine Fragen zum Darts-Turnier.',
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Wo findet das Turnier statt?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Das Turnier wird im Sportheim des SV Puschendorf ausgetragen.'
        }
      },
      {
        '@type': 'Question',
        name: 'Wer kann teilnehmen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Jeder ab 16 Jahren kann am Turnier teilnehmen, Anfänger ebenso wie Fortgeschrittene.'
        }
      }
    ]
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
