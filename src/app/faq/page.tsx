import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from "@/components/page-header";

import DynamicLogo from '@/components/DynamicLogo';
import { Button } from '@/components/ui/button';

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSection = {
  title: string;
  items: FAQItem[];
};

const faqSections: FAQSection[] = [
  {
    title: 'Anmeldung',
    items: [
      {
        question: 'Wie melde ich mich zum Turnier an?',
        answer:
          'Die Anmeldung erfolgt online über die Registrierungsseite. Trage dort deine Kontaktdaten ein und bestätige die Teilnahmebedingungen.',
      },
      {
        question: 'Bis wann kann ich mich anmelden?',
        answer:
          'Eine Anmeldung ist möglich, solange Startplätze frei sind. Bei ausgebuchtem Feld wird eine Warteliste angeboten.',
      },
      {
        question: 'Kann ich meine Anmeldung nachträglich ändern?',
        answer:
          'Ja. Kontaktiere uns über die Kontaktseite, wenn sich Name, E-Mail oder Teamangaben ändern sollen.',
      },
    ],
  },
  {
    title: 'Ablauf',
    items: [
      {
        question: 'Wann startet das Turnier am Veranstaltungstag?',
        answer:
          'Die finalen Startzeiten werden vor dem Event bekanntgegeben. Bitte sei frühzeitig vor Ort, damit Check-in und Einweisung reibungslos laufen.',
      },
      {
        question: 'Wie läuft der Check-in vor Ort ab?',
        answer:
          'Beim Check-in bestätigst du deine Anwesenheit und erhältst alle wichtigen Infos zu Board-Zuteilung, Spielmodus und Zeitplan.',
      },
      {
        question: 'Wo sehe ich Spielpaarungen und Ergebnisse?',
        answer:
          'Paarungen, Spielstände und Ergebnisse werden während des Turniers auf den vorgesehenen Seiten sowie an den Aushangpunkten angezeigt.',
      },
    ],
  },
  {
    title: 'Teilnahme',
    items: [
      {
        question: 'Wer darf teilnehmen?',
        answer:
          'Teilnehmen darf jede angemeldete Person gemäß den Turnierbedingungen. Details zu Altersgrenzen und Regeln findest du auf der Regelseite.',
      },
      {
        question: 'Was muss ich zur Teilnahme mitbringen?',
        answer:
          'Bringe am besten eigene Darts und bei Bedarf etwas Zeitpuffer mit. Vor Ort stehen zusätzlich alle wichtigen Turnierinfos bereit.',
      },
      {
        question: 'Was passiert, wenn ich kurzfristig absagen muss?',
        answer:
          'Bitte gib uns so früh wie möglich Bescheid, damit wir den Platz an Nachrücker vergeben können.',
      },
    ],
  },
  {
    title: 'Organisation und Support',
    items: [
      {
        question: 'Wie kann ich das Team bei Fragen erreichen?',
        answer:
          'Nutze dafür die Kontaktseite. Wir antworten dir schnellstmöglich zu Anmeldung, Turnierablauf und organisatorischen Themen.',
      },
      {
        question: 'Gibt es besondere Hinweise zu Fairplay und Verhalten?',
        answer:
          'Ja. Wir setzen auf respektvollen Umgang, sportliches Verhalten und Einhaltung der Turnierregeln für einen fairen Ablauf für alle.',
      },
    ],
  },
];

function Footer() {
  return (
    <footer className="bg-white py-16 lg:py-24 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/">
              <DynamicLogo />
            </Link>
            <p className="mt-6 text-slate-500 text-sm leading-relaxed font-medium">
              Darts-Sport auf höchstem Niveau in Puschendorf. Organisiert für Spieler von Spielern.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Event</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/tournament/register" className="hover:text-slate-900 transition-colors">Anmeldung</Link></li>
              <li><Link href="/tournament/champions" className="hover:text-slate-900 transition-colors">Champions</Link></li>
              <li><Link href="/sponsors" className="hover:text-slate-900 transition-colors">Sponsoren</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/contact" className="hover:text-slate-900 transition-colors">Kontakt</Link></li>
              <li><Link href="/faq" className="hover:text-slate-900 transition-colors">Häufige Fragen</Link></li>
              <li><Link href="/anfahrt" className="hover:text-slate-900 transition-colors">Anfahrt</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 tracking-tight">Rechtliches</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/impressum" className="hover:text-slate-900 transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-slate-900 transition-colors">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-slate-900 transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Dart Masters Puschendorf.</p>
          <div className="flex gap-6">
            <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">Built for the game.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PageHeader />
      <main>
        <section className="container mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-4">Support</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Häufige Fragen (FAQ)</h1>
          <p className="text-slate-600 leading-relaxed mb-10 max-w-3xl">
            Hier findest du Antworten auf die wichtigsten Fragen rund um Anmeldung, Ablauf und Teilnahme beim Turnier.
          </p>

          <div className="space-y-10">
            {faqSections.map((section) => (
              <section key={section.title} aria-labelledby={`faq-${section.title}`}>
                <h2 id={`faq-${section.title}`} className="text-xl font-semibold tracking-tight mb-4">
                  {section.title}
                </h2>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/40 p-4 sm:p-6">
                  {section.items.map((item) => (
                    <details
                      key={item.question}
                      className="group rounded-md border border-slate-200 bg-white p-4 open:shadow-sm"
                    >
                      <summary className="cursor-pointer list-none pr-8 text-sm sm:text-base font-semibold text-slate-900">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/contact" className="inline-block text-slate-900 font-medium hover:underline">
              Kontakt aufnehmen
            </Link>
            <span className="hidden sm:inline text-slate-300">|</span>
            <Link href="/" className="inline-block text-slate-900 font-medium hover:underline">
              Zurück zur Startseite
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}