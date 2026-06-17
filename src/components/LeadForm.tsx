"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { whatsappLink, SITE } from "@/lib/site";
import { interessesLead } from "@/lib/tratamentos";
import { readClickId } from "@/lib/tracking";
import { fireAdsConversion } from "@/lib/fire-conversion";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function LeadForm({ source = "contato" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [country, setCountry] = useState("br");
  const [phone, setPhone] = useState("");
  const [interesse, setInteresse] = useState(interessesLead[0]);
  const [consent, setConsent] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.country && setCountry(d.country))
      .catch(() => undefined);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || pending) return;

    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const mensagem = String(fd.get("mensagem") || "").trim();

    if (!nome) {
      alert("Por favor preencha seu nome.");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      alert("Por favor preencha um WhatsApp válido.");
      return;
    }
    if (!consent) {
      alert("Para enviar, confirme que você leu e concorda com a Política de Privacidade.");
      return;
    }

    setStatus("sending");
    const eventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const params = new URLSearchParams(window.location.search);

    const payload = {
      nome,
      whatsapp: phone,
      whatsapp_country: country.toUpperCase(),
      email: email || undefined,
      interesse,
      mensagem: mensagem || undefined,
      source: `form:${source}`,
      page_url: window.location.href,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_content: params.get("utm_content") || undefined,
      utm_term: params.get("utm_term") || undefined,
      gclid: params.get("gclid") || readClickId("gclid") || undefined,
      fbclid: params.get("fbclid") || readClickId("fbclid") || undefined,
      event_id: eventId,
      consent: true,
      consent_ts: new Date().toISOString(),
      ts: Date.now(),
    };

    // Pixel + GA com dedupe pelo mesmo event_id do CAPI (server)
    if (window.fbq) {
      window.fbq("track", "Lead", { content_name: payload.source, value: 0, currency: "BRL" }, { eventID: eventId });
    }
    if (window.gtag) {
      window.gtag("event", "generate_lead", {
        currency: "BRL",
        value: 0,
        transaction_id: eventId,
        source: payload.source,
      });
    }
    if (window.dataLayer) {
      window.dataLayer.push({ event: "lead", source: payload.source, event_id: eventId });
    }
    fireAdsConversion("lead", { transaction_id: eventId });

    const msg =
      `Olá Dra. Anna, sou ${nome}.\n` +
      `Tenho interesse em: ${interesse}.\n` +
      (mensagem ? `Mensagem: ${mensagem}` : "");

    start(async () => {
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatus("sent");
        window.open(`https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(msg)}`, "_blank");
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="text-[11px] uppercase tracking-widest3 text-toffee">Agendar avaliação</div>
      <h3 className="font-display text-3xl text-ink">Conte um pouco sobre você.</h3>

      <Field label="Nome completo" name="nome" autoComplete="name" required />

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest3 text-ink/55">WhatsApp</span>
          <PhoneInput
            defaultCountry={country}
            value={phone}
            onChange={(v, meta) => {
              setPhone(v);
              if (meta?.country?.iso2) setCountry(meta.country.iso2);
            }}
            className="anna-phone mt-1"
            inputClassName="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink"
            countrySelectorStyleProps={{
              buttonClassName: "border-0 bg-transparent border-b border-cocoa/25 py-3",
              dropdownStyleProps: {
                className: "bg-porcelain border border-cocoa/15 rounded-2xl shadow-2xl",
              },
            }}
          />
        </label>
        <Field label="E-mail (opcional)" name="email" type="email" autoComplete="email" />
      </div>

      <label className="block">
        <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Tenho interesse em</span>
        <select
          value={interesse}
          onChange={(e) => setInteresse(e.target.value)}
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        >
          {interessesLead.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>

      <Field label="Mensagem (opcional)" name="mensagem" multiline />

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-cocoa"
          required
        />
        <span className="text-[12px] leading-relaxed text-ink/60">
          Li e concordo com a{" "}
          <a href="/privacidade" target="_blank" rel="noopener" className="underline text-cocoa">
            Política de Privacidade
          </a>{" "}
          e autorizo o contato pela equipe.
        </span>
      </label>

      <motion.button
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={status === "sending" || pending || !consent}
        className="mt-2 rounded-full bg-cocoa text-bone py-4 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
      >
        {status === "sending" || pending
          ? "Enviando..."
          : status === "sent"
          ? "Vamos continuar no WhatsApp →"
          : "Enviar e abrir WhatsApp"}
      </motion.button>

      {status === "sent" && (
        <p className="text-sm text-cocoa">Te encaminhei pro WhatsApp da clínica. Em breve retornaremos.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700">
          Tivemos um problema. Tente novamente ou fale direto no{" "}
          <a className="underline" href={whatsappLink()} target="_blank" rel="noopener">WhatsApp</a>.
        </p>
      )}

      <p className="text-[11px] text-ink/45 mt-1">
        Seus dados são usados para entrar em contato e podem ser processados por nossos
        parceiros de tecnologia e marketing, conforme a{" "}
        <a href="/privacidade" target="_blank" rel="noopener" className="underline">
          Política de Privacidade
        </a>.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  multiline,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  autoComplete?: string;
}) {
  const base =
    "w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink placeholder-ink/30 transition-colors";
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      {multiline ? (
        <textarea name={name} rows={3} required={required} className={`${base} resize-none mt-1`} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className={`${base} mt-1`}
        />
      )}
    </label>
  );
}
