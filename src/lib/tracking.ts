declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const trackLead = (payload: { source: string; value?: number; phone?: string; email?: string }) => {
  if (typeof window === "undefined") return;
  const eventId = uuid();

  if (window.fbq) {
    window.fbq("track", "Lead", { content_name: payload.source, value: payload.value ?? 0, currency: "BRL" }, { eventID: eventId });
  }
  if (window.gtag) {
    window.gtag("event", "generate_lead", {
      currency: "BRL",
      value: payload.value ?? 0,
      transaction_id: eventId,
      source: payload.source,
    });
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: "lead", source: payload.source, value: payload.value ?? 0, event_id: eventId });
  }

  fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, event_id: eventId, ts: Date.now() }),
  }).catch(() => undefined);
};

export const trackWhatsapp = (source: string) =>
  trackLead({ source: `whatsapp:${source}` });

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
