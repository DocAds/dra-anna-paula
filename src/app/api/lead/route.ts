import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { getMarketingSettings } from "@/lib/marketing";

const sha = (v: string) =>
  crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

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
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    fbclid,
    event_id,
    ts,
  } = body as Record<string, string | number | undefined>;

  const phoneClean = String(whatsapp || "").replace(/\D/g, "");
  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    "";
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

  // Salva no Supabase se configurado
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && nome && whatsapp) {
    const sb = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    await sb.from("leads").insert({
      ...safe,
      temperatura: temperaturaFromUrgencia(urgencia ? String(urgencia) : undefined),
      fase: "novo",
    });
  }

  // Meta CAPI — IDs/segredos vêm da aba Marketing do admin (fallback p/ env).
  const mkt = await getMarketingSettings();
  const PIXEL = mkt.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const TOKEN = mkt.meta_capi_token || process.env.META_CAPI_ACCESS_TOKEN;
  const TEST = mkt.meta_capi_test_code || process.env.META_CAPI_TEST_CODE;

  if (PIXEL && TOKEN) {
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
          event_source_url:
            (page_url as string) ??
            req.headers.get("referer") ??
            "https://draannabomtempo.com.br",
          user_data: userData,
          custom_data: {
            content_name: String(source),
            interesse: interesse ? String(interesse) : undefined,
            urgencia: urgencia ? String(urgencia) : undefined,
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

  // Webhook externo opcional — envia payload normalizado (nunca o body cru).
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...safe, event_id: event_id ?? null, ts: ts ?? null }),
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
