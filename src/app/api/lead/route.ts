import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient as createSbClient } from "@supabase/supabase-js";

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

  // Salva no Supabase se configurado
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && nome && whatsapp) {
    const sb = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    await sb.from("leads").insert({
      nome: String(nome),
      whatsapp: String(whatsapp),
      whatsapp_country: whatsapp_country ? String(whatsapp_country).toUpperCase() : "BR",
      email: email ? String(email) : null,
      cidade: cidade ? String(cidade) : null,
      interesse: interesse ? String(interesse) : null,
      urgencia: urgencia ? String(urgencia) : null,
      mensagem: mensagem ? String(mensagem) : null,
      source: String(source || "unknown"),
      page_url: page_url ? String(page_url) : null,
      user_agent: ua,
      ip_country: ipCountry,
      utm_source: utm_source ? String(utm_source) : null,
      utm_medium: utm_medium ? String(utm_medium) : null,
      utm_campaign: utm_campaign ? String(utm_campaign) : null,
      utm_content: utm_content ? String(utm_content) : null,
      utm_term: utm_term ? String(utm_term) : null,
      gclid: gclid ? String(gclid) : null,
      fbclid: fbclid ? String(fbclid) : null,
      temperatura: temperaturaFromUrgencia(urgencia ? String(urgencia) : undefined),
      fase: "novo",
    });
  }

  // Meta CAPI
  const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
  const TEST = process.env.META_CAPI_TEST_CODE;

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

  // Webhook externo opcional
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
