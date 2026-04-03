"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";

function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-slate-600">
        <p>© {new Date().getFullYear()} Dart Masters Puschendorf. Built for the game.</p>
      </div>
    </footer>
  );
}

const sections = [
  {
    title: "1. Geltungsbereich",
    text: "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Anmeldung und Teilnahme am Dart Masters Turnier in Puschendorf. Veranstalter ist der Verein Freie Wähler Puschendorf e.V.\n\nDas Turnier ist eine Hobby- und Vereinsveranstaltung. Es handelt sich nicht um eine berufssportliche oder gewerbliche Liga.\n\nMit Absenden der Anmeldung akzeptierst du diese AGB in der zum Anmeldezeitpunkt geltenden Fassung.",
  },
  {
    title: "2. Veranstalter und Rechtsnatur",
    text: "Veranstalter und organisatorisch Verantwortlicher ist:\nFreie Wähler Puschendorf e.V.\nAsternstraße 17\n90617 Puschendorf\n\nDiese AGB regeln das vereinsbezogene Teilnahmeverhältnis zwischen Veranstalter und teilnehmender Person. Ergänzend gelten die auf der Website veröffentlichten Turnierinformationen in ihrer jeweils aktuellen Fassung.",
  },
  {
    title: "3. Teilnahmevoraussetzungen",
    text: "Teilnahmeberechtigt sind natürliche Personen, die die in der Ausschreibung genannten Voraussetzungen erfüllen.\n\nDer Veranstalter ist berechtigt, Anmeldungen abzulehnen, wenn sachliche Gründe vorliegen, insbesondere bei Verstößen gegen Regelwerk, Fairplay oder Sicherheitsanforderungen aus früheren Veranstaltungen.",
  },
  {
    title: "4. Anmeldung und Vertragsschluss",
    text: "Die Anmeldung erfolgt über die auf der Website vorgesehenen Anmeldewege.\n\nEin Teilnahmeverhältnis kommt zustande, sobald die Anmeldung durch den Veranstalter bestätigt wurde.\n\nEin Anspruch auf Teilnahme besteht nur im Rahmen verfügbarer Plätze. Bei Erreichen der Kapazität kann eine Warteliste geführt werden.",
  },
  {
    title: "5. Teilnahmebeitrag, Zahlung und Fälligkeit",
    text: "Die Höhe des Teilnahmebeitrags ergibt sich aus der jeweiligen Turnierausschreibung.\n\nZahlungen können per Karte sowie über die jeweils zusätzlich angebotenen Zahlungsarten erfolgen.\n\nDer Teilnahmebeitrag ist mit Buchung fällig, soweit in der Ausschreibung nichts Abweichendes geregelt ist. Bei nicht erfolgreicher Zahlung kann der Platz storniert und anderweitig vergeben werden.",
  },
  {
    title: "6. Stornierung durch Teilnehmende (Storno-Frist)",
    text: "Eine kostenfreie Stornierung ist bis 14 Kalendertage vor dem offiziellen Turnierbeginn (00:00 Uhr Ortszeit) möglich.\n\nBei Stornierung ab dem 13. bis einschließlich 7. Kalendertag vor Turnierbeginn kann eine Bearbeitungspauschale in Höhe von 25 % des Teilnahmebeitrags einbehalten werden.\n\nBei Stornierung ab 6 Kalendertagen vor Turnierbeginn oder bei Nichterscheinen ist eine Erstattung grundsätzlich ausgeschlossen, sofern kein gesetzlicher Erstattungsanspruch besteht.\n\nMaßgeblich ist der Zeitpunkt des Eingangs der Stornierung in Textform (z. B. per E-Mail) beim Veranstalter.",
  },
  {
    title: "7. Umbuchung und Ersatzteilnehmende",
    text: "Eine Umbuchung auf eine andere Person ist bis 7 Kalendertage vor Turnierbeginn möglich, sofern die Ersatzperson alle Teilnahmevoraussetzungen erfüllt.\n\nDer Veranstalter kann für die Umbuchung eine angemessene Bearbeitungspauschale erheben.\n\nNach Ablauf dieser Frist besteht kein Anspruch auf Umbuchung.",
  },
  {
    title: "8. Absage, Verlegung und Änderungen durch den Veranstalter",
    text: "Der Veranstalter kann das Turnier aus wichtigem Grund absagen, verschieben oder in zumutbarer Weise ändern, insbesondere bei höherer Gewalt, behördlichen Anordnungen, Sicherheitsrisiken, Ausfall von Spielstätte oder wesentlichen Ressourcen.\n\nBei Absage ohne Ersatztermin werden bereits gezahlte Teilnahmebeiträge erstattet. Weitergehende Ansprüche sind ausgeschlossen, soweit gesetzlich zulässig.\n\nBei Verlegung auf einen Ersatztermin bleibt die Anmeldung grundsätzlich bestehen. Teilnehmende können in diesem Fall innerhalb einer angemessenen Frist kostenfrei stornieren.",
  },
  {
    title: "9. Turnierdurchführung und Hausrecht",
    text: "Spielmodus, Setzregeln, Ablauf und Zeitpläne richten sich nach der veröffentlichten Ausschreibung und den Anweisungen der Turnierleitung.\n\nDen Weisungen der Turnierleitung und des Hallenpersonals ist aus Sicherheits- und Organisationsgründen Folge zu leisten.\n\nDer Veranstalter übt während der Veranstaltung das Hausrecht aus und kann bei erheblichen Verstößen Teilnehmende ausschließen.",
  },
  {
    title: "10. Fairplay, Verhalten und Ausschluss",
    text: "Unsportliches Verhalten, Beleidigungen, diskriminierende Äußerungen, wiederholte Störungen des Spielbetriebs oder Manipulationsversuche können zum sofortigen Ausschluss führen.\n\nIm Falle eines berechtigten Ausschlusses besteht kein Anspruch auf Erstattung des Teilnahmebeitrags.",
  },
  {
    title: "11. Gesundheit, Eigenverantwortung und Sicherheit",
    text: "Die Teilnahme erfolgt auf eigene Verantwortung. Teilnehmende bestätigen, gesundheitlich in der Lage zu sein, am Turnier teilzunehmen.\n\nSicherheitsanweisungen vor Ort sind verbindlich. Offensichtlich gefährdendes Verhalten kann zum Ausschluss führen.",
  },
  {
    title: "12. Haftung",
    text: "Der Veranstalter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.\n\nBei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypisch vorhersehbaren Schaden begrenzt.\n\nIm Übrigen ist die Haftung des Veranstalters ausgeschlossen, soweit gesetzlich zulässig.\n\nFür Verlust, Diebstahl oder Beschädigung mitgebrachter Gegenstände wird keine Haftung übernommen, es sei denn, der Schaden wurde vom Veranstalter vorsätzlich oder grob fahrlässig verursacht.",
  },
  {
    title: "13. Datenschutz",
    text: "Personenbezogene Daten werden ausschließlich zur Organisation und Durchführung des Turniers verarbeitet. Rechtsgrundlagen, Speicherdauer und Betroffenenrechte ergeben sich aus der Datenschutzerklärung auf der Website.\n\nOhne erforderliche personenbezogene Mindestangaben kann eine Teilnahme organisatorisch nicht durchgeführt werden.",
  },
  {
    title: "14. Bild- und Medienrechte",
    text: "Während der Veranstaltung können Foto- und Videoaufnahmen zur Dokumentation, Berichterstattung und Bewerbung künftiger Vereinsveranstaltungen angefertigt werden, soweit rechtlich zulässig.\n\nSoweit eine Einwilligung erforderlich ist, wird diese gesondert eingeholt. Gesetzliche Widerspruchs- und Schutzrechte bleiben unberührt.",
  },
  {
    title: "15. Schlussbestimmungen",
    text: "Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.\n\nEs gilt das Recht der Bundesrepublik Deutschland. Zwingende Verbraucherschutzvorschriften bleiben unberührt.\n\nDas Turnier wird als Vereins- und Hobbyveranstaltung ohne gewerbliche Gewinnabsicht durchgeführt.",
  },
];

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PageHeader />

      <main className="pt-20 pb-24">
        <section className="container mx-auto max-w-4xl px-6">
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-6">/ Rechtliches ■ AGB</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-12 max-w-3xl">
            Diese AGB regeln die Bedingungen für Anmeldung, Teilnahme und organisatorische Abläufe rund um das Dart Masters Hobbyturnier des Vereins Freie Wähler Puschendorf e.V.
          </p>
          <p className="text-sm text-slate-500 mb-10">Stand: 02.04.2026</p>

          <div className="space-y-4">
            {sections.map((section) => (
              <article key={section.title} className="rounded-md border border-slate-200 bg-white p-6 sm:p-7">
                <h2 className="text-xl font-bold tracking-tight mb-3">{section.title}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{section.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link href="/datenschutz" className="inline-block text-slate-900 font-medium hover:underline">
              Zur Datenschutzerklärung
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