import type { Metadata } from "next";
import "./globals.css";
import { PublicChrome } from "@/components/PublicChrome";
import { Tracker } from "@/components/Tracker";

export const metadata: Metadata = {
  title: {
    default: "Dra. Anna Paula Bomtempo — Dermatologia em São Paulo",
    template: "%s · Dra. Anna Bomtempo",
  },
  description:
    "Dermatologia premium em São Paulo. Tratamentos personalizados, tecnologia de ponta e acompanhamento próximo. Vila Olímpia e Jardim Paulista.",
  metadataBase: new URL("https://draannabomtempo.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Dra. Anna Paula Bomtempo — Dermatologia",
    description:
      "Rejuvenescimento facial, lasers e tratamentos premium personalizados. CRM 177.888.",
    siteName: "Dra. Anna Bomtempo",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,144,400..700,50;0,144,500..700,100;1,144,400..600,50&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <Tracker />
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
