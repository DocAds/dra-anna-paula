import type { Metadata } from "next";
import "./globals.css";
import { PublicChrome } from "@/components/PublicChrome";
import { TrackingScripts } from "@/components/TrackingScripts";
import { CookieConsent } from "@/components/CookieConsent";

// Google Consent Mode v2 — default NEGADO, roda antes de qualquer tag do Google.
const CONSENT_DEFAULT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);
`;

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,144,400..700,50;0,144,500..700,100;1,144,400..600,50&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <TrackingScripts />
        <CookieConsent />
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
