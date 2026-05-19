"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { leadModal } from "@/lib/leadModal";
import { SITE } from "@/lib/site";
import { readClickId } from "@/lib/tracking";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const INTERESSES = [
  "Avaliação geral",
  "Rejuvenescimento facial",
  "Lasers e manchas",
  "Injetáveis",
  "Skinbooster e qualidade de pele",
  "Outro",
] as const;

const URGENCIAS = [
  { v: "Hoje", t: "hoje" },
  { v: "Esta semana", t: "esta semana" },
  { v: "Este mês", t: "este mês" },
  { v: "Sem pressa", t: "sem pressa" },
] as const;

export function LeadQualifyModal() {
  const [vis, setVis] = useState(leadModal.get());
  const [country, setCountry] = useState<string>("br");
  const [phone, setPhone] = useState("");
  const [interesse, setInteresse] = useState<string>(INTERESSES[0]);
  const [urgencia, setUrgencia] = useState<string>(URGENCIAS[1].t);
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const unsub = leadModal.subscribe(setVis);
    return () => { unsub(); };
  }, []);
  useEffect(() => {
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.country && setCountry(d.country))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!vis.open) {
      setSent(false);
      setPhone("");
    }
  }, [vis.open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!phone || phone.length < 6) {
      alert("Por favor preencha o WhatsApp.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const mensagemExtra = String(fd.get("mensagem") || "").trim();
    if (!nome) return;

    const eventId = crypto.randomUUID();
    const params = new URLSearchParams(window.location.search);

    const payload = {
      nome,
      whatsapp: phone,
      whatsapp_country: country.toUpperCase(),
      email: email || undefined,
      interesse,
      urgencia,
      mensagem: mensagemExtra || undefined,
      source: vis.source || "modal",
      page_url: window.location.href,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_content: params.get("utm_content") || undefined,
      utm_term: params.get("utm_term") || undefined,
      gclid: params.get("gclid") || readClickId("gclid") || undefined,
      fbclid: params.get("fbclid") || readClickId("fbclid") || undefined,
      event_id: eventId,
      ts: Date.now(),
    };

    // Pixel client-side (dedupe via eventID)
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq(
        "track",
        "Lead",
        { content_name: payload.source, value: 0, currency: "BRL" },
        { eventID: eventId }
      );
    }
    if (window.gtag) {
      window.gtag("event", "generate_lead", {
        currency: "BRL",
        value: 0,
        transaction_id: eventId,
        source: payload.source,
      });
    }

    start(async () => {
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* segue mesmo se falhar — abre WhatsApp */
      }

      const msg =
        `Olá Dra. Anna, sou ${nome}.\n` +
        `Tenho interesse em: ${interesse}.\n` +
        `Urgência: ${urgencia}.\n` +
        (mensagemExtra ? `Mensagem: ${mensagemExtra}\n` : "") +
        (vis.message ? `Origem: ${vis.message}` : "");

      setSent(true);
      const url = `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      setTimeout(() => leadModal.close(), 400);
    });
  }

  return (
    <AnimatePresence>
      {vis.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
            onClick={() => leadModal.close()}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg bg-porcelain rounded-3xl p-7 md:p-9 shadow-2xl"
          >
            <button
              onClick={() => leadModal.close()}
              aria-label="Fechar"
              className="absolute top-4 right-4 p-2 text-ink/45 hover:text-cocoa transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-4">
              Agendar avaliação
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-2 text-balance">
              Conte um pouco sobre você.
            </h2>
            <p className="text-sm text-ink/65 mb-6">
              Vamos retornar pelo WhatsApp com a primeira disponibilidade.
            </p>

            <form onSubmit={onSubmit} className="grid gap-5">
              <Field label="Nome completo" name="nome" required autoComplete="name" />

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

              <label className="block">
                <span className="text-[10px] uppercase tracking-widest3 text-ink/55">
                  Tenho interesse em
                </span>
                <select
                  value={interesse}
                  onChange={(e) => setInteresse(e.target.value)}
                  className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
                >
                  {INTERESSES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </label>

              <div>
                <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">
                  Qual a urgência?
                </div>
                <div className="flex flex-wrap gap-2">
                  {URGENCIAS.map((u) => (
                    <button
                      key={u.t}
                      type="button"
                      onClick={() => setUrgencia(u.t)}
                      className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors border ${
                        urgencia === u.t
                          ? "bg-cocoa text-bone border-cocoa"
                          : "border-cocoa/25 text-ink/65 hover:border-cocoa hover:text-cocoa"
                      }`}
                    >
                      {u.v}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Mensagem (opcional)" name="mensagem" multiline />

              <button
                type="submit"
                disabled={pending}
                className="mt-2 rounded-full bg-cocoa text-bone py-4 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
              >
                {pending
                  ? "Enviando..."
                  : sent
                  ? "Abrindo WhatsApp →"
                  : "Continuar no WhatsApp"}
              </button>
              <p className="text-[11px] text-ink/45">
                Seus dados são tratados com sigilo médico.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  multiline,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          rows={3}
          required={required}
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1 resize-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        />
      )}
    </label>
  );
}
