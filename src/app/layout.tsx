import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { PublicChrome } from "@/components/PublicChrome";
import { TrackingScripts } from "@/components/TrackingScripts";
import { CookieConsent } from "@/components/CookieConsent";
import { JsonLd } from "@/components/JsonLd";
import { organizationSchema } from "@/lib/schema";
import { BASE_URL, OG_IMAGE_PADRAO } from "@/lib/seo";

// Google Consent Mode v2 — default NEGADO, roda antes de qualquer tag do Google.
const CONSENT_DEFAULT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);
`;

// Self-hospedadas pelo next/font: sem request ao fonts.googleapis.com no caminho
// crítico. Os eixos SOFT/opsz alimentam o font-variation-settings do globals.css.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dra. Anna Paula Bomtempo · Dermatologista em São Paulo",
    template: "%s · Dra. Anna Bomtempo",
  },
  description:
    "Dermatologia premium em São Paulo. Tratamentos personalizados, tecnologia de ponta e acompanhamento próximo, na Vila Olímpia.",
  metadataBase: new URL(BASE_URL),
  // Sem alternates aqui: canonical é herdado pelas rotas filhas, e uma página
  // que esquecesse de declarar o seu apontaria para a home.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    title: "Dra. Anna Paula Bomtempo · Dermatologista",
    description:
      "Rejuvenescimento facial, lasers e tratamentos premium personalizados. CRM 177.888.",
    siteName: "Dra. Anna Bomtempo",
    images: [OG_IMAGE_PADRAO],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
      </head>
      <body className="font-sans antialiased">
        <JsonLd schema={organizationSchema} />
        <TrackingScripts />
        <CookieConsent />
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
