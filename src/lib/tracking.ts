import { fireAdsConversion } from "@/lib/fire-conversion";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    __adsConversions?: Array<{ event: string }>;
  }
}

export const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Quantas conversões do Google Ads estão ligadas a um evento (só p/ diagnóstico).
const adsCount = (event: string) =>
  typeof window !== "undefined" && Array.isArray(window.__adsConversions)
    ? window.__adsConversions.filter((c) => c.event === event).length
    : 0;

// Espelha cada disparo para o painel de diagnóstico (TrackingDebugPanel), que
// escuta este evento. Não faz nada em produção sem o painel montado.
function emitTrackDebug(detail: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("anna:track:debug", { detail: { ...detail, t: Date.now() } }));
  } catch {
    /* CustomEvent indisponível: ignora */
  }
}

/**
 * Dispara o lead em todos os destinos com o mesmo event_id.
 * O event_id é o que deduplica o Pixel client-side contra o CAPI server-side
 * (/api/lead reenvia o mesmo id pro Graph).
 */
export const trackLead = (payload: { source: string; eventId: string; value?: number }) => {
  if (typeof window === "undefined") return;
  const { source, eventId, value = 0 } = payload;

  window.fbq?.(
    "track",
    "Lead",
    { content_name: source, value, currency: "BRL" },
    { eventID: eventId }
  );
  window.gtag?.("event", "generate_lead", {
    currency: "BRL",
    value,
    transaction_id: eventId,
    source,
  });
  window.dataLayer?.push({ event: "lead", source, value, event_id: eventId });
  fireAdsConversion("lead", { transaction_id: eventId });

  emitTrackDebug({
    type: "lead",
    source,
    eventId,
    fbq: !!window.fbq,
    gtag: !!window.gtag,
    ads: adsCount("lead"),
  });
};

/**
 * Clique em qualquer CTA de WhatsApp. É intenção, não lead: o lead só existe
 * depois que o modal é enviado. Só vira conversão do Ads se houver uma conversão
 * cadastrada no painel com event="whatsapp".
 */
export const trackWhatsappClick = (source: string) => {
  if (typeof window === "undefined") return;
  const eventId = newEventId();

  window.fbq?.("track", "Contact", { content_name: source }, { eventID: eventId });
  window.gtag?.("event", "whatsapp_click", { source, transaction_id: eventId });
  window.dataLayer?.push({ event: "whatsapp_click", source, event_id: eventId });
  fireAdsConversion("whatsapp", { transaction_id: eventId });

  emitTrackDebug({
    type: "whatsapp_click",
    source,
    eventId,
    fbq: !!window.fbq,
    gtag: !!window.gtag,
    ads: adsCount("whatsapp"),
  });
};

export const persistGclid = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const gclid = url.searchParams.get("gclid");
  const fbclid = url.searchParams.get("fbclid");
  const ttl = 90 * 24 * 60 * 60 * 1000;
  if (gclid) localStorage.setItem("docads:gclid", JSON.stringify({ v: gclid, exp: Date.now() + ttl }));
  if (fbclid) localStorage.setItem("docads:fbclid", JSON.stringify({ v: fbclid, exp: Date.now() + ttl }));
};

export const readClickId = (key: "gclid" | "fbclid") => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`docads:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: string; exp: number };
    if (parsed.exp < Date.now()) return null;
    return parsed.v;
  } catch {
    return null;
  }
};
