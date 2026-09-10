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
const CHAVE_EXTRA = "docads:extra";

export type PacoteUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type Entrada = { landing_path?: string; referrer?: string };

// Identificadores que as plataformas colam na URL e que ninguém lia. O
// gad_campaignid resolve sozinho o "de qual campanha veio" do Google, que hoje
// chega vazio em 9 de 9 leads mesmo com o número viajando na própria URL.
const CHAVES_EXTRA = [
  "gad_campaignid",
  "gbraid",
  "wbraid",
  "gad_source",
  "utm_id",
  "utm_adgroup",
  "utm_matchtype",
  "utm_network",
  "utm_device",
  "ad_id",
  "adset_id",
  "placement",
  "site_source",
  "ttclid",
] as const;

export type OrigemExtra = Partial<Record<(typeof CHAVES_EXTRA)[number], string>>;

// Duas memórias, duas bases legais:
//
// - sessão (sessionStorage): medição de primeira parte, dura só a visita e não
//   sai do navegador para lugar nenhum a não ser junto do lead que a própria
//   pessoa enviou. É o que permite saber a origem de quem não interage com o
//   banner, que hoje é a maioria: 36% dos leads chegam sem origem alguma.
// - 90 dias (localStorage): memória de marketing, só depois do consentimento.
const guardaNaSessao = (chave: string, valor: unknown) => {
  try {
    sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* modo privado: seguir sem persistir */
  }
};

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
    if (raw) {
      const parsed = JSON.parse(raw) as { v: T; exp: number };
      if (parsed.exp >= Date.now()) return parsed.v;
    }
  } catch {
    /* segue para a sessão */
  }
  try {
    const raw = sessionStorage.getItem(chave);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* nada guardado */
  }
  return null;
};

function lePacoteDaUrl(): { utm: PacoteUtm; extra: OrigemExtra; gclid?: string; fbclid?: string } {
  const p = new URL(window.location.href).searchParams;
  const utm: PacoteUtm = {};
  (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
    const v = p.get(k);
    if (v) utm[k] = v.slice(0, 200);
  });
  const extra: OrigemExtra = {};
  CHAVES_EXTRA.forEach((k) => {
    const v = p.get(k);
    if (v) extra[k] = v.slice(0, 200);
  });
  return {
    utm,
    extra,
    gclid: p.get("gclid") || undefined,
    fbclid: p.get("fbclid") || undefined,
  };
}

/**
 * Captura a origem da visita. Roda no primeiro render de qualquer página, sem
 * esperar o banner.
 *
 * Por que não pode esperar: o banner é uma caixa no canto que não bloqueia o
 * site, e quem simplesmente ignora nunca dispara callback nenhum. Essa pessoa
 * navegava, convertia, e o lead chegava sem campanha, sem clique de anúncio e
 * sem página de entrada. Além disso, capturar só no aceite fazia o "primeiro
 * toque" apontar para a página onde a pessoa clicou em Aceitar, não para a
 * página por onde ela entrou.
 */
export const capturaOrigem = () => {
  if (typeof window === "undefined") return;
  const { utm, extra, gclid, fbclid } = lePacoteDaUrl();

  if (gclid) guardaNaSessao("docads:gclid", gclid);
  if (fbclid) guardaNaSessao("docads:fbclid", fbclid);
  if (Object.keys(utm).length) guardaNaSessao(CHAVE_UTM, utm);
  if (Object.keys(extra).length) guardaNaSessao(CHAVE_EXTRA, extra);

  // Entrada é primeiro toque: grava uma vez por sessão e nunca sobrescreve.
  try {
    if (!sessionStorage.getItem(CHAVE_ENTRADA)) {
      const ref = document.referrer || "";
      const externo = ref && !ref.startsWith(window.location.origin) ? ref.slice(0, 500) : "";
      guardaNaSessao(CHAVE_ENTRADA, {
        landing_path: window.location.pathname.slice(0, 200),
        referrer: externo || undefined,
      });
    }
  } catch {
    /* storage indisponível */
  }
};

/**
 * Promove o que está na sessão para os 90 dias, depois do consentimento de
 * marketing. Só isto fica atrás do gate, porque memória longa entre visitas é
 * que depende de aceite.
 */
export const persistOrigem = () => {
  if (typeof window === "undefined") return;
  capturaOrigem();
  const gclid = le<string>("docads:gclid");
  const fbclid = le<string>("docads:fbclid");
  const utm = le<PacoteUtm>(CHAVE_UTM);
  const extra = le<OrigemExtra>(CHAVE_EXTRA);
  const entrada = le<Entrada>(CHAVE_ENTRADA);
  if (gclid) guarda("docads:gclid", gclid);
  if (fbclid) guarda("docads:fbclid", fbclid);
  if (utm && Object.keys(utm).length) guarda(CHAVE_UTM, utm);
  if (extra && Object.keys(extra).length) guarda(CHAVE_EXTRA, extra);
  if (entrada) guarda(CHAVE_ENTRADA, entrada);
};

export const readClickId = (key: "gclid" | "fbclid") => {
  const daUrl = typeof window !== "undefined"
    ? new URL(window.location.href).searchParams.get(key)
    : null;
  return daUrl || le<string>(`docads:${key}`);
};

/** UTM da URL atual, caindo para o que foi guardado na chegada. */
export const readUtm = (): PacoteUtm => {
  if (typeof window === "undefined") return {};
  const { utm } = lePacoteDaUrl();
  return Object.keys(utm).length ? utm : (le<PacoteUtm>(CHAVE_UTM) ?? {});
};

export const readExtra = (): OrigemExtra => {
  if (typeof window === "undefined") return {};
  const { extra } = lePacoteDaUrl();
  return Object.keys(extra).length ? extra : (le<OrigemExtra>(CHAVE_EXTRA) ?? {});
};

export const readEntrada = (): Entrada => le<Entrada>(CHAVE_ENTRADA) ?? {};

/**
 * Cookies que o Pixel grava. São o par que mais aumenta a correspondência do
 * CAPI, e sem eles o evento de servidor casa mal com o de navegador.
 */
export const readCookiesMeta = (): { fbp?: string; fbc?: string } => {
  if (typeof document === "undefined") return {};
  const pega = (nome: string) =>
    document.cookie.split("; ").find((c) => c.startsWith(`${nome}=`))?.split("=")[1];
  return { fbp: pega("_fbp"), fbc: pega("_fbc") };
};

/**
 * Apaga a memória de origem. Chamada quando o consentimento de marketing é
 * revogado: sem isso o que já estava guardado continuava viajando no próximo
 * lead, ou seja, a revogação não revogava nada.
 */
export const limpaOrigem = () => {
  if (typeof window === "undefined") return;
  try {
    [
      "docads:gclid",
      "docads:fbclid",
      CHAVE_UTM,
      CHAVE_ENTRADA,
      CHAVE_EXTRA,
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage indisponível: nada a limpar */
  }
};
