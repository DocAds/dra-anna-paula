"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as CC from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { setConsent } from "@/lib/consent";
import { limpaOrigem } from "@/lib/tracking";

/**
 * Banner de consentimento (LGPD) + ponte para o Google Consent Mode v2.
 * Categorias: necessary (sempre on), analytics, marketing.
 * Ao mudar, atualiza o gtag consent e avisa o TrackingScripts via evento.
 */
export function CookieConsent() {
  // O painel não carrega tag de marketing nenhuma (TrackingScripts para no
  // /admin), então o banner ali só atrapalha quem está atendendo: cobre o canto
  // da tela de leads e pede consentimento para algo que não acontece.
  const pathname = usePathname();
  const noPainel = pathname.startsWith("/admin") || pathname.startsWith("/login");

  useEffect(() => {
    if (noPainel) return;
    const sync = () => {
      const analytics = CC.acceptedCategory("analytics");
      const marketing = CC.acceptedCategory("marketing");

      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: analytics ? "granted" : "denied",
          ad_storage: marketing ? "granted" : "denied",
          ad_user_data: marketing ? "granted" : "denied",
          ad_personalization: marketing ? "granted" : "denied",
        });
      }

      // Revogar marketing tem que apagar também o que já foi guardado: gclid,
      // fbclid, utm e página de entrada continuavam no navegador e seguiam
      // viajando no próximo lead.
      if (!marketing) limpaOrigem();

      setConsent({ analytics, marketing });
    };

    CC.run({
      guiOptions: {
        consentModal: { layout: "box inline", position: "bottom left" },
        preferencesModal: { layout: "box" },
      },
      onFirstConsent: sync,
      onConsent: sync,
      onChange: sync,
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {},
        marketing: {},
      },
      language: {
        default: "pt",
        translations: {
          pt: {
            consentModal: {
              title: "Sua privacidade",
              description:
                "Usamos cookies para entender como o site é usado e para medir nossas campanhas. Você escolhe o que aceitar. Os cookies essenciais ficam sempre ativos.",
              acceptAllBtn: "Aceitar todos",
              acceptNecessaryBtn: "Recusar",
              showPreferencesBtn: "Preferências",
              footer: '<a href="/privacidade">Política de Privacidade</a>',
            },
            preferencesModal: {
              title: "Preferências de cookies",
              acceptAllBtn: "Aceitar todos",
              acceptNecessaryBtn: "Recusar todos",
              savePreferencesBtn: "Salvar preferências",
              closeIconLabel: "Fechar",
              sections: [
                {
                  title: "Cookies essenciais",
                  description:
                    "Necessários para o funcionamento básico do site. Ficam sempre ativos.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Análise de uso",
                  description:
                    "Ajudam a entender como os visitantes navegam pelo site (ex.: Google Analytics).",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketing",
                  description:
                    "Permitem medir e personalizar anúncios (ex.: Meta Pixel, Google Ads, TikTok).",
                  linkedCategory: "marketing",
                },
                {
                  title: "Mais informações",
                  description:
                    'Dúvidas sobre como tratamos seus dados? Veja a <a href="/privacidade">Política de Privacidade</a>.',
                },
              ],
            },
          },
        },
      },
    });
  }, [noPainel]);

  return null;
}
