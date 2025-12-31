import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "@/components/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXTAUTH_URL || "https://dartsturnier-puschendorf.de";

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Darts Masters Puschendorf 2026 | Das Darts-Event des Jahres",
    template: "%s | Darts Masters Puschendorf"
  },
  description: "Melde dich an für das Darts Masters Puschendorf 2026. Das professionelle Darts-Turnier für 64 Spieler mit Live-Scoring, Statistiken und spannenden Matches.",
  keywords: ["Darts", "Turnier", "Puschendorf", "Darts Masters", "E-Darts", "Steeldarts", "Turnierbaum", "Live Score", "Sportevent", "Franken"],
  authors: [{ name: "Darts Masters Team" }],
  creator: "Darts Masters Team",
  publisher: "Darts Masters Puschendorf",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: baseUrl,
    title: "Darts Masters Puschendorf 2026",
    description: "Das größte Darts-Event der Region. 64 Spieler, ein Ziel. Sei dabei!",
    siteName: "Darts Masters Puschendorf",
    images: [
      {
        url: "/LogoFW-Pudo2013-.png",
        width: 1200,
        height: 630,
        alt: "Darts Masters Puschendorf 2026 Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Darts Masters Puschendorf 2026",
    description: "Das größte Darts-Event der Region. 64 Spieler, ein Ziel.",
    images: ["/LogoFW-Pudo2013-.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": "Darts Masters Puschendorf 2026",
    "description": "Professionelles Darts-Turnier für 64 Spieler im K.O.-System.",
    "startDate": "2026-02-15T10:00:00+01:00",
    "endDate": "2026-02-15T22:00:00+01:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "Sportheim Puschendorf",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Waldstraße 1",
        "addressLocality": "Puschendorf",
        "postalCode": "90617",
        "addressCountry": "DE"
      }
    },
    "image": [
      `${baseUrl}/og-image.jpg`
    ],
    "organizer": {
      "@type": "Organization",
      "name": "Darts Masters Puschendorf",
      "url": baseUrl
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/tournament/register`,
      "price": "10.00",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-12-01T00:00:00+01:00"
    }
  };

  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
