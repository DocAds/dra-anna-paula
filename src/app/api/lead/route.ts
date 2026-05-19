import { NextResponse } from "next/server";
import crypto from "node:crypto";

const sha = (v: string) =>
  crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    source = "unknown",
    phone,
    email,
    value = 0,
    event_id,
    ts,
  } = body as Record<string, unknown>;

  const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
  const TEST = process.env.META_CAPI_TEST_CODE;

  if (PIXEL && TOKEN) {
    const userData: Record<string, string | string[]> = {
      client_user_agent: req.headers.get("user-agent") ?? "",
      client_ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("cf-connecting-ip") ??
        "",
    };
    if (phone) userData.ph = [sha(String(phone).replace(/\D/g, ""))];
    if (email) userData.em = [sha(String(email))];

    const payload = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Number(ts ?? Date.now()) / 1000),
          event_id: event_id ?? crypto.randomUUID(),
          action_source: "website",
          event_source_url:
            req.headers.get("referer") ?? "https://draannabomtempo.com.br",
          user_data: userData,
          custom_data: {
            content_name: source,
            value: Number(value) || 0,
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
