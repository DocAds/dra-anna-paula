"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { leadModal } from "@/lib/leadModal";
import { whatsappLink } from "@/lib/site";
import { interessesLead } from "@/lib/tratamentos";
import { newEventId, readClickId, trackLead } from "@/lib/tracking";
import { openWhatsapp } from "@/lib/whatsapp";
import { getConsent } from "@/lib/consent";

const INTERESSES = interessesLead;

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
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLFormElement>(null);

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
      setStep(1);
      setConsent(false);
    }
  }, [vis.open]);

  function goToStep2() {
    const nome = String(new FormData(formRef.current!).get("nome") || "").trim();
    if (!nome) {
      alert("Por favor preencha seu nome.");
      return;
    }
    if (!phone || phone.length < 6) {
      alert("Por favor preencha o WhatsApp.");
      return;
    }
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== 2) {
      goToStep2();
      return;
    }
    if (!phone || phone.length < 6) {
      alert("Por favor preencha o WhatsApp.");
      return;
    }
    if (!consent) {
      alert("Para enviar, confirme que você leu e concorda com a Política de Privacidade.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const mensagemExtra = String(fd.get("mensagem") || "").trim();
    if (!nome) return;

    const eventId = newEventId();
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
      consent: true,
      consent_ts: new Date().toISOString(),
      // Consentimento de cookies: separado do checkbox do formulário. É ele que
      // libera o CAPI a mandar PII pra Meta.
      consent_marketing: getConsent().marketing,
      ts: Date.now(),
    };

    const msg =
      `Olá Dra. Anna, sou ${nome}.\n` +
      `Tenho interesse em: ${interesse}.\n` +
      `Urgência: ${urgencia}.\n` +
      (mensagemExtra ? `Mensagem: ${mensagemExtra}\n` : "") +
      (vis.message ? `Origem: ${vis.message}` : "");

    trackLead({ source: payload.source, eventId });

    // Abre antes de qualquer await: fora do gesto do usuário o popup é barrado.
    // O lead vai pro banco em paralelo, com keepalive, e não segura o redirect.
    openWhatsapp(whatsappLink(msg));
    setSent(true);

    start(async () => {
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch {
        /* o WhatsApp já abriu; não bloqueia o contato */
      }
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
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4"
        >
          <div
            className="fixed inset-0 bg-ink/55 backdrop-blur-sm"
            onClick={() => leadModal.close()}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain bg-porcelain rounded-3xl p-6 md:p-9 shadow-2xl"
          >
            <button
              onClick={() => leadModal.close()}
              aria-label="Fechar"
              className="absolute top-4 right-4 p-2 text-ink/45 hover:text-cocoa transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] uppercase tracking-widest3 text-toffee">
                Agendar avaliação
              </div>
              <div className="text-[10px] uppercase tracking-widest3 text-ink/40">
                Etapa {step} de 2
              </div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-2 text-balance">
              Conte um pouco sobre você.
            </h2>
            <p className="text-sm text-ink/65 mb-6">
              Vamos retornar pelo WhatsApp com a primeira disponibilidade.
            </p>

            <form ref={formRef} onSubmit={onSubmit} className="grid gap-5">
              <div className={step === 1 ? "grid gap-5" : "hidden"}>
                <Field label="Nome completo" name="nome" autoComplete="name" />

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

                <button
                  type="button"
                  onClick={goToStep2}
                  className="mt-2 rounded-full bg-cocoa text-bone py-4 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
                >
                  Próximo →
                </button>
              </div>

              <div className={step === 2 ? "grid gap-5" : "hidden"}>
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

                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-cocoa/25 text-ink/65 px-5 py-4 text-[12px] uppercase tracking-widest2 hover:border-cocoa hover:text-cocoa transition-colors"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={pending || !consent}
                    className="flex-1 rounded-full bg-cocoa text-bone py-4 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
                  >
                    {pending
                      ? "Enviando..."
                      : sent
                      ? "Abrindo WhatsApp →"
                      : "Continuar no WhatsApp"}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-ink/45">
                Seus dados são usados para entrar em contato e podem ser processados por
                nossos parceiros de tecnologia e marketing, conforme a{" "}
                <a href="/privacidade" target="_blank" rel="noopener" className="underline">
                  Política de Privacidade
                </a>.
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
