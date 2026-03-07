import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login für Teilnehmer und Administratoren des Dart Masters Puschendorf.",
  robots: {
    index: false, // Login pages usually shouldn't be indexed
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
