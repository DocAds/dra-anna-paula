import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { getMarketingSettings } from "@/lib/marketing";
import { classificaCanal } from "@/lib/leadOrigem";

const sha = (v: string) =>
  crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

// Anti-flood por IP, na memória do isolate. Não substitui uma regra de Rate
// Limiting na borda (a Cloudflare vê todos os isolates, este contador não),
// mas barra o envio repetido trivial num endpoint público que grava via
// service role. Falha aberta de propósito: perder lead é pior que aceitar um
// envio a mais.
const JANELA_MS = 60 * 60 * 1000;
const MAX_ENVIOS_POR_JANELA = 12;
const TETO_DE_IPS = 5000;
const enviosPorIp = new Map<string, number[]>();

function excedeuLimite(ip: string): boolean {
  if (!ip) return false;
  const agora = Date.now();
  const recentes = (enviosPorIp.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  if (enviosPorIp.size > TETO_DE_IPS) enviosPorIp.clear();
  enviosPorIp.set(ip, recentes);
  return recentes.length > MAX_ENVIOS_POR_JANELA;
}

// A URL que vai para a Meta preserva os parâmetros de campanha (é o que faz o
// evento casar com o anúncio) e descarta o resto da query. Página de
// tratamento vira a raiz: o caminho /tratamentos/<procedimento> nomeia o
// procedimento que a pessoa procurou, e isso é dado de saúde.
const PARAMS_DE_CAMPANHA = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

function normalizaUrl(u: string | undefined): string {
  const padrao = "https://draannabomtempo.com.br";
  if (!u) return padrao;
  try {
    const url = new URL(u);
    const caminho = url.pathname.startsWith("/tratamentos") ? "/" : url.pathname;
    const query = new URLSearchParams();
    PARAMS_DE_CAMPANHA.forEach((k) => {
      const v = url.searchParams.get(k);
      if (v) query.set(k, v);
    });
    const qs = query.toString();
    return `${url.origin}${caminho}${qs ? `?${qs}` : ""}`;
  } catch {
    return padrao;
  }
}

// O rótulo do botão vira categoria genérica antes de sair do servidor. Dado de
// saúde ligado a uma pessoa é o que custa bloqueio de domínio na Meta.
function rotuloNeutro(source: string): string {
  if (source.startsWith("tratamento-")) return "pagina-tratamento";
  if (source.startsWith("form:")) return "formulario";
  if (source.startsWith("whatsapp:")) return "whatsapp";
  if (source === "signature" || source === "signature-agendar") return "tratamento-destaque";
  return source;
}

function temperaturaFromUrgencia(u: string | undefined): "frio" | "morno" | "quente" {
  if (!u) return "morno";
  const v = u.toLowerCase();
  if (v.includes("hoje") || v.includes("semana")) return "quente";
  if (v.includes("mês") || v.includes("mes")) return "morno";
  return "frio";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    nome,
    whatsapp,
    whatsapp_country,
    email,
    interesse,
    urgencia,
    mensagem,
    cidade,
    source = "unknown",
    page_url,
    landing_path,
    form_path,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    event_id,
    ts,
    consent,
    consent_ts,
    consent_marketing,
  } = body as Record<string, string | number | boolean | undefined>;

  // Consentimento de marketing do banner. Só ele libera o envio de PII à Meta.
  // Ausente ou qualquer coisa diferente de true significa negado.
  const marketingConsentido = consent_marketing === true;

  const phoneClean = String(whatsapp || "").replace(/\D/g, "");
  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    "";
  if (excedeuLimite(ip)) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas seguidas. Tente de novo em alguns minutos." },
      { status: 429 }
    );
  }

  const ipCountry =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;
  // Cidade/regiao aproximadas pelo IP (headers de geo da Vercel)
  const ipCityRaw = req.headers.get("x-vercel-ip-city");
  const ipRegion = req.headers.get("x-vercel-ip-country-region");
  let ipCity: string | null = null;
  try {
    ipCity = ipCityRaw ? decodeURIComponent(ipCityRaw) : null;
  } catch {
    ipCity = ipCityRaw;
  }
  const cidadePorIp = [ipCity, ipRegion].filter(Boolean).join(", ") || null;
  const cidadeFinal =
    cidade && String(cidade).trim() ? String(cidade) : cidadePorIp;

  // Validação de input (endpoint público que grava via service role)
  const nomeStr = String(nome ?? "").trim();
  if (nomeStr.length < 2) {
    return NextResponse.json({ ok: false, error: "Nome inválido." }, { status: 400 });
  }
  if (phoneClean.length < 8) {
    return NextResponse.json({ ok: false, error: "WhatsApp inválido." }, { status: 400 });
  }
  const emailStr = email ? String(email).trim() : "";
  if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return NextResponse.json({ ok: false, error: "E-mail inválido." }, { status: 400 });
  }
  // Truncagem (anti-payload gigante). null quando vazio.
  const trunc = (v: unknown, n: number) => {
    const s = v == null ? "" : String(v);
    return s ? s.slice(0, n) : null;
  };
  const safe = {
    nome: nomeStr.slice(0, 120),
    whatsapp: String(whatsapp).slice(0, 40),
    whatsapp_country: whatsapp_country ? String(whatsapp_country).toUpperCase().slice(0, 4) : "BR",
    email: emailStr ? emailStr.slice(0, 160) : null,
    cidade: cidadeFinal ? String(cidadeFinal).slice(0, 120) : null,
    interesse: trunc(interesse, 120),
    urgencia: trunc(urgencia, 60),
    mensagem: trunc(mensagem, 2000),
    source: trunc(source, 80) || "unknown",
    page_url: trunc(page_url, 500),
    landing_path: trunc(landing_path, 200),
    form_path: trunc(form_path, 200),
    referrer: trunc(referrer, 500),
    user_agent: ua.slice(0, 400),
    ip_country: ipCountry,
    utm_source: trunc(utm_source, 200),
    utm_medium: trunc(utm_medium, 200),
    utm_campaign: trunc(utm_campaign, 200),
    utm_content: trunc(utm_content, 200),
    utm_term: trunc(utm_term, 200),
    gclid: trunc(gclid, 200),
    fbclid: trunc(fbclid, 200),
  };

  // Salva no Supabase se configurado.
  //
  // O supabase-js não lança em erro de API: devolve { error }. Ignorar esse
  // retorno é como o lead sumia sem deixar rastro — a rota respondia ok, a tela
  // dizia "enviado", o Pixel contava a conversão e o CRM ficava sem a linha.
  // Aqui a gravação é pré-requisito: sem ela, ninguém dispara nada.
  let gravou = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && nome && whatsapp) {
    const sb = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { error } = await sb.from("leads").insert({
      ...safe,
      // Classificado na gravação, não na leitura: é o que permite o painel
      // filtrar por origem com índice em vez de carregar tudo e descartar.
      canal: classificaCanal(safe),
      temperatura: temperaturaFromUrgencia(urgencia ? String(urgencia) : undefined),
      fase: "novo",
      consent: consent === true,
      consent_ts: typeof consent_ts === "string" ? consent_ts : null,
      consent_marketing: marketingConsentido,
    });
    if (error) {
      console.error("[lead] falha ao gravar", {
        code: error.code,
        message: error.message,
        details: error.details,
        source: safe.source,
      });
      return NextResponse.json(
        { ok: false, error: "Não conseguimos registrar seu contato agora. Tente de novo em instantes." },
        { status: 500 }
      );
    }
    gravou = true;
  }

  // Meta CAPI — IDs/segredos vêm da aba Marketing do admin (fallback p/ env).
  const mkt = await getMarketingSettings();
  const PIXEL = mkt.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const TOKEN = mkt.meta_capi_token || process.env.META_CAPI_ACCESS_TOKEN;
  const TEST = mkt.meta_capi_test_code || process.env.META_CAPI_TEST_CODE;

  // O lead é gravado de qualquer jeito (é o dado do atendimento), mas sem
  // consentimento de marketing nada de PII, nem hasheada, sai para a Meta.
  // O CAPI exige ao menos um identificador de usuário, então o evento inteiro
  // é suprimido em vez de enviado sem user_data.
  if (PIXEL && TOKEN && marketingConsentido) {
    const userData: Record<string, string | string[]> = {
      client_user_agent: ua,
      client_ip_address: ip,
    };
    if (phoneClean) userData.ph = [sha(phoneClean)];
    if (email) userData.em = [sha(String(email))];
    if (nome) {
      const [first, ...rest] = String(nome).trim().split(/\s+/);
      if (first) userData.fn = [sha(first)];
      if (rest.length) userData.ln = [sha(rest.join(" "))];
    }

    const payload = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Number(ts ?? Date.now()) / 1000),
          event_id: event_id ?? crypto.randomUUID(),
          action_source: "website",
          event_source_url: normalizaUrl(
            (page_url as string) ?? req.headers.get("referer") ?? undefined
          ),
          user_data: userData,
          // custom_data NÃO leva interesse nem urgência: procedimento estético
          // associado a uma pessoa é dado de saúde para a Meta, e o preço de
          // mandar isso é bloqueio do domínio. O dado continua no CRM, que é
          // onde ele serve para atender.
          custom_data: {
            // Nem interesse, nem urgência, nem o nome do procedimento pelo
            // caminho do botão: "tratamento-laser-co2" identifica o
            // procedimento tão bem quanto o campo interesse identificaria.
            content_name: rotuloNeutro(String(source)),
            value: 0,
            currency: "BRL",
          },
        },
      ],
      ...(TEST ? { test_event_code: TEST } : {}),
    };

    fetch(
      `https://graph.facebook.com/v20.0/${PIXEL}/events?access_token=${TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    ).catch(() => undefined);
  }

  // Webhook externo opcional — envia payload normalizado (nunca o body cru), e
  // só depois de o lead existir no banco: destino externo não pode receber
  // contato que o CRM não tem.
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook && gravou) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...safe, event_id: event_id ?? null, ts: ts ?? null }),
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
