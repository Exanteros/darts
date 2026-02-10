export default function ParticipantsPage() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold mb-4">Teilnehmerliste</h1>
        <p className="text-slate-600 mb-6">Hier erscheint die aktuelle Liste aller angemeldeten Teilnehmer. Diese Seite ist ein Platzhalter und wird automatisch mit Live‑Daten verknüpft, sobald das System Teilnehmer erfasst.</p>
        <a href="/tournament/register" className="inline-block text-slate-900 font-medium hover:underline">Zur Anmeldung</a>
      </div>
    </div>
  );
}