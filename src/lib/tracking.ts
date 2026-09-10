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

const TTL_ORIGEM = 90 * 24 * 60 * 60 * 1000;
const CHAVE_UTM = "docads:utm";
const CHAVE_ENTRADA = "docads:entrada";

export type PacoteUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type Entrada = { landing_path?: string; referrer?: string };

const guarda = (chave: string, valor: unknown) => {
  try {
    localStorage.setItem(chave, JSON.stringify({ v: valor, exp: Date.now() + TTL_ORIGEM }));
  } catch {
    /* modo privado ou cota cheia: seguir sem persistir */
  }
};

const le = <T,>(chave: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(chave);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: T; exp: number };
    if (parsed.exp < Date.now()) return null;
    return parsed.v;
  } catch {
    return null;
  }
};

/**
 * Guarda de onde a visita veio, para o lead saber disso na hora do envio.
 *
 * Por que não basta ler a URL no envio: quem clica no anúncio cai na home com
 * ?utm_campaign=..., navega para a página do tratamento e só então pede
 * contato. Nessa segunda página a query já não existe, e o lead chegava ao CRM
 * sem campanha nenhuma — o filtro por origem no painel mostrava vazio para a
 * maior parte do tráfego pago.
 *
 * Duas memórias diferentes, de propósito:
 * - clique de anúncio e utm: ÚLTIMO toque, porque é a campanha que trouxe.
 * - página de entrada e referrer: PRIMEIRO toque, gravados uma vez só, porque
 *   descrevem por onde a pessoa entrou no site.
 */
export const persistOrigem = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const p = url.searchParams;

  const gclid = p.get("gclid");
  const fbclid = p.get("fbclid");
  if (gclid) guarda("docads:gclid", gclid);
  if (fbclid) guarda("docads:fbclid", fbclid);

  const utm: PacoteUtm = {};
  (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
    const v = p.get(k);
    if (v) utm[k] = v.slice(0, 200);
  });
  if (Object.keys(utm).length) guarda(CHAVE_UTM, utm);

  if (!le<Entrada>(CHAVE_ENTRADA)) {
    const ref = document.referrer || "";
    // Navegação interna não é referência: só interessa quem veio de fora.
    const externo = ref && !ref.startsWith(window.location.origin) ? ref.slice(0, 500) : "";
    guarda(CHAVE_ENTRADA, { landing_path: url.pathname.slice(0, 200), referrer: externo || undefined });
  }
};

/** Mantido pelo nome antigo enquanto houver chamador legado. */
export const persistGclid = persistOrigem;

export const readClickId = (key: "gclid" | "fbclid") => le<string>(`docads:${key}`);

/** UTM da URL atual, caindo para o último toque guardado. */
export const readUtm = (): PacoteUtm => {
  if (typeof window === "undefined") return {};
  const p = new URL(window.location.href).searchParams;
  const daUrl: PacoteUtm = {};
  (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
    const v = p.get(k);
    if (v) daUrl[k] = v;
  });
  return Object.keys(daUrl).length ? daUrl : (le<PacoteUtm>(CHAVE_UTM) ?? {});
};

export const readEntrada = (): Entrada => le<Entrada>(CHAVE_ENTRADA) ?? {};

/**
 * Apaga a memória de origem. Chamada quando o consentimento de marketing é
 * revogado: sem isso o que já estava guardado continuava viajando no próximo
 * lead, ou seja, a revogação não revogava nada.
 */
export const limpaOrigem = () => {
  if (typeof window === "undefined") return;
  try {
    ["docads:gclid", "docads:fbclid", CHAVE_UTM, CHAVE_ENTRADA].forEach((k) =>
      localStorage.removeItem(k)
    );
  } catch {
    /* storage indisponível: nada a limpar */
  }
};
