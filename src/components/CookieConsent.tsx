"use client";

import { useEffect } from "react";
import * as CC from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { setConsent } from "@/lib/consent";

/**
 * Banner de consentimento (LGPD) + ponte para o Google Consent Mode v2.
 * Categorias: necessary (sempre on), analytics, marketing.
 * Ao mudar, atualiza o gtag consent e avisa o TrackingScripts via evento.
 */
export function CookieConsent() {
  useEffect(() => {
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
  }, []);

  return null;
}
