import type { GoogleAdsConversion, ConversionEvent } from "@/lib/marketing";

/**
 * Dispara as conversões do Google Ads ligadas a um evento do site.
 * Usa o mapa exposto pelo TrackingScripts em window.__adsConversions.
 */
export function fireAdsConversion(event: ConversionEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __adsConversions?: GoogleAdsConversion[];
    gtag?: (...args: unknown[]) => void;
  };
  if (!w.gtag || !Array.isArray(w.__adsConversions)) return;
  for (const c of w.__adsConversions) {
    if (c.event !== event || !c.conversionId || !c.label) continue;
    w.gtag("event", "conversion", {
      send_to: `${c.conversionId}/${c.label}`,
      ...params,
    });
  }
}
