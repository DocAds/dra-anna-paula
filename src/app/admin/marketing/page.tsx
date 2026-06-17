import { createClient } from "@/lib/supabase/server";
import { MarketingForm } from "./MarketingForm";
import type { MarketingSettings, GoogleAdsConversion } from "@/lib/marketing";
import { requireSection } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  await requireSection("marketing");
  const sb = await createClient();
  const { data } = await sb.from("marketing_settings").select("*").eq("id", 1).maybeSingle();

  // O token CAPI nunca é enviado ao cliente — só indicamos se já existe.
  const settings: MarketingSettings = {
    enabled: data?.enabled ?? true,
    gtm_id: data?.gtm_id ?? null,
    ga4_id: data?.ga4_id ?? null,
    google_ads_id: data?.google_ads_id ?? null,
    google_ads_conversions: Array.isArray(data?.google_ads_conversions)
      ? (data!.google_ads_conversions as GoogleAdsConversion[])
      : [],
    meta_pixel_id: data?.meta_pixel_id ?? null,
    meta_capi_token: null,
    meta_capi_test_code: data?.meta_capi_test_code ?? null,
    tiktok_pixel_id: data?.tiktok_pixel_id ?? null,
    custom_head: data?.custom_head ?? null,
    custom_body: data?.custom_body ?? null,
  };

  return (
    <main className="p-8 md:p-12">
      <div className="text-[11px] uppercase tracking-widest3 text-cocoa mb-3">Marketing</div>
      <h1 className="font-display text-4xl text-ink mt-3 mb-2">Rastreamento e tags</h1>
      <p className="text-sm text-ink/70 mb-8 max-w-2xl">
        Centralize aqui os códigos de Google, Meta, TikTok e tags personalizadas. As alterações
        publicam no site assim que você salvar.
      </p>
      <MarketingForm settings={settings} hasCapiToken={Boolean(data?.meta_capi_token)} />
    </main>
  );
}
