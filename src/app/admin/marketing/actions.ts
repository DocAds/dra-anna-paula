"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GoogleAdsConversion } from "@/lib/marketing";

export type MarketingInput = {
  enabled: boolean;
  gtm_id: string;
  ga4_id: string;
  google_ads_id: string;
  google_ads_conversions: GoogleAdsConversion[];
  meta_pixel_id: string;
  meta_capi_token: string;
  meta_capi_test_code: string;
  tiktok_pixel_id: string;
  custom_head: string;
  custom_body: string;
};

const clean = (v: string) => (v?.trim() ? v.trim() : null);

export async function saveMarketing(input: MarketingInput) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") throw new Error("Sem permissão");

  const conversions = (input.google_ads_conversions ?? [])
    .filter((c) => c.conversionId?.trim() && c.label?.trim())
    .map((c) => ({
      id: c.id,
      nome: c.nome?.trim() || "Conversão",
      conversionId: c.conversionId.trim(),
      label: c.label.trim(),
      event: c.event,
    }));

  const update: Record<string, unknown> = {
    enabled: input.enabled,
    gtm_id: clean(input.gtm_id),
    ga4_id: clean(input.ga4_id),
    google_ads_id: clean(input.google_ads_id),
    google_ads_conversions: conversions,
    meta_pixel_id: clean(input.meta_pixel_id),
    meta_capi_test_code: clean(input.meta_capi_test_code),
    tiktok_pixel_id: clean(input.tiktok_pixel_id),
    custom_head: clean(input.custom_head),
    custom_body: clean(input.custom_body),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  // O token CAPI (segredo) só é atualizado quando um novo valor é digitado.
  const capi = (input.meta_capi_token ?? "").trim();
  if (capi) update.meta_capi_token = capi;

  const { error } = await sb.from("marketing_settings").update(update).eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketing");
  revalidatePath("/", "layout");
}
