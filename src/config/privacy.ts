export const privacyConfig = {
  lastUpdated: "21. April 2026",
  cookieBanner: {
    title: "Privatsphäre & Cookies",
    description: "Diese Website verwendet Cookies und ähnliche Technologien (wie Local Storage), um Ihnen die bestmögliche Funktionalität bieten zu können. Technisch notwendige Dienste sind für den Betrieb der Seite unerlässlich. Weitere Dienste helfen uns, unser Angebot zu verbessern. Ihre getroffene Auswahl können Sie in unserer Datenschutzerklärung jederzeit ändern.",
    acceptAllText: "Alle akzeptieren",
    acceptEssentialText: "Nur Notwendige",
    manageText: "Einstellungen ändern",
    savedText: "Ihre Cookie-Einstellungen wurden erfolgreich gespeichert.",
  },
  services: [
    {
      id: "essential",
      title: "Technisch Notwendige Logins & Cookies",
      description: "Diese Dienste und lokal gespeicherten Daten sind für die Grundfunktionen der Website zwingend erforderlich (z.B. Erhaltung Ihrer Login-Session über NextAuth, Speicherung der Cookie-Präferenzen).",
      required: true,
      cookies: ["next-auth.session-token", "next-auth.csrf-token", "cookie-consent"]
    },
    {
      id: "payment",
      title: "Zahlungsanbieter (Stripe)",
      description: "Um Ihnen die Teilnahmegebühr online berechnen zu können, wird Stripe als Zahlungsdienstleister eingebunden. Stripe setzt eigene Cookies zur Betrugsprävention und sicheren Abwicklung von Zahlungen.",
      required: true,
      cookies: ["__stripe_mid", "__stripe_sid"]
    },
    {
      id: "analytics",
      title: "Statistiken & Analysen",
      description: "Helfen uns zu verstehen, wie Besucher mit der Website interagieren. Diese Daten sind anonym und helfen uns, Fehler zu finden und das Erlebnis zu verbessern.",
      required: false,
      cookies: ["_ga", "_gid"]
    }
  ]
};
