import { createAdminClient } from "@/lib/supabase/server";

export type ConversionEvent = "lead" | "whatsapp" | "agendamento" | "pageview";

export type GoogleAdsConversion = {
  id: string; // id interno do item (uuid client-side)
  nome: string; // rótulo amigável p/ o admin
  conversionId: string; // AW-XXXXXXXXX
  label: string; // rótulo da conversão
  event: ConversionEvent; // evento do site que dispara
};

export type MarketingSettings = {
  enabled: boolean;
  gtm_id: string | null;
  ga4_id: string | null;
  google_ads_id: string | null;
  google_ads_conversions: GoogleAdsConversion[];
  meta_pixel_id: string | null;
  meta_capi_token: string | null;
  meta_capi_test_code: string | null;
  tiktok_pixel_id: string | null;
  custom_head: string | null;
  custom_body: string | null;
};

// Subconjunto seguro p/ enviar ao cliente (sem segredos).
export type PublicMarketing = {
  enabled: boolean;
  gtmId: string | null;
  ga4Id: string | null;
  googleAdsId: string | null;
  conversions: GoogleAdsConversion[];
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  customHead: string | null;
  customBody: string | null;
};

const EMPTY: MarketingSettings = {
  enabled: true,
  gtm_id: null,
  ga4_id: null,
  google_ads_id: null,
  google_ads_conversions: [],
  meta_pixel_id: null,
  meta_capi_token: null,
  meta_capi_test_code: null,
  tiktok_pixel_id: null,
  custom_head: null,
  custom_body: null,
};

/** Leitura completa (inclui segredos). Apenas servidor. */
export async function getMarketingSettings(): Promise<MarketingSettings> {
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("marketing_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return EMPTY;
    return {
      ...EMPTY,
      ...data,
      google_ads_conversions: Array.isArray(data.google_ads_conversions)
        ? (data.google_ads_conversions as GoogleAdsConversion[])
        : [],
    };
  } catch {
    return EMPTY;
  }
}

/** Subconjunto público (sem token CAPI). Para injeção dos scripts. */
export async function getPublicMarketing(): Promise<PublicMarketing> {
  const m = await getMarketingSettings();
  return {
    enabled: m.enabled,
    gtmId: m.gtm_id,
    ga4Id: m.ga4_id,
    googleAdsId: m.google_ads_id,
    conversions: m.google_ads_conversions,
    metaPixelId: m.meta_pixel_id,
    tiktokPixelId: m.tiktok_pixel_id,
    customHead: m.custom_head,
    customBody: m.custom_body,
  };
}
