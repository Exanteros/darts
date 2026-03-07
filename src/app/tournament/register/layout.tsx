import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anmeldung",
  description: "Melde dich jetzt für das Dart Masters Puschendorf an. Sichere dir einen der begehrten Startplätze.",
  openGraph: {
    title: "Anmeldung | Dart Masters Puschendorf",
    description: "Sichere dir deinen Startplatz für das Darts-Event des Jahres!",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
